import type { RouteObject } from "react-router";
import { AccountShell } from "@/features/account/components/account-shell";
import { RequireAccess } from "@/features/account/components/page-frame";
import { RequireViewer } from "@/features/auth/require-viewer";
import type { Capability } from "@/features/auth/permissions";
import Home from "@/features/account/pages/home";
import Profile from "@/features/account/pages/profile";
import Security from "@/features/account/pages/security";
import Notifications from "@/features/account/pages/notifications";
import Company from "@/features/account/pages/company";
import Clients from "@/features/account/pages/clients";
import Activity from "@/features/account/pages/activity";
import Subscriptions from "@/features/account/pages/subscriptions";
import Plan from "@/features/account/pages/plan";
import AddOns from "@/features/account/pages/add-ons";
import PaymentMethods from "@/features/account/pages/payment-methods";
import Transactions from "@/features/account/pages/transactions";
import ConnectedApps from "@/features/account/pages/connected-apps";
import Developers from "@/features/account/pages/developers";
import Docs from "@/features/account/pages/docs";
import Changelog from "@/features/account/pages/changelog";
import Feedback from "@/features/account/pages/feedback";
import Support from "@/features/account/pages/support";
import Team from "@/features/account/pages/team";
import AiKey from "@/features/account/pages/ai";

const gated = (path: string, cap: Capability, Page: () => React.ReactNode): RouteObject => ({
  path,
  element: <RequireAccess cap={cap}><Page /></RequireAccess>,
});

// /account/*: signed-in viewer + account shell.
export const accountRoutes: RouteObject[] = [
  {
    path: "/account",
    element: <RequireViewer />,
    children: [
      {
        element: <AccountShell />,
        children: [
          { index: true, element: <Home /> },
          { path: "profile", element: <Profile /> },
          { path: "security", element: <Security /> },
          { path: "notifications", element: <Notifications /> },
          { path: "company", element: <Company /> },
          { path: "clients", element: <Clients /> },
          { path: "activity", element: <Activity /> },
          gated("subscriptions", "manage-billing", Subscriptions),
          gated("plan", "manage-billing", Plan),
          gated("add-ons", "manage-billing", AddOns),
          gated("payment-methods", "manage-billing", PaymentMethods),
          gated("transactions", "manage-billing", Transactions),
          { path: "connected-apps", element: <ConnectedApps /> },
          gated("developers", "manage-developers", Developers),
          { path: "docs", element: <Docs /> },
          { path: "changelog", element: <Changelog /> },
          { path: "feedback", element: <Feedback /> },
          { path: "support", element: <Support /> },
          { path: "team", element: <Team /> },
          { path: "ai", element: <AiKey /> },
        ],
      },
    ],
  },
];
