import { type ModelMessage, stepCountIs, streamText } from "ai";
import type { Env } from "../../core/env";
import { getModel } from "./provider";
import { createReachTools } from "./tools";
import type { ReachData } from "../reach/types";
import { ADS_SYSTEM, COMMAND_SYSTEM } from "./prompts";

// Api: reads Reach data through tools, step-capped so a turn can't loop.
export const runAds = (env: Env, messages: ModelMessage[], data: ReachData, abortSignal?: AbortSignal, apiKey?: string) =>
  streamText({
    model: getModel(env, "orchestrator", apiKey),
    system: ADS_SYSTEM,
    messages,
    tools: createReachTools(data),
    stopWhen: stepCountIs(8),
    maxOutputTokens: 1000,
    abortSignal,
  });

// Ochobot: cross-app assistant, no tools; explains and advises only.
export const runCommand = (env: Env, messages: ModelMessage[], abortSignal?: AbortSignal, apiKey?: string) =>
  streamText({ model: getModel(env, "worker", apiKey), system: COMMAND_SYSTEM, messages, maxOutputTokens: 800, abortSignal });
