import type { RouteObject } from "react-router";
import LoginPage from "@/features/auth/pages/login";
import ForgotPasswordPage from "@/features/auth/pages/forgot-password";
import ResetPasswordPage from "@/features/auth/pages/reset-password";
import OnboardingPage from "@/features/auth/pages/onboarding";
import MfaVerifyPage from "@/features/auth/pages/mfa-verify";
import MfaRecoverPage from "@/features/auth/pages/mfa-recover";
import InvitePage from "@/features/auth/pages/invite";

export const authRoutes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/mfa/verify", element: <MfaVerifyPage /> },
  { path: "/mfa/recover", element: <MfaRecoverPage /> },
  { path: "/invite/:token", element: <InvitePage /> },
];
