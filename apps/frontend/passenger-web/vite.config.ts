import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4000,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    // Force all packages (including pre-bundled deps like @tanstack/react-query)
    // to resolve React from this app's own node_modules (React 18).
    // Without this, pnpm hoisting causes the root React 19 (from management-portal)
    // to be used instead, producing "Invalid hook call" / multiple-React crashes.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      // Explicit aliases ensure Vite's dep pre-bundler and runtime both use
      // the same React 18 copy installed in this workspace package's node_modules.
      "react": path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "@/generated": path.resolve(__dirname, "./generated"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
