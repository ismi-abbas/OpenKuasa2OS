// In-memory Postgres (pglite) with the real migrations applied, for SQL-level tests (no Docker).
// Usage: const db = await testDb();  // a drizzle db; cast with `as unknown as Db` for helpers.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

export const testDb = async () => {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
  return db;
};
