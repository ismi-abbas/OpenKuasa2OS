import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Env } from "./env";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;
/** What `db.transaction(async (tx) => …)` hands you; usable wherever a Db is. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
/** Accepts either, so helpers work inside and outside a transaction. */
export type DbOrTx = Db | Tx;

// One short-lived single-connection pool per request; Hyperdrive does the real pooling.
export const connect = (env: Env) => {
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, max: 1 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
};

/** For code outside a request (cron). Requests get `c.var.db` from the middleware in index.ts. */
export const withDb = async <T>(env: Env, fn: (db: Db) => Promise<T>): Promise<T> => {
  const { db, close } = connect(env);
  try {
    return await fn(db);
  } finally {
    await close();
  }
};
