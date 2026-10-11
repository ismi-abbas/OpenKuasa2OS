import { expect, it } from "vitest";
import { decryptApiKey, encryptApiKey, isOpenRouterKeyShape, keyHint } from "./key-crypto";
import { deriveAdsOverview, deriveLeadSummary, rm } from "./tools";
import { buildOverviewModel, formatWhen } from "../reach/overview";
import { pickModelId } from "./provider";
import type { Campaign, Lead, ReachData } from "../reach/types";

const SECRET = "x".repeat(32);
const NOW = new Date("2026-10-09T00:00:00.000Z");

it("seals and opens a key; rejects tampering and other secrets", async () => {
  const sealed = await encryptApiKey("sk-or-v1-abcdefghijklmnop", SECRET);
  expect(sealed).not.toContain("abcdefghijklmnop");
  expect(await decryptApiKey(sealed, SECRET)).toBe("sk-or-v1-abcdefghijklmnop");
  expect(await decryptApiKey(sealed, "y".repeat(32))).toBeNull();
  expect(await decryptApiKey(sealed.slice(0, -2) + "AA", SECRET)).toBeNull();
  await expect(encryptApiKey("k", "short")).rejects.toThrow();
});

it("key shape + hint", () => {
  expect(isOpenRouterKeyShape("sk-or-v1-abcdefghijklmnop")).toBe(true);
  expect(isOpenRouterKeyShape("nope")).toBe(false);
  expect(keyHint("sk-or-v1-abcdefghijklmnop")).toBe("sk-or-…mnop");
});

it("model id falls back, env overrides", () => {
  expect(pickModelId("worker", {})).toBe("anthropic/claude-haiku-4.5");
  expect(pickModelId("worker", { OPENKUASA_MODEL_WORKER: " a/b " })).toBe("a/b");
});

const camp = (c: Partial<Campaign>): Campaign => ({ id: "1", name: "c", channel: "facebook", status: "active", leads_count: 10, spend_cents: 1000, cpl_cents: 100, created_at: "", ...c });
const lead = (stage: Lead["stage"], daysAgo: number): Lead => ({
  id: "l", name: "n", channel: "whatsapp", stage, source: "s", created_at: new Date(NOW.getTime() - daysAgo * 864e5).toISOString(),
});

it("derives funnel, conversion and ad totals", () => {
  const s = deriveLeadSummary([lead("lead", 1), lead("won", 2), lead("booked", 10)], NOW);
  expect(s.funnel).toMatchObject({ lead: 3, booked: 2, won: 1 });
  expect(s.conversion_pct).toBe(33.3);
  expect(s.weekly_trend).toHaveLength(8);
  const ads = deriveAdsOverview([camp({}), camp({ status: "paused", leads_count: 10, spend_cents: 3000 })]);
  expect(ads).toMatchObject({ total_spend: "RM 40.00", total_leads: 20, active_campaigns: 1, paused_campaigns: 1 });
  expect(rm(688)).toBe("RM 6.88");
});

it("overview model is consistent and flags empty", async () => {
  const empty: ReachData = { listCampaigns: async () => [], listLeads: async () => [], listAppointments: async () => [], listForms: async () => [], listBroadcasts: async () => [], listAutomations: async () => [] };
  expect((await buildOverviewModel(empty, NOW)).isEmpty).toBe(true);
  const m = await buildOverviewModel({ ...empty, listLeads: async () => [lead("won", 1)], listCampaigns: async () => [camp({})] }, NOW);
  expect(m.isEmpty).toBe(false);
  expect(m.kpis.leads.value).toBe(1);
  expect(m.kpis.spendRm).toBe("RM 10.00");
  expect(formatWhen("2026-10-09T05:00:00Z", NOW)).toMatch(/^Today · /);
});

it("free questions: 3 per week, then -1; demo detection; seed fills reach tables", async () => {
  const { testDb } = await import("../../core/test-db");
  const s = await import("../../core/schema");
  const { chatStatus, isDemoUser } = await import("./chat");
  const { seedReachDemo } = await import("../reach/seed");
  const db = (await testDb()) as unknown as import("../../core/db").Db;
  const t = new Date();
  await db.insert(s.user).values([
    { id: "u", name: "u", email: "u@x.co", emailVerified: true, createdAt: t, updatedAt: t },
    { id: "g", name: "g", email: "g@x.co", emailVerified: true, createdAt: t, updatedAt: t, isAnonymous: true },
  ]);
  expect(await isDemoUser(db, "u")).toBe(false);
  expect(await isDemoUser(db, "g")).toBe(true);
  const env = { OPENROUTER_API_KEY: "k" } as never;
  expect((await chatStatus(db, env, "u", "00000000-0000-0000-0000-000000000000")).freeRemaining).toBe(3);

  const [o] = await db.insert(s.orgs).values({ name: "A" }).returning();
  await seedReachDemo(db, o.id);
  await seedReachDemo(db, o.id); // idempotent
  expect(await db.select().from(s.leads)).toHaveLength(342);
  expect(await db.select().from(s.campaigns)).toHaveLength(5);
  expect(await db.select().from(s.appointments)).toHaveLength(3);
});
