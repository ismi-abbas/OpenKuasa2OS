import type { Env } from "./env";
import type { Db } from "./db";
import type { OrgRole } from "./org";

// Every route file: `new Hono<AppEnv>()`.
export type AppEnv = {
  Bindings: Env;
  Variables: { db: Db; userId: string | null; org: { orgId: string; role: OrgRole } };
};
