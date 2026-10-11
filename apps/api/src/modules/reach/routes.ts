import { Hono } from "hono";
import type { Env } from "../../core/env";
import { asc, desc, eq } from "drizzle-orm";
import { type DbOrTx, withDb } from "../../core/db";
import { requireOrg } from "../../core/org";
import type { AppEnv } from "../../core/types";
import { runAds } from "../ai/agents";
import { prepareChat } from "../ai/chat";
import { buildOverviewModel } from "./overview";
import { DEMO_SLUG, seedReachDemo } from "./seed";
import { appointments, campaigns, leads, orgs } from "../../core/schema";
import type { Campaign, Lead, ReachData } from "./types";

export { seedReachDemo };

// Every read is scoped to the org (replaces RLS). Forms/broadcasts/automations have no tables yet.
const iso = (d: Date) => d.toISOString();
const reachData = (db: DbOrTx, orgId: string): ReachData => ({
  listCampaigns: async () =>
    (await db.select().from(campaigns).where(eq(campaigns.orgId, orgId)).orderBy(desc(campaigns.createdAt))).map((r) => ({
      id: r.id, name: r.name, channel: r.channel as Campaign["channel"], status: r.status as Campaign["status"],
      leads_count: r.leadsCount, spend_cents: r.spendCents, cpl_cents: r.cplCents ?? 0, created_at: iso(r.createdAt),
    })),
  listLeads: async () =>
    (await db.select().from(leads).where(eq(leads.orgId, orgId)).orderBy(desc(leads.createdAt))).map((r) => ({
      id: r.id, name: r.name, channel: r.channel as Lead["channel"], stage: r.stage as Lead["stage"],
      source: r.source ?? "", created_at: iso(r.createdAt),
    })),
  listAppointments: async () =>
    (await db.select().from(appointments).where(eq(appointments.orgId, orgId)).orderBy(asc(appointments.scheduledAt))).map((r) => ({
      id: r.id, contact_name: r.contactName, kind: r.kind, scheduled_at: iso(r.scheduledAt),
      via: r.via ?? "", created_at: iso(r.createdAt),
    })),
  listForms: async () => [],
  listBroadcasts: async () => [],
  listAutomations: async () => [],
});

export const reach = new Hono<AppEnv>();
reach.use("*", requireOrg);

reach.get("/overview", async (c) =>
  c.json(await buildOverviewModel(reachData(c.var.db, c.var.org.orgId), new Date())),
);

// Ask-Api.
reach.post("/chat", async (c) => {
  const chat = await prepareChat(c);
  if (!chat.ok) return chat.response;
  return runAds(c.env, chat.messages, reachData(c.var.db, c.var.org.orgId), c.req.raw.signal, chat.apiKey).toUIMessageStreamResponse({
    onError: (e) => (console.error("[ask-ads] stream error:", e), "Api ran into a problem. Please try again in a moment."),
  });
});

// Hourly Cron Trigger: keep the shared demo org's Reach data fresh (replaces pg_cron).
export const reachDemoCron = (env: Env) =>
  withDb(env, (db) =>
    db.transaction(async (tx) => {
      const [org] = await tx.select({ id: orgs.id }).from(orgs).where(eq(orgs.slug, DEMO_SLUG));
      if (org) await seedReachDemo(tx, org.id);
    }),
  );
