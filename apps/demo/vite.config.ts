import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow importing monorepo packages from source.
      allow: [path.resolve(root, "../..")],
    },
  },
  resolve: {
    // Prefer package source over dist so HMR never serves a stale/missing export.
    alias: {
      "@ananse/react": path.resolve(root, "../../packages/react/src/index.ts"),
      "@ananse/core": path.resolve(root, "../../packages/core/src/index.ts"),
      "@ananse/tokens": path.resolve(root, "../../packages/tokens/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Keep workspace packages out of prebundle so aliases always win.
    exclude: ["@ananse/react", "@ananse/core", "@ananse/tokens"],
  },
});
