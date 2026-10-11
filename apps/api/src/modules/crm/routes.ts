import { Hono } from "hono";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { canEditData, requireOrg } from "../../core/org";
import { crmContacts, profiles } from "../../core/schema";
import type { AppEnv } from "../../core/types";

const STATUS_LABELS: Record<string, string> = {
  lead: "New Leads",
  contacted: "Contacted",
  qualified: "Qualified",
  customer: "Customer",
  archived: "Archived",
};

type Row = {
  id: string; email: string | null; company: string | null; firstName: string;
  lastName: string | null; phone: string | null; country: string | null; status: string;
  leadScore: number; ownerName: string | null; lastInteractionAt: Date | null;
};

export const mapContact = (r: Row) => ({
  id: r.id,
  email: r.email ?? "",
  company: r.company ?? "Personal",
  first: r.firstName,
  last: r.lastName ?? "",
  phone: r.phone ?? "",
  country: r.country ?? "—",
  status: STATUS_LABELS[r.status] ?? null,
  score: r.leadScore,
  pic: r.ownerName,
  lastInteraction: r.lastInteractionAt
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
        .format(r.lastInteractionAt)
    : null,
});

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
// Same rules as the old parseCrmContactForm; messages are shown beside the form.
export const contactInput = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.preprocess(blank, z.string().trim().optional()),
  email: z.string().trim().toLowerCase().regex(/^\S+@\S+\.\S+$/, "Enter a valid email."),
  phone: z.preprocess(blank, z.string().trim().optional()),
  company: z.preprocess(blank, z.string().trim().optional()),
  country: z.preprocess(blank, z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a two-letter country code, such as MY.").default("MY")),
  status: z.enum(["lead", "contacted", "qualified", "customer"]).catch("lead"),
  leadScore: z.coerce.number().catch(0).transform((n) => Math.min(100, Math.max(0, Math.round(n)))),
});

export const crm = new Hono<AppEnv>();
crm.use("*", requireOrg);

crm.get("/contacts", async (c) => {
  const limit = Math.min(100, Number(c.req.query("limit")) || 20);
  const rows = await c.var.db
    .select({
      id: crmContacts.id, email: crmContacts.email, company: crmContacts.company, firstName: crmContacts.firstName,
      lastName: crmContacts.lastName, phone: crmContacts.phone, country: crmContacts.country, status: crmContacts.status,
      leadScore: crmContacts.leadScore, lastInteractionAt: crmContacts.lastInteractionAt,
      ownerName: profiles.fullName, total: sql<number>`count(*) over ()`,
    })
    .from(crmContacts)
    .leftJoin(profiles, eq(profiles.userId, crmContacts.ownerUserId))
    .where(eq(crmContacts.orgId, c.var.org.orgId))
    .orderBy(desc(crmContacts.createdAt))
    .limit(limit);
  return c.json({ contacts: rows.map(mapContact), total: Number(rows[0]?.total ?? 0) });
});

crm.post("/contacts", async (c) => {
  const { orgId, role } = c.var.org;
  if (!canEditData(role)) return c.json({ error: "forbidden" }, 403);
  const parsed = contactInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const v = parsed.data;
  const [row] = await c.var.db
    .insert(crmContacts)
    .values({
      orgId, firstName: v.firstName, lastName: v.lastName ?? null, email: v.email, phone: v.phone ?? null,
      company: v.company ?? null, country: v.country, status: v.status, leadScore: v.leadScore,
    })
    .returning();
  return c.json(mapContact({ ...row, ownerName: null }), 201);
});
