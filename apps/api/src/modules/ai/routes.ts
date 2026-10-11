import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { orgAiKeys } from "../../core/schema";
import { can, requireOrg } from "../../core/org";
import type { AppEnv } from "../../core/types";
import { runCommand } from "./agents";
import { chatStatus, isDemoUser, prepareChat } from "./chat";
import { encryptApiKey, hasKeySecret, isOpenRouterKeyShape, keyHint } from "./key-crypto";
import { logEvent } from "../../core/events";


export const ai = new Hono<AppEnv>();
ai.use("*", requireOrg);

// Ochobot, the cross-app assistant (Command page + floating button).
ai.post("/chat", async (c) => {
  const chat = await prepareChat(c);
  if (!chat.ok) return chat.response;
  return runCommand(c.env, chat.messages, c.req.raw.signal, chat.apiKey).toUIMessageStreamResponse({
    onError: (e) => (console.error("[command] stream error:", e), "Ochobot ran into a problem. Please try again in a moment."),
  });
});

ai.get("/status", async (c) => {
  const { orgId, role } = c.var.org;
  const userId = c.var.userId!;
  if (await isDemoUser(c.var.db, userId))
    return c.json({ isDemo: true, canManageKey: false, hasKey: false, keyHint: null, freeLimit: 0, freeRemaining: 0 });
  return c.json({ ...(await chatStatus(c.var.db, c.env, userId, orgId)), isDemo: false, canManageKey: can(role, "manage-ai-key") });
});

// Key management: owner/admin of a real (non-demo) account.
ai.use("/key", async (c, next) => {
  if (await isDemoUser(c.var.db, c.var.userId!)) return c.json({ error: "The demo workspace is read-only. Sign up to save changes." }, 403);
  if (!can(c.var.org.role, "manage-ai-key")) return c.json({ error: "Only owners and admins can manage the workspace AI key." }, 403);
  await next();
});

const keySchema = z.object({
  apiKey: z.string().trim().refine(isOpenRouterKeyShape, "That does not look like an OpenRouter key. It should start with sk-or-."),
});

// Asks OpenRouter whether the key is real. Never logs the key.
const checkWithOpenRouter = async (apiKey: string) => {
  try {
    const r = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    return r.ok ? "valid" : r.status === 401 || r.status === 403 ? "invalid" : "unreachable";
  } catch {
    return "unreachable";
  }
};

ai.put("/key", async (c) => {
  const { orgId } = c.var.org;
  const userId = c.var.userId!;
  const parsed = keySchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { apiKey } = parsed.data;
  if (!hasKeySecret(c.env.AI_KEY_SECRET))
    return c.json({ error: "This server is not set up to store workspace keys yet (AI_KEY_SECRET is missing)." }, 503);

  const check = await checkWithOpenRouter(apiKey);
  if (check === "invalid") return c.json({ error: "OpenRouter rejected that key. Check it and try again." }, 400);
  if (check === "unreachable") return c.json({ error: "Could not reach OpenRouter to check the key. Please try again." }, 502);

  const sealed = await encryptApiKey(apiKey, c.env.AI_KEY_SECRET);
  const hint = keyHint(apiKey);
  await c.var.db.transaction(async (tx) => {
    await tx
      .insert(orgAiKeys)
      .values({ orgId, ciphertext: sealed, keyHint: hint, updatedBy: userId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: orgAiKeys.orgId,
        set: { ciphertext: sealed, keyHint: hint, updatedBy: userId, updatedAt: new Date() },
      });
    await logEvent(tx, { orgId, actorId: userId, action: "Set the workspace AI key", target: hint, category: "security" });
  });
  return c.json({ notice: "Key saved. Chat now runs on your OpenRouter account." });
});

ai.delete("/key", async (c) => {
  const { orgId } = c.var.org;
  const userId = c.var.userId!;
  await c.var.db.transaction(async (tx) => {
    const gone = await tx.delete(orgAiKeys).where(eq(orgAiKeys.orgId, orgId)).returning({ orgId: orgAiKeys.orgId });
    if (gone.length) await logEvent(tx, { orgId, actorId: userId, action: "Removed the workspace AI key", category: "security" });
  });
  return c.json({ notice: "Key removed." });
});
