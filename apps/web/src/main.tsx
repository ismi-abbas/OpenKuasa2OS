import "@fontsource-variable/lexend";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { ThemeSync } from "@/components/theme/theme-sync";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeSync />
    <RouterProvider router={router} />
  </StrictMode>,
);
