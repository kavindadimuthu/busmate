import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4000,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Uploads source maps to Sentry so stack traces de-minify. No-ops (and prints a
    // notice instead of failing the build) until SENTRY_AUTH_TOKEN/ORG/PROJECT are set
    // — see config/observability/README.md.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ].filter(Boolean),
  build: {
    sourcemap: true,
  },
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
      "@busmate/api-client-core": path.resolve(__dirname, "../../../libs/api-clients/core-service/src/index.ts"),
      "@busmate/api-client-ticketing": path.resolve(__dirname, "../../../libs/api-clients/ticketing-service/src/index.ts"),
      "@busmate/api-client-user": path.resolve(__dirname, "../../../libs/api-clients/user-service/src/index.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
