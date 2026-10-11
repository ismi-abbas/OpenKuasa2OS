import { Navigate, Outlet, type RouteObject } from "react-router";
import { RequireViewer } from "@/features/auth/require-viewer";
import { AppShell } from "@/features/app/shell/app-shell";
import { CommandChat } from "@/features/command/command-chat";
import { ItemPage, ProductRedirect } from "@/features/app/pages/product";

const AppLayout = () => (
  <AppShell>
    <Outlet />
  </AppShell>
);

export const appRoutes: RouteObject[] = [
  {
    element: <RequireViewer />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "command", element: <CommandChat /> },
          // Workspace settings live under /account; keep the old URL working.
          { path: "settings", element: <Navigate to="/account" replace /> },
          { path: ":product", element: <ProductRedirect /> },
          { path: ":product/:item", element: <ItemPage /> },
        ],
      },
    ],
  },
];
