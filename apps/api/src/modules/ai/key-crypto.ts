// AES-256-GCM seal for workspace OpenRouter keys (Web Crypto). Format `v1.<iv>.<ciphertext+tag>` (base64url).
// Secret = env.AI_KEY_SECRET (32+ chars); the AES key is its SHA-256.
const MIN_SECRET = 32;
const enc = new TextEncoder();

const b64 = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export const hasKeySecret = (secret?: string) => (secret?.trim().length ?? 0) >= MIN_SECRET;

const aesKey = async (secret: string) =>
  crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode(secret.trim())), "AES-GCM", false, ["encrypt", "decrypt"]);

export async function encryptApiKey(apiKey: string, secret: string): Promise<string> {
  if (!hasKeySecret(secret)) throw new Error("AI_KEY_SECRET is not set (32+ characters).");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(secret), enc.encode(apiKey));
  return `v1.${b64(iv)}.${b64(sealed)}`;
}

// null if malformed, tampered with, or sealed under another secret.
export async function decryptApiKey(sealed: string, secret: string): Promise<string | null> {
  const [v, iv, data] = sealed.split(".");
  if (v !== "v1" || !iv || !data || !hasKeySecret(secret)) return null;
  try {
    const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(secret), unb64(data));
    return new TextDecoder().decode(out);
  } catch {
    return null;
  }
}

export const isOpenRouterKeyShape = (s: string) => /^sk-or-[A-Za-z0-9_-]{16,300}$/.test(s.trim());
// Never more than the last four characters.
export const keyHint = (k: string) => `sk-or-…${k.trim().slice(-4)}`;
