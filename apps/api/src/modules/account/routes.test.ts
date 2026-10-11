import { expect, test } from "vitest";
import { activityFilters, isAppHref, periodStart } from "./routes";

test("activity filters fall back per field", () => {
  expect(activityFilters.parse({ category: "nope", period: "7d" })).toEqual({ category: "all", period: "7d", before: undefined });
  expect(activityFilters.parse({ category: ["a", "b"], before: "garbage" }).before).toBeUndefined();
  expect(activityFilters.parse({ before: "2026-10-10T12:00:00.123456Z" }).before).toBe("2026-10-10T12:00:00.123456Z");
});

test("periodStart counts back from now, open-ended for all", () => {
  expect(periodStart("7d", Date.parse("2026-10-10T00:00:00Z"))).toBe("2026-10-03T00:00:00.000Z");
  expect(periodStart("all")).toBeNull();
});

test("isAppHref only accepts app-relative paths", () => {
  expect(isAppHref("/account/security")).toBe(true);
  for (const h of ["//evil.example", "/\\evil", "https://x.y", "javascript:1", "account", null]) expect(isAppHref(h)).toBe(false);
});

test("activity cursor keeps microsecond precision", async () => {
  const { sql } = await import("drizzle-orm");
  const { testDb } = await import("../../core/test-db");
  const s = await import("../../core/schema");
  const { Hono } = await import("hono");
  const { account } = await import("./routes");
  const db = await testDb();
  const [o] = await db.insert(s.orgs).values({ name: "A" }).returning();
  await db.execute(sql`insert into activity_log (org_id, actor_name, action, category, created_at) values
    (${o.id}, 'A', 'one', 'data', '2026-10-10T12:00:00.000001Z'), (${o.id}, 'A', 'two', 'data', '2026-10-10T12:00:00.000002Z')`);
  const app = new Hono<any>();
  app.use("*", async (c, next) => { c.set("db", db); c.set("userId", "u"); c.set("org", { orgId: o.id, role: "owner" }); await next(); });
  // requireOrg re-resolves the org from membership, so mount only the handler path via a member row.
  await db.insert(s.user).values({ id: "u", name: "u", email: "u@x.co", emailVerified: true, createdAt: new Date(), updatedAt: new Date() });
  await db.insert(s.orgMembers).values({ orgId: o.id, userId: "u", role: "owner" });
  app.route("/", account);
  const res = (await (await app.request("/activity?period=all&before=2026-10-10T12:00:00.000002Z")).json()) as { entries: { action: string }[] };
  expect(res.entries.map((e: { action: string }) => e.action)).toEqual(["one"]);
});
