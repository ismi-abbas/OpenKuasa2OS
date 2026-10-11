// OpenRouter, model per layer: strong orchestrator, cheap worker. Env overrides, see Env in auth.ts.
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { Env } from "../../core/env";

export type AgentLayer = "orchestrator" | "worker";
const FALLBACK: Record<AgentLayer, string> = {
  orchestrator: "anthropic/claude-sonnet-4.5",
  worker: "anthropic/claude-haiku-4.5",
};

type Cfg = Pick<Env, "OPENKUASA_MODEL_ORCHESTRATOR" | "OPENKUASA_MODEL_WORKER">;
export const pickModelId = (layer: AgentLayer, env: Cfg) =>
  (layer === "orchestrator" ? env.OPENKUASA_MODEL_ORCHESTRATOR : env.OPENKUASA_MODEL_WORKER)?.trim() || FALLBACK[layer];

export const hasProviderKey = (env: Pick<Env, "OPENROUTER_API_KEY">) => Boolean(env.OPENROUTER_API_KEY?.trim());

// Per request, so a workspace key is never cached. Omit apiKey to bill the platform key.
export const getModel = (env: Env, layer: AgentLayer, apiKey?: string) =>
  createOpenRouter({
    apiKey: apiKey ?? env.OPENROUTER_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL?.trim() || undefined,
    appName: "OpenKuasa OS",
    appUrl: "https://openkuasa.com",
  })(pickModelId(layer, env));
