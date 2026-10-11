import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: {} }, // Tailwind runs via its Vite plugin; ignore any postcss.config.*
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // `wrangler dev` (apps/api) serves the Worker on :8787; same-origin in prod.
  server: { proxy: { "/api": "http://localhost:8787" } },
  test: { environment: "node" },
});
