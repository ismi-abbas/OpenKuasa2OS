// Port of log_event / deliver_notification.
//   logEvent(db, { orgId, actorId, action, target?, category, notify?: { to: 'self'|'admins', event, title, body?, href? } })
// `db` is c.var.db or the `tx` of db.transaction(). Records one activity_log row (actor name from
// profiles) and optionally notifies the actor ('self') or the org's owners/admins other than the
// actor ('admins'). Viewers (incl. demo guests) are ignored, as in the old function. Callers must
// already have authorised the action.
import { and, eq, inArray, ne } from "drizzle-orm";
import type { DbOrTx } from "./db";
import { activityLog, notifications, orgMembers, profiles } from "./schema";

export type EventInput = {
  orgId: string;
  actorId: string;
  action: string;
  target?: string | null;
  category: "auth" | "team" | "data" | "security" | "billing";
  notify?: { to: "self" | "admins"; event?: string; title: string; body?: string | null; href?: string | null };
};

export const displayName = async (db: DbOrTx, userId: string) => {
  const [p] = await db.select({ name: profiles.fullName, email: profiles.email }).from(profiles).where(eq(profiles.userId, userId));
  return p?.name?.trim() || p?.email?.split("@")[0] || "Member";
};

// 'security' events are always delivered; others respect the user's in-app prefs.
export const deliverNotification = async (
  db: DbOrTx,
  n: { userId: string; orgId: string | null; event: string; title: string; body?: string | null; href?: string | null },
) => {
  if (n.event !== "security") {
    const [p] = await db.select({ prefs: profiles.notificationPrefs }).from(profiles).where(eq(profiles.userId, n.userId));
    const prefs = p?.prefs as { channels?: { inapp?: boolean }; events?: Record<string, { inapp?: boolean }> } | undefined;
    if (prefs?.channels?.inapp === false || prefs?.events?.[n.event]?.inapp === false) return;
  }
  await db.insert(notifications).values({
    userId: n.userId, orgId: n.orgId, event: n.event,
    title: n.title.slice(0, 200), body: n.body?.slice(0, 500) ?? null, href: n.href ?? null,
  });
};

export const logEvent = async (db: DbOrTx, e: EventInput) => {
  const [m] = await db.select({ role: orgMembers.role }).from(orgMembers)
    .where(and(eq(orgMembers.orgId, e.orgId), eq(orgMembers.userId, e.actorId)));
  if (!m || m.role === "viewer") return;
  await db.insert(activityLog).values({
    orgId: e.orgId, actorId: e.actorId, actorName: await displayName(db, e.actorId),
    action: e.action.slice(0, 200), target: e.target?.slice(0, 200) ?? null, category: e.category,
  });
  const n = e.notify;
  if (!n || (n.href && !n.href.startsWith("/"))) return;
  const base = { orgId: e.orgId, event: n.event ?? "team_activity", title: n.title, body: n.body, href: n.href };
  if (n.to === "self") return deliverNotification(db, { ...base, userId: e.actorId });
  const admins = await db.select({ userId: orgMembers.userId }).from(orgMembers)
    .where(and(eq(orgMembers.orgId, e.orgId), inArray(orgMembers.role, ["owner", "admin"]), ne(orgMembers.userId, e.actorId)));
  for (const a of admins) await deliverNotification(db, { ...base, userId: a.userId });
};
