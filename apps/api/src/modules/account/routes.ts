import { Hono } from "hono";
import { z } from "zod";
import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { DbOrTx } from "../../core/db";
import { logEvent } from "../../core/events";
import { can, requireOrg } from "../../core/org";
import { activityLog, notifications, orgMembers, orgs, profiles } from "../../core/schema";
import type { AppEnv } from "../../core/types";

export const account = new Hono<AppEnv>();

const AVATAR_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const AVATAR_MAX = 2 * 1024 * 1024;
const AVATAR_KEY = /^[\w-]+\/\d{1,16}\.(jpg|png|webp)$/;
export const avatarUrl = (key: string | null) => (key ? `/api/account/avatar/${key}` : null);

// Public like the old `avatars` bucket (team mates' photos show in the nav); keys are unguessable-ish and immutable.
account.get("/avatar/*", async (c) => {
  const key = decodeURIComponent(c.req.path.split("/avatar/")[1] ?? "");
  if (!AVATAR_KEY.test(key)) return c.json({ error: "not found" }, 404);
  const obj = await c.env.AVATARS.get(key);
  if (!obj) return c.json({ error: "not found" }, 404);
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
});

account.use("*", requireOrg);

const fail = (c: { json: (b: unknown, s: 400) => Response }, e: z.ZodError) => c.json({ error: e.issues[0].message }, 400);
const text = (max: number) => z.string().trim().max(max);
const validTz = (tz: string) => {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
};

// ---- profile -------------------------------------------------------------
account.get("/profile", async (c) => {
  const [p] = await c.var.db.select().from(profiles).where(eq(profiles.userId, c.var.userId!));
  if (!p) return c.json({ error: "no profile" }, 404);
  return c.json({
    fullName: p.fullName ?? "", email: p.email, avatarUrl: avatarUrl(p.avatarPath), phone: p.phone ?? "",
    jobTitle: p.jobTitle ?? "", timezone: p.timezone, language: p.language, productUpdates: p.productUpdates,
    notificationPrefs: p.notificationPrefs,
  });
});

const profileInput = z.object({
  fullName: text(120).min(1, "Please enter your name."),
  phone: text(40),
  jobTitle: text(120),
  timezone: z.string().refine(validTz, "Choose a valid timezone."),
  language: z.enum(["en", "ms"]),
  productUpdates: z.boolean(),
});

account.put("/profile", async (c) => {
  const parsed = profileInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return fail(c, parsed.error);
  const v = parsed.data;
  await c.var.db.transaction(async (tx) => {
    await tx.update(profiles)
      .set({ fullName: v.fullName, phone: v.phone || null, jobTitle: v.jobTitle || null, timezone: v.timezone, language: v.language, productUpdates: v.productUpdates })
      .where(eq(profiles.userId, c.var.userId!));
    await logEvent(tx, { orgId: c.var.org.orgId, actorId: c.var.userId!, action: "Updated their profile", category: "data" });
  });
  return c.json({ notice: "Profile saved." });
});

// ---- avatar --------------------------------------------------------------
const setAvatar = async (c: { env: AppEnv["Bindings"]; var: AppEnv["Variables"] }, key: string | null, action: string) => {
  const [old] = await c.var.db.select({ avatarPath: profiles.avatarPath }).from(profiles).where(eq(profiles.userId, c.var.userId!));
  await c.var.db.transaction(async (tx) => {
    await tx.update(profiles).set({ avatarPath: key }).where(eq(profiles.userId, c.var.userId!));
    await logEvent(tx, { orgId: c.var.org.orgId, actorId: c.var.userId!, action, category: "data" });
  });
  // Best effort: a leftover object is harmless, a failed save is not.
  if (old?.avatarPath && old.avatarPath !== key) await c.env.AVATARS.delete(old.avatarPath).catch(() => {});
};

account.post("/avatar", async (c) => {
  const file = (await c.req.parseBody().catch(() => ({} as Record<string, unknown>)))["file"];
  if (!(file instanceof File)) return c.json({ error: "Choose an image." }, 400);
  const ext = AVATAR_TYPES[file.type as keyof typeof AVATAR_TYPES];
  if (!ext) return c.json({ error: "Please choose a JPG, PNG or WebP image." }, 400);
  if (file.size === 0) return c.json({ error: "That file is empty." }, 400);
  if (file.size > AVATAR_MAX) return c.json({ error: "Photos can be up to 2MB." }, 400);
  // Timestamp in the key = a new URL per upload, so browsers never show the old photo.
  const key = `${c.var.userId}/${Date.now()}.${ext}`;
  await c.env.AVATARS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  try {
    await setAvatar(c, key, "Updated their profile photo");
  } catch (e) {
    await c.env.AVATARS.delete(key).catch(() => {});
    throw e;
  }
  return c.json({ notice: "Photo updated.", avatarUrl: avatarUrl(key) });
});

account.delete("/avatar", async (c) => {
  await setAvatar(c, null, "Removed their profile photo");
  return c.json({ notice: "Photo removed." });
});

// ---- company -------------------------------------------------------------
account.get("/company", async (c) => {
  const [o] = await c.var.db.select().from(orgs).where(eq(orgs.id, c.var.org.orgId));
  if (!o) return c.json({ error: "not found" }, 404);
  return c.json({
    name: o.name, registrationNo: o.registrationNo ?? "", sstNo: o.sstNo ?? "", website: o.website ?? "",
    industry: o.industry ?? "", companySize: o.companySize ?? "", address: o.address ?? "", city: o.city ?? "",
    state: o.state ?? "", postcode: o.postcode ?? "",
  });
});

const companyInput = z.object({
  name: text(120).min(1, "Please enter your company name."),
  registrationNo: text(40), sstNo: text(40), website: text(200), industry: text(60), companySize: text(20),
  address: text(200), city: text(80), state: text(40), postcode: text(12),
});

account.put("/company", async (c) => {
  if (!can(c.var.org.role, "manage-company")) return c.json({ error: "Only owners and admins can edit company details." }, 403);
  const parsed = companyInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return fail(c, parsed.error);
  const v = parsed.data;
  await c.var.db.transaction(async (tx) => {
    await tx.update(orgs).set({
      name: v.name, registrationNo: v.registrationNo || null, sstNo: v.sstNo || null, website: v.website || null,
      industry: v.industry || null, companySize: v.companySize || null, address: v.address || null,
      city: v.city || null, state: v.state || null, postcode: v.postcode || null,
    }).where(eq(orgs.id, c.var.org.orgId));
    await logEvent(tx, { orgId: c.var.org.orgId, actorId: c.var.userId!, action: "Updated company details", category: "data", target: v.name });
  });
  return c.json({ notice: "Company details saved." });
});

// ---- notification preferences & feed --------------------------------------
const EVENT_IDS = ["new_leads", "deal_stages", "payments", "team_activity", "weekly_summary", "product_updates"] as const;
const channelSet = z.object({ email: z.boolean(), push: z.boolean(), inapp: z.boolean() });
const time = z.string().regex(/^([01]\d|2[0-3]):00$/, "Please choose valid quiet hours.");
const prefsInput = z.object({
  channels: channelSet,
  events: z.object(Object.fromEntries(EVENT_IDS.map((e) => [e, channelSet]))),
  quiet: z.object({ enabled: z.boolean(), from: time, to: time }),
});

account.put("/notification-prefs", async (c) => {
  const parsed = prefsInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return fail(c, parsed.error);
  await c.var.db.transaction(async (tx) => {
    await tx.update(profiles).set({ notificationPrefs: parsed.data }).where(eq(profiles.userId, c.var.userId!));
    await logEvent(tx, { orgId: c.var.org.orgId, actorId: c.var.userId!, action: "Updated notification preferences", category: "data" });
  });
  return c.json({ notice: "Notification preferences saved." });
});

export const isAppHref = (h: string | null) => !!h && h.startsWith("/") && !h.startsWith("//") && !h.includes("\\");

const feed = async (db: DbOrTx, userId: string) => {
  const items = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(10);
  const [u] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return {
    items: items.map((n) => ({ id: n.id, title: n.title, body: n.body, href: isAppHref(n.href) ? n.href : null, read: n.readAt !== null, createdAt: n.createdAt })),
    unreadCount: u.n,
  };
};

account.get("/notifications", async (c) => c.json(await feed(c.var.db, c.var.userId!)));

account.post("/notifications/read", async (c) => {
  const id = z.uuid().safeParse((await c.req.json().catch(() => ({}))).id);
  if (!id.success) return c.json({ error: "bad id" }, 400);
  await c.var.db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, c.var.userId!), eq(notifications.id, id.data), isNull(notifications.readAt)));
  return c.json(await feed(c.var.db, c.var.userId!));
});

account.post("/notifications/read-all", async (c) => {
  await c.var.db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, c.var.userId!), isNull(notifications.readAt)));
  return c.json(await feed(c.var.db, c.var.userId!));
});

// ---- activity log ----------------------------------------------------------
export const ACTIVITY_CATEGORIES = ["all", "auth", "team", "data", "security", "billing"] as const;
export const ACTIVITY_DAYS = { "7d": 7, "30d": 30, "90d": 90, all: null } as const;
const PAGE = 50;

// Each field falls back on its own so one bad value doesn't reset the others.
export const activityFilters = z.object({
  category: z.enum(ACTIVITY_CATEGORIES).catch("all"),
  period: z.enum(Object.keys(ACTIVITY_DAYS) as [keyof typeof ACTIVITY_DAYS, ...(keyof typeof ACTIVITY_DAYS)[]]).catch("30d"),
  before: z.iso.datetime({ offset: true }).optional().catch(undefined),
});

export const periodStart = (period: keyof typeof ACTIVITY_DAYS, now = Date.now()) => {
  const days = ACTIVITY_DAYS[period];
  return days ? new Date(now - days * 864e5).toISOString() : null;
};

const ISO_US = sql<string>`to_char(${activityLog.createdAt} at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

account.get("/activity", async (c) => {
  const f = activityFilters.parse(c.req.query());
  const start = periodStart(f.period);
  const rows = await c.var.db
    .select({ id: activityLog.id, actorName: activityLog.actorName, action: activityLog.action, target: activityLog.target, category: activityLog.category, at: ISO_US })
    .from(activityLog)
    .where(and(
      eq(activityLog.orgId, c.var.org.orgId),
      f.category === "all" ? undefined : eq(activityLog.category, f.category),
      start ? gte(activityLog.createdAt, new Date(start)) : undefined,
      // String param keeps the cursor's microseconds (a Date would truncate to ms).
      f.before ? sql`${activityLog.createdAt} < ${f.before}::timestamptz` : undefined,
    ))
    .orderBy(desc(activityLog.createdAt))
    .limit(PAGE + 1);
  const page = rows.slice(0, PAGE);
  return c.json({
    entries: page.map((r) => ({ id: r.id, actorName: r.actorName.trim() || "System", action: r.action, target: r.target, category: r.category, createdAt: r.at })),
    // Microsecond-exact cursor so the next page starts right after this row.
    nextBefore: rows.length > PAGE ? page[PAGE - 1].at : null,
  });
});

// ---- account home: team ---------------------------------------
account.get("/home", async (c) => {
  const { orgId } = c.var.org;
  const team = await c.var.db
    .select({ userId: orgMembers.userId, role: orgMembers.role, fullName: profiles.fullName, email: profiles.email, avatarPath: profiles.avatarPath })
    .from(orgMembers)
    .innerJoin(profiles, eq(profiles.userId, orgMembers.userId))
    .where(and(eq(orgMembers.orgId, orgId), sql`${profiles.email} is not null`))
    .orderBy(orgMembers.createdAt);
  return c.json({
    team: team.map((m) => ({
      userId: m.userId, name: m.fullName?.trim() || m.email!.split("@")[0], email: m.email,
      avatarUrl: avatarUrl(m.avatarPath), role: m.role, isYou: m.userId === c.var.userId,
    })),
  });
});

// ---- security audit trail --------------------------------------------------
// Password / 2FA / sessions are changed by the web app through better-auth directly; it then reports
// the fact here so the activity log and the "security" notification keep working.
const SECURITY: Record<string, { action: string; notify?: { title: string; body: string } }> = {
  password_changed: { action: "Changed password", notify: { title: "Your password was changed", body: "If this was not you, reset your password now." } },
  signed_out_others: { action: "Signed out other devices" },
  mfa_on: { action: "Turned on two-factor authentication", notify: { title: "Two-factor authentication is on", body: "You will be asked for a code from your authenticator app when you sign in." } },
  mfa_off: { action: "Turned off two-factor authentication", notify: { title: "Two-factor authentication was turned off", body: "If this was not you, change your password and turn it back on." } },
  codes_regenerated: { action: "Regenerated recovery codes" },
  email_changed: { action: "Changed sign-in email", notify: { title: "Your sign-in email was changed", body: "If this was not you, contact your workspace owner." } },
};

account.post("/security-event", async (c) => {
  const body = z.object({ kind: z.enum(Object.keys(SECURITY) as [string, ...string[]]), target: text(254).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) return c.json({ error: "bad event" }, 400);
  const s = SECURITY[body.data.kind];
  await c.var.db.transaction((tx) =>
    logEvent(tx, {
      orgId: c.var.org.orgId, actorId: c.var.userId!, action: s.action, category: "security", target: body.data.target,
      notify: s.notify && { to: "self", event: "security", ...s.notify, href: "/account/security" },
    }),
  );
  return c.json({ ok: true });
});
