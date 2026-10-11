// Shared front half of the chat endpoints (port of gate.ts + chat-request.ts): who pays, is the body sane.
import { convertToModelMessages, safeValidateUIMessages, type ModelMessage } from "ai";
import type { Context } from "hono";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import type { DbOrTx } from "../../core/db";
import { aiFreeUsage, orgAiKeys, user } from "../../core/schema";
import type { AppEnv } from "../../core/types";
import { decryptApiKey } from "./key-crypto";
import { hasProviderKey } from "./provider";

export const FREE_QUESTIONS_PER_WEEK = 3;
const MAX_MESSAGES = 12; // long histories multiply token cost
const MAX_BODY_BYTES = 12 * 1024 * 1024; // room for inline attachments
const WEEK = sql`date_trunc('week', now() at time zone 'utc')::date`;

// Demo guests are better-auth anonymous users.
export const isDemoUser = async (db: DbOrTx, userId: string) => {
  const [r] = await db.select({ anon: user.isAnonymous }).from(user).where(eq(user.id, userId));
  return r?.anon ?? false;
};

const sealedKey = async (db: DbOrTx, orgId: string) =>
  (await db.select({ ciphertext: orgAiKeys.ciphertext }).from(orgAiKeys).where(eq(orgAiKeys.orgId, orgId)))[0]?.ciphertext;

// Atomically takes one free question; remaining (>= 0) or -1 when used up.
const consumeFreeQuestion = async (db: DbOrTx, userId: string) => {
  const [r] = await db
    .insert(aiFreeUsage)
    .values({ userId, weekStart: WEEK as unknown as string, count: 1 })
    .onConflictDoUpdate({
      target: [aiFreeUsage.userId, aiFreeUsage.weekStart],
      set: { count: sql`${aiFreeUsage.count} + 1` },
      setWhere: sql`${aiFreeUsage.count} < ${FREE_QUESTIONS_PER_WEEK}`,
    })
    .returning({ count: aiFreeUsage.count });
  return r ? FREE_QUESTIONS_PER_WEEK - r.count : -1;
};

export type PreparedChat =
  | { ok: false; response: Response }
  | { ok: true; messages: ModelMessage[]; apiKey: string | undefined };

const bodySchema = z.object({ messages: z.array(z.unknown()).min(1) });

// Order: body within size and well-formed -> not a demo guest -> workspace key, else a free question.
// The body is checked before the allowance so a malformed request never spends a free question.
export async function prepareChat(c: Context<AppEnv>): Promise<PreparedChat> {
  const { orgId } = c.var.org;
  const userId = c.var.userId!;
  const fail = (status: number, error: string, code?: string): PreparedChat => ({
    ok: false,
    response: c.json({ error, code }, status as 400),
  });

  const raw = await c.req.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "That message is too long to handle.");

  let messages: ModelMessage[];
  try {
    const parsed = bodySchema.parse(JSON.parse(raw));
    const validated = await safeValidateUIMessages({ messages: parsed.messages.slice(-MAX_MESSAGES) });
    if (!validated.success) return fail(400, "Invalid request.");
    messages = await convertToModelMessages(validated.data);
  } catch {
    return fail(400, "Invalid request.");
  }

  if (await isDemoUser(c.var.db, userId)) return fail(403, "Sign up for a free account to chat.", "demo");

  try {
    const sealed = await sealedKey(c.var.db, orgId);
    if (sealed) {
      // Fail closed: a workspace with its own key never falls back to the platform key.
      const apiKey = await decryptApiKey(sealed, c.env.AI_KEY_SECRET);
      return apiKey
        ? { ok: true, messages, apiKey }
        : fail(503, "Your workspace key could not be used on this server. Ask an owner to save it again.", "key_unavailable");
    }
    const needsKey = fail(402, "Add your OpenRouter key to keep chatting.", "key_required");
    if (!hasProviderKey(c.env) || (await consumeFreeQuestion(c.var.db, userId)) < 0) return needsKey;
    return { ok: true, messages, apiKey: undefined };
  } catch (e) {
    console.error("[chat] access check failed:", e);
    return fail(503, "Chat is unavailable right now. Please try again.", "key_unavailable");
  }
}

// What the chat UI shows before a question is asked. Consumes nothing.
export async function chatStatus(db: DbOrTx, env: AppEnv["Bindings"], userId: string, orgId: string) {
  const [[key], [used]] = await Promise.all([
    db.select({ keyHint: orgAiKeys.keyHint }).from(orgAiKeys).where(eq(orgAiKeys.orgId, orgId)),
    db.select({ count: aiFreeUsage.count }).from(aiFreeUsage).where(and(eq(aiFreeUsage.userId, userId), eq(aiFreeUsage.weekStart, WEEK as unknown as string))),
  ]);
  return {
    hasKey: !!key,
    keyHint: key?.keyHint ?? null,
    freeLimit: FREE_QUESTIONS_PER_WEEK,
    // Without a platform key there is nothing to run free questions on.
    freeRemaining: hasProviderKey(env) ? Math.max(0, FREE_QUESTIONS_PER_WEEK - (used?.count ?? 0)) : 0,
  };
}
