import { eq } from "drizzle-orm";
import { beforeEach, expect, it } from "vitest";
import type { Db } from "./db";
import { logEvent } from "./events";
import * as s from "./schema";
import { testDb } from "./test-db";

let db: Db;
const now = new Date();
const mkUser = (id: string) =>
  db.insert(s.user).values({ id, name: id, email: `${id}@x.co`, emailVerified: true, createdAt: now, updatedAt: now });
const ev = { orgId: "", actorId: "u", action: "x", category: "team" as const };

beforeEach(async () => {
  db = (await testDb()) as unknown as Db;
  await mkUser("u"); await mkUser("admin1");
  const [o] = await db.insert(s.orgs).values({ name: "Acme" }).returning();
  ev.orgId = o.id;
  await db.insert(s.orgMembers).values([{ orgId: o.id, userId: "u", role: "member" }, { orgId: o.id, userId: "admin1", role: "admin" }]);
});

it("creates a profile for each user (trigger)", async () => {
  expect(await db.select().from(s.profiles)).toHaveLength(2);
});

it("ignores viewers", async () => {
  await db.update(s.orgMembers).set({ role: "viewer" }).where(eq(s.orgMembers.userId, "u"));
  await logEvent(db, ev);
  expect(await db.select().from(s.activityLog)).toHaveLength(0);
});

it("logs and notifies admins", async () => {
  await logEvent(db, { ...ev, notify: { to: "admins", title: "t", href: "/account/team" } });
  expect(await db.select().from(s.activityLog)).toHaveLength(1);
  const n = await db.select().from(s.notifications);
  expect(n.map((x) => x.userId)).toEqual(["admin1"]);
});

it("respects in-app opt-out except for security", async () => {
  await db.update(s.profiles).set({ notificationPrefs: { channels: { inapp: false } } }).where(eq(s.profiles.userId, "u"));
  await logEvent(db, { ...ev, notify: { to: "self", title: "t" } });
  expect(await db.select().from(s.notifications)).toHaveLength(0);
  await logEvent(db, { ...ev, notify: { to: "self", event: "security", title: "t" } });
  expect(await db.select().from(s.notifications)).toHaveLength(1);
});
