import { betterAuth } from "better-auth";
import { anonymous, twoFactor } from "better-auth/plugins";
import bcrypt from "bcryptjs";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Env } from "../../core/env";
import type { Db } from "../../core/db";
import * as schema from "../../core/schema";
import { logEvent, type EventInput } from "../../core/events";
import { currentOrg } from "../../core/org";

// Imported Supabase users have bcrypt hashes, so everyone uses bcrypt.
// ponytail: bcryptjs is pure JS (~100ms at cost 10); fine for login, swap for scrypt rehash-on-login if CPU limits bite.
const bcryptPassword = {
  hash: (p: string) => bcrypt.hash(p, 10),
  verify: ({ hash, password }: { hash: string; password: string }) => bcrypt.compare(password, hash),
};

const sendMail = async (env: Partial<Env>, to: string, subject: string, url: string, cta: string) => {
  if (!env.RESEND_API_KEY) return console.log(`[mail] ${subject} -> ${to}: ${url}`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? "OpenKuasa <no-reply@openkuasa.com>",
      to,
      subject,
      html: `<p>${cta}</p><p><a href="${url}">${url}</a></p><p>If you did not ask for this, ignore this email.</p>`,
    }),
  });
  if (!res.ok) console.error("[mail] resend failed", res.status, await res.text());
};

// Activity-log side effects (old app: recordEvent after sign-in / password reset). Never blocks auth.
const audit = (db: Db, userId: string, e: Omit<EventInput, "orgId" | "actorId">) =>
  currentOrg(db, userId)
    .then((o) => o && db.transaction((tx) => logEvent(tx, { ...e, orgId: o.orgId, actorId: userId })))
    .catch((err) => console.error("[audit]", err));

const options = (env: Env, db: Db) => ({
  emailAndPassword: {
    enabled: true,
    password: bcryptPassword,
    // Like Supabase "confirm email": only enforced when mail can actually be sent.
    requireEmailVerification: !!env.RESEND_API_KEY,
    onPasswordReset: async ({ user }: { user: { id: string } }) =>
      void (await audit(db, user.id, {
        action: "Reset password by email", category: "security",
        notify: { to: "self", event: "security", title: "Your password was reset", href: "/account/security" },
      })),
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) =>
      void sendMail(env, user.email, "Reset your OpenKuasa password", url, "Reset your password:"),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) =>
      void sendMail(env, user.email, "Confirm your OpenKuasa email", url, "Confirm your email:"),
  },
  // account slice: profile email change; the link goes to the CURRENT inbox for approval.
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }: { user: { email: string }; newEmail: string; url: string }) =>
        void sendMail(env, user.email, "Approve your new OpenKuasa email", url, `Approve changing your sign-in email to ${newEmail}:`),
    },
  },
  databaseHooks: {
    session: {
      create: { after: async (session: { userId: string }) => void (await audit(db, session.userId, { action: "Signed in", category: "auth" })) },
    },
  },
  plugins: [twoFactor({ issuer: "OpenKuasa" }), anonymous({ generateName: () => "" })],
});

// Built per request with the request's db (see index.ts).
export const createAuth = (env: Env, db: Db) =>
  betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.WEB_ORIGIN],
    ...options(env, db),
  });
