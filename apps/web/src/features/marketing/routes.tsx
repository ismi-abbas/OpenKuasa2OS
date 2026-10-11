import type { RouteObject } from "react-router";
import LandingPage from "@/features/marketing/pages/landing";
import PricingPage from "@/features/marketing/pages/pricing";
import PrivacyPage from "@/features/marketing/pages/privacy";

export const marketingRoutes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/pricing", element: <PricingPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
];
