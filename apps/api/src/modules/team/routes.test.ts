import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { beforeEach, expect, it } from "vitest";
import type { Db } from "../../core/db";
import * as s from "../../core/schema";
import { testDb } from "../../core/test-db";
import { team } from "./routes";
import type { AppEnv } from "../../core/types";

let db: Db;
let orgId: string;
const now = new Date();
const mkUser = (id: string, anon = false) =>
  db.insert(s.user).values({ id, name: id, email: `${id}@x.co`, emailVerified: true, createdAt: now, updatedAt: now, isAnonymous: anon });

// Calls team as `userId`; org is looked up like requireOrg would via the memberships.
const call = async (userId: string, method: string, path: string, json?: unknown) => {
  const app = new Hono<AppEnv>();
  app.use("*", async (c, next) => { c.set("db", db); c.set("userId", userId); await next(); });
  app.route("/", team);
  const res = await app.request(path, {
    method, headers: { "content-type": "application/json" }, body: json === undefined ? undefined : JSON.stringify(json),
  });
  return { status: res.status, json: (await res.text().then((t) => { try { return JSON.parse(t); } catch { return t; } })) as any };
};

beforeEach(async () => {
  db = (await testDb()) as unknown as Db;
  for (const u of ["owner", "admin", "member", "invitee"]) await mkUser(u);
  const [o] = await db.insert(s.orgs).values({ name: "Acme" }).returning();
  orgId = o.id;
  await db.insert(s.orgMembers).values([
    { orgId, userId: "owner", role: "owner" }, { orgId, userId: "admin", role: "admin" }, { orgId, userId: "member", role: "member" },
  ]);
});

it("invite then accept: wrong email rejected, right email joins", async () => {
  const inv = await call("admin", "POST", "/invites", { email: "Invitee@X.co", role: "member" });
  expect(inv.status).toBe(201);
  expect((await call("member", "POST", "/invites", { email: "a@b.co", role: "member" })).status).toBe(403);
  expect((await call("admin", "POST", "/invites", { email: "member@x.co", role: "member" })).status).toBe(409);
  expect((await call("x", "GET", `/invite/${inv.json.token}`)).json).toMatchObject({ orgName: "Acme", status: "pending" });

  const bad = await call("member", "POST", `/invite/${inv.json.token}/accept`);
  expect(bad.status).toBe(403);
  const ok = await call("invitee", "POST", `/invite/${inv.json.token}/accept`);
  expect(ok.json).toEqual({ orgId });
  const [m] = await db.select().from(s.orgMembers).where(eq(s.orgMembers.userId, "invitee"));
  expect(m.role).toBe("member");
  expect((await call("invitee", "POST", `/invite/${inv.json.token}/accept`)).status).toBe(409);
  expect((await call("x", "GET", `/invite/${inv.json.token}`)).json.status).toBe("accepted");
});

it("role changes: not owner, not self", async () => {
  expect((await call("admin", "PATCH", "/members/owner", { role: "viewer" })).status).toBe(403);
  expect((await call("admin", "PATCH", "/members/admin", { role: "viewer" })).status).toBe(400);
  expect((await call("member", "PATCH", "/members/admin", { role: "viewer" })).status).toBe(403);
  expect((await call("admin", "PATCH", "/members/member", { role: "viewer" })).json).toEqual({ ok: true });
  const [m] = await db.select().from(s.orgMembers).where(eq(s.orgMembers.userId, "member"));
  expect(m.role).toBe("viewer");
});

it("remove member: not owner, not self; clears current org", async () => {
  expect((await call("admin", "DELETE", "/members/owner")).status).toBe(403);
  expect((await call("admin", "DELETE", "/members/admin")).status).toBe(400);
  await db.update(s.profiles).set({ currentOrgId: orgId }).where(eq(s.profiles.userId, "member"));
  expect((await call("admin", "DELETE", "/members/member")).json).toEqual({ ok: true });
  expect(await db.select().from(s.orgMembers).where(eq(s.orgMembers.userId, "member"))).toHaveLength(0);
  const [p] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "member"));
  expect(p.currentOrgId).toBeNull();
  expect((await call("admin", "DELETE", "/members/member")).status).toBe(404);
});
