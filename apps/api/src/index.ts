import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./core/env";
import { createAuth } from "./modules/auth/auth";
import { crm } from "./modules/crm/routes";
import { team } from "./modules/team/routes";
import { account } from "./modules/account/routes";
import { ai } from "./modules/ai/routes";
import { reach, reachDemoCron } from "./modules/reach/routes";
import { eq } from "drizzle-orm";
import { connect } from "./core/db";
import { currentOrg } from "./core/org";
import { orgs, profiles, user } from "./core/schema";
import type { AppEnv } from "./core/types";

const app = new Hono<AppEnv>();

// Handlers may throw HTTPException(status, {message}); the web api() helper shows `.error`.
app.onError((e, c) => {
  if (e instanceof HTTPException) return c.json({ error: e.message }, e.status);
  console.error(e);
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});

app.use("/api/*", (c, next) =>
  cors({ origin: c.env.WEB_ORIGIN, credentials: true })(c, next),
);

// One db (single pooled connection) per request, closed after the response is sent.
app.use("/api/*", async (c, next) => {
  const { db, close } = connect(c.env);
  c.set("db", db);
  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(close());
  }
});

app.on(["GET", "POST"], "/api/auth/*", (c) => createAuth(c.env, c.var.db).handler(c.req.raw));

// Session -> c.var.userId. Every data route must scope queries by it
// (replaces the old Supabase RLS `auth.uid()` checks).
app.use("/api/*", async (c, next) => {
  const s = await createAuth(c.env, c.var.db).api.getSession({ headers: c.req.raw.headers });
  c.set("userId", s?.user.id ?? null);
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true, userId: c.var.userId }));

// The app chrome's "viewer" (port of getViewer). 2FA needs no state here: better-auth only issues a
// session after the second factor passes, so a session always means fully signed in.
app.get("/api/me", async (c) => {
  const userId = c.var.userId;
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  const db = c.var.db;
  const [u] = await db
    .select({ email: user.email, anon: user.isAnonymous, fullName: profiles.fullName, avatarPath: profiles.avatarPath })
    .from(user).leftJoin(profiles, eq(profiles.userId, user.id)).where(eq(user.id, userId));
  if (!u) return c.json({ error: "unauthorized" }, 401);
  const member = await currentOrg(db, userId);
  if (!member) return c.json({ error: "no_workspace" }, 409);
  const [org] = await db.select({ name: orgs.name }).from(orgs).where(eq(orgs.id, member.orgId));
  const r = { ...u, anon: !!u.anon, org_id: member.orgId, org_name: org.name, role: member.role, full_name: u.fullName, avatar_path: u.avatarPath };
  const email: string | null = r.anon ? null : r.email || null;
  const name: string = r.anon ? "Demo guest" : r.full_name?.trim() || email?.split("@")[0] || "Member";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() || "?";
  return c.json({
    userId, orgId: r.org_id, name, email, initials,
    avatarUrl: r.avatar_path ? `/api/account/avatar/${r.avatar_path}` : null,
    orgName: r.org_name, role: r.role, isDemo: r.anon,
  });
});

app.route("/api/crm", crm);
app.route("/api/team", team);
app.route("/api/account", account);
app.route("/api/ai", ai);
app.route("/api/reach", reach);

export default {
  fetch: app.fetch,
  // Hourly: keep the Reach demo workspace fresh (see wrangler.jsonc triggers).
  scheduled: (_e: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(reachDemoCron(env)),
};
