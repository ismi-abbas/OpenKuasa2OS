import { and, asc, desc, eq, gt, isNull, ne, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { seedReachDemo } from "../reach/seed";
import type { DbOrTx } from "../../core/db";
import { displayName, logEvent, deliverNotification } from "../../core/events";
import { can, requireOrg, requireUser } from "../../core/org";
import { activityLog, orgInvites, orgMembers, orgs, profiles, user } from "../../core/schema";
import type { AppEnv } from "../../core/types";

export const team = new Hono<AppEnv>();

const fail = (status: 400 | 403 | 404 | 409, message: string): never => {
  throw new HTTPException(status, { message });
};
const uuid = z.uuid();
const ROLES = z.enum(["admin", "member", "viewer"], "Please choose a valid role.");
const body = async (c: { req: { json: () => Promise<unknown> } }) => (await c.req.json().catch(() => ({}))) as any;

// Public: the accept page reads this before sign-in.
team.get("/invite/:token", async (c) => {
  if (!uuid.safeParse(c.req.param("token")).success) return c.json({ error: "invite not found" }, 404);
  const [r] = await c.var.db
    .select({
      orgName: orgs.name, email: orgInvites.email, role: orgInvites.role,
      status: sql<string>`case when ${orgInvites.acceptedAt} is not null then 'accepted' when ${orgInvites.revokedAt} is not null then 'revoked'
        when ${orgInvites.expiresAt} < now() then 'expired' else 'pending' end`,
    })
    .from(orgInvites).innerJoin(orgs, eq(orgs.id, orgInvites.orgId))
    .where(eq(orgInvites.token, c.req.param("token")));
  if (!r) return c.json({ error: "invite not found" }, 404);
  return c.json({ orgName: r.orgName, email: r.email, role: r.role, status: r.status });
});

// Joining a workspace needs only a session (no workspace yet).
team.post("/invite/:token/accept", requireUser, async (c) => {
  const userId = c.var.userId!;
  const token = c.req.param("token");
  if (!uuid.safeParse(token).success) return c.json({ error: "invite not found" }, 404);
  const orgId = await c.var.db.transaction(async (tx) => {
    const [u] = await tx.select({ email: sql<string>`lower(${user.email})`, isAnonymous: user.isAnonymous })
      .from(user).where(eq(user.id, userId));
    const [inv] = await tx
      .select({
        id: orgInvites.id, orgId: orgInvites.orgId, email: orgInvites.email, role: orgInvites.role,
        status: sql<string>`case when ${orgInvites.acceptedAt} is not null or ${orgInvites.revokedAt} is not null or ${orgInvites.expiresAt} < now() then 'used' else 'pending' end`,
      })
      .from(orgInvites).where(eq(orgInvites.token, token)).for("update");
    if (!inv) return fail(404, "This invite link is not valid.");
    if (inv.status !== "pending") return fail(409, "This invite has expired or was already used. Ask for a new one.");
    if (!u || u.isAnonymous || u.email !== inv.email) return fail(403, "This invite was sent to a different email address.");
    await tx.insert(orgMembers).values({ orgId: inv.orgId, userId, role: inv.role }).onConflictDoNothing();
    await tx.update(orgInvites).set({ acceptedAt: sql`now()` }).where(eq(orgInvites.id, inv.id));
    await tx.update(profiles).set({ currentOrgId: inv.orgId }).where(eq(profiles.userId, userId));
    const who = await displayName(tx, userId);
    const [o] = await tx.select({ name: orgs.name }).from(orgs).where(eq(orgs.id, inv.orgId));
    await tx.insert(activityLog).values({
      orgId: inv.orgId, actorId: userId, actorName: who, action: `Joined the workspace as ${inv.role}`, target: inv.email, category: "team",
    });
    const admins = await tx.select({ userId: orgMembers.userId }).from(orgMembers)
      .where(and(eq(orgMembers.orgId, inv.orgId), inArray(orgMembers.role, ["owner", "admin"]), ne(orgMembers.userId, userId)));
    for (const a of admins)
      await deliverNotification(tx, { userId: a.userId, orgId: inv.orgId, event: "team_activity",
        title: `${who} joined ${o.name}`, body: `${inv.email} accepted their invite.`, href: "/account/team" });
    return inv.orgId;
  });
  return c.json({ orgId });
});

// Onboarding: first workspace for a signed-in (non-demo) user.
team.post("/onboarding", requireUser, async (c) => {
  const userId = c.var.userId!;
  const p = z.object({ orgName: z.string().trim().min(1, "Please enter your business name.").max(120, "Business name must be 120 characters or fewer.") })
    .safeParse(await body(c));
  if (!p.success) return c.json({ error: p.error.issues[0].message }, 400);
  const orgId = await c.var.db.transaction(async (tx) => {
    const [u] = await tx.select({ isAnonymous: user.isAnonymous }).from(user).where(eq(user.id, userId));
    if (u?.isAnonymous) return fail(403, "Create an account to start your own workspace.");
    const [o] = await tx.insert(orgs).values({ name: p.data.orgName }).returning({ id: orgs.id });
    await tx.insert(orgMembers).values({ orgId: o.id, userId, role: "owner" });
    await tx.update(profiles).set({ currentOrgId: o.id }).where(eq(profiles.userId, userId));
    await logEvent(tx, { orgId: o.id, actorId: userId, action: "Created the workspace", target: p.data.orgName, category: "team" });
    return o.id;
  });
  return c.json({ orgId }, 201);
});

// Demo guests: the SPA signs in anonymously first, then calls this to join the seeded demo org as viewer.
team.post("/demo", requireUser, async (c) => {
  if (c.env.DEMO_ENABLED !== "1") return c.json({ error: "Demo is not available." }, 403);
  const userId = c.var.userId!;
  const [u] = await c.var.db.select({ isAnonymous: user.isAnonymous }).from(user).where(eq(user.id, userId));
  if (!u?.isAnonymous) return c.json({ error: "Demo is for guest sessions only." }, 403);
  const [demo] = await c.var.db.select({ id: orgs.id }).from(orgs).where(eq(orgs.slug, "rimba-ventures-demo"));
  if (!demo) return c.json({ error: "Demo is unavailable right now." }, 503);
  await c.var.db.transaction(async (tx) => {
    await tx.insert(orgMembers).values({ orgId: demo.id, userId, role: "viewer" }).onConflictDoNothing();
    await seedReachDemo(tx, demo.id); // idempotent
  });
  return c.json({ orgId: demo.id });
});

// Everything below needs a workspace.
team.use("*", requireOrg);

const memberOnly = (role: Parameters<typeof can>[0]) => {
  if (!can(role, "manage-members")) fail(403, "Only owners and admins can manage members.");
};

const notAnon = sql`coalesce(${user.isAnonymous}, false) = false`;

team.get("/members", async (c) => {
  const { orgId } = c.var.org;
  const rows = await c.var.db
    .select({
      userId: orgMembers.userId, role: orgMembers.role, createdAt: orgMembers.createdAt,
      fullName: profiles.fullName, email: profiles.email, avatarPath: profiles.avatarPath,
    })
    .from(orgMembers)
    .innerJoin(profiles, eq(profiles.userId, orgMembers.userId))
    .innerJoin(user, eq(user.id, orgMembers.userId))
    .where(and(eq(orgMembers.orgId, orgId), notAnon))
    .orderBy(asc(orgMembers.createdAt));
  return c.json(rows.map((r) => ({
    userId: r.userId, role: r.role, joinedAt: r.createdAt, email: r.email,
    name: r.fullName?.trim() || r.email!.split("@")[0],
    avatarUrl: r.avatarPath ? `/api/account/avatar/${r.avatarPath}` : null,
    isYou: r.userId === c.var.userId,
  })));
});

team.get("/invites", async (c) => {
  memberOnly(c.var.org.role);
  const rows = await c.var.db
    .select({ id: orgInvites.id, email: orgInvites.email, role: orgInvites.role, token: orgInvites.token, expiresAt: orgInvites.expiresAt })
    .from(orgInvites)
    .where(and(eq(orgInvites.orgId, c.var.org.orgId), isNull(orgInvites.acceptedAt), isNull(orgInvites.revokedAt), gt(orgInvites.expiresAt, sql`now()`)))
    .orderBy(desc(orgInvites.createdAt));
  return c.json(rows);
});

team.post("/invites", async (c) => {
  const { orgId, role } = c.var.org;
  const userId = c.var.userId!;
  memberOnly(role);
  const p = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address.")), role: ROLES })
    .safeParse(await body(c));
  if (!p.success) return c.json({ error: p.error.issues[0].message }, 400);
  const { email, role: inviteRole } = p.data;
  const token = await c.var.db.transaction(async (tx) => {
    const [dupe] = await tx.select({ x: sql`1` }).from(orgMembers)
      .innerJoin(profiles, eq(profiles.userId, orgMembers.userId))
      .where(and(eq(orgMembers.orgId, orgId), sql`lower(${profiles.email}) = ${email}`));
    if (dupe) return fail(409, "That person is already a member of this workspace.");
    await tx.update(orgInvites).set({ revokedAt: sql`now()` })
      .where(and(eq(orgInvites.orgId, orgId), eq(orgInvites.email, email), isNull(orgInvites.acceptedAt), isNull(orgInvites.revokedAt)));
    const [i] = await tx.insert(orgInvites).values({ orgId, email, role: inviteRole, invitedBy: userId }).returning({ token: orgInvites.token });
    await logEvent(tx, { orgId, actorId: userId, action: `Invited a member as ${inviteRole}`, target: email, category: "team" });
    return i.token;
  });
  return c.json({ token, email }, 201);
});

team.delete("/invites/:id", async (c) => {
  const { orgId, role } = c.var.org;
  memberOnly(role);
  const id = c.req.param("id");
  if (!uuid.safeParse(id).success) return c.json({ error: "That invite could not be found." }, 404);
  await c.var.db.transaction(async (tx) => {
    const [i] = await tx.update(orgInvites).set({ revokedAt: sql`now()` })
      .where(and(eq(orgInvites.id, id), eq(orgInvites.orgId, orgId), isNull(orgInvites.acceptedAt), isNull(orgInvites.revokedAt)))
      .returning({ email: orgInvites.email });
    if (i) await logEvent(tx, { orgId, actorId: c.var.userId!, action: "Revoked an invite", target: i.email, category: "team" });
  });
  return c.json({ ok: true });
});

// Role changes / removal: never on the owner or yourself.
const target = async (db: DbOrTx, orgId: string, me: string, userId: string, verb: string) => {
  if (userId === me) fail(400, verb === "change" ? "You cannot change your own role." : "You cannot remove yourself from the workspace.");
  const [m] = await db.select({ role: orgMembers.role }).from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
  if (!m) fail(404, "That person is no longer a member of this workspace.");
  if (m.role === "owner") fail(403, verb === "change" ? "The owner’s role cannot be changed." : "The owner cannot be removed.");
};

team.patch("/members/:userId", async (c) => {
  const { orgId, role } = c.var.org;
  memberOnly(role);
  const userId = c.req.param("userId");
  const p = z.object({ role: ROLES }).safeParse(await body(c));
  if (!p.success) return c.json({ error: p.error.issues[0].message }, 400);
  await c.var.db.transaction(async (tx) => {
    await target(tx, orgId, c.var.userId!, userId, "change");
    await tx.update(orgMembers).set({ role: p.data.role }).where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
    const [o] = await tx.select({ name: orgs.name }).from(orgs).where(eq(orgs.id, orgId));
    await logEvent(tx, { orgId, actorId: c.var.userId!, action: `Changed a role to ${p.data.role}`, target: await displayName(tx, userId), category: "team" });
    await deliverNotification(tx, { userId, orgId, event: "team_activity", title: `Your role in ${o.name} is now ${p.data.role}`, href: "/account/team" });
  });
  return c.json({ ok: true });
});

team.delete("/members/:userId", async (c) => {
  const { orgId, role } = c.var.org;
  memberOnly(role);
  const userId = c.req.param("userId");
  await c.var.db.transaction(async (tx) => {
    await target(tx, orgId, c.var.userId!, userId, "remove");
    const who = await displayName(tx, userId);
    await tx.delete(orgMembers).where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
    await tx.update(profiles).set({ currentOrgId: null }).where(and(eq(profiles.userId, userId), eq(profiles.currentOrgId, orgId)));
    await logEvent(tx, { orgId, actorId: c.var.userId!, action: "Removed a member", target: who, category: "team" });
  });
  return c.json({ ok: true });
});

// Workspaces the user belongs to (demo guests see none, as before), current first.
team.get("/workspaces", async (c) => {
  const rows = await c.var.db
    .select({ id: orgs.id, name: orgs.name, role: orgMembers.role })
    .from(orgMembers)
    .innerJoin(orgs, eq(orgs.id, orgMembers.orgId))
    .innerJoin(user, eq(user.id, orgMembers.userId))
    .where(and(eq(orgMembers.userId, c.var.userId!), notAnon))
    .orderBy(asc(orgMembers.createdAt));
  const cur = c.var.org.orgId;
  return c.json(rows.map((r) => ({ orgId: r.id, name: r.name, role: r.role, isCurrent: r.id === cur }))
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent)));
});

team.post("/switch", async (c) => {
  const p = z.object({ orgId: z.uuid("That workspace could not be found.") }).safeParse(await body(c));
  if (!p.success) return c.json({ error: p.error.issues[0].message }, 400);
  const userId = c.var.userId!;
  const [m] = await c.var.db.select({ x: sql`1` }).from(orgMembers)
    .innerJoin(user, eq(user.id, orgMembers.userId))
    .where(and(eq(orgMembers.orgId, p.data.orgId), eq(orgMembers.userId, userId), notAnon));
  if (!m) return c.json({ error: "You are no longer a member of that workspace." }, 403);
  await c.var.db.update(profiles).set({ currentOrgId: p.data.orgId }).where(eq(profiles.userId, userId));
  return c.json({ ok: true });
});
