// Worker bindings, vars and secrets (see wrangler.jsonc and .dev.vars.example).
export type Env = {
  HYPERDRIVE: Hyperdrive;
  AVATARS: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  WEB_ORIGIN: string;
  RESEND_API_KEY?: string; // optional: without it, mail links are console.logged (dev)
  MAIL_FROM?: string; // e.g. "OpenKuasa <no-reply@openkuasa.com>"
  DEMO_ENABLED?: string; // "1" lets visitors start a demo guest session
  // AI: workspace-key sealing secret (32+ chars), platform OpenRouter key, optional overrides.
  AI_KEY_SECRET: string;
  OPENROUTER_API_KEY?: string;
  OPENKUASA_MODEL_ORCHESTRATOR?: string;
  OPENKUASA_MODEL_WORKER?: string;
  AI_GATEWAY_BASE_URL?: string;
};
