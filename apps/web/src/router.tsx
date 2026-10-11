import { createBrowserRouter } from "react-router";
import { marketingRoutes } from "./features/marketing/routes";
import { authRoutes } from "./features/auth/routes";
import { accountRoutes } from "./features/account/routes";
import { appRoutes } from "./features/app/routes";
import NotFound from "@/components/not-found-content";

// Each feature owns its route table (features/*/routes.tsx).
export const router = createBrowserRouter([
  ...marketingRoutes,
  ...authRoutes,
  ...accountRoutes,
  ...appRoutes,
  { path: "*", element: <NotFound /> },
]);
