import { and, asc, desc, eq, sql } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import type { DbOrTx } from "./db";
import { orgMembers, profiles } from "./schema";
import type { AppEnv } from "./types";

export type OrgRole = "owner" | "admin" | "member" | "viewer";
type Org = { orgId: string; role: OrgRole };

// The workspace the user last chose (profiles.current_org_id) if they still belong to it,
// else their oldest membership.
export const currentOrg = async (db: DbOrTx, userId: string): Promise<Org | null> => {
  const [row] = await db
    .select({ orgId: orgMembers.orgId, role: orgMembers.role })
    .from(orgMembers)
    .leftJoin(profiles, and(eq(profiles.userId, orgMembers.userId), eq(profiles.currentOrgId, orgMembers.orgId)))
    .where(eq(orgMembers.userId, userId))
    .orderBy(desc(sql`${profiles.userId} is not null`), asc(orgMembers.createdAt))
    .limit(1);
  return row ? { orgId: row.orgId, role: row.role as OrgRole } : null;
};

// Same matrix as apps/web/src/lib/auth/permissions.ts (keep in sync).
const ALLOW = {
  view: ["owner", "admin", "member", "viewer"],
  "edit-data": ["owner", "admin", "member"],
  approve: ["owner", "admin"],
  "manage-company": ["owner", "admin"],
  "manage-billing": ["owner", "admin"],
  "manage-members": ["owner", "admin"],
  "manage-ai-key": ["owner", "admin"],
  "manage-developers": ["owner"],
  "delete-workspace": ["owner"],
} as const satisfies Record<string, readonly OrgRole[]>;
export type Capability = keyof typeof ALLOW;
export const can = (role: OrgRole, cap: Capability) => (ALLOW[cap] as readonly OrgRole[]).includes(role);
export const canEditData = (role: OrgRole) => can(role, "edit-data");

// Replaces RLS: 401 without a session, 403 without a workspace.
export const requireOrg = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.var.userId;
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  const org = await currentOrg(c.var.db, userId);
  if (!org) return c.json({ error: "no workspace" }, 403);
  c.set("org", org);
  await next();
});

// For routes that need a signed-in user but not (yet) a workspace.
export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.userId) return c.json({ error: "unauthorized" }, 401);
  await next();
});
