import { createAuthClient } from "better-auth/react";
import { anonymousClient, twoFactorClient } from "better-auth/client/plugins";

// Talks to /api/auth/* (better-auth mounted in the Worker).
export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [twoFactorClient({ twoFactorPage: "/mfa/verify" }), anonymousClient()],
});
