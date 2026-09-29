import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    // Different port from passenger-web (4000, see its vite.config.ts) so both apps
    // can run side by side during the parallel rebuild (ADR-029, INC-063).
    port: 4001,
  },
  preview: {
    host: "::",
    port: 4001,
  },
  plugins: [
    react(),
    // Uploads source maps to Sentry so stack traces de-minify. No-ops (and prints a
    // notice instead of failing the build) until SENTRY_AUTH_TOKEN/ORG/PROJECT are set
    // — see config/observability/README.md.
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    sourcemap: true,
  },
  resolve: {
    // Same pnpm-hoisting guard as passenger-web's vite.config.ts: forces React 18 from
    // this app's own node_modules, since other workspace apps (new-react-portal) are on React 19.
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
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
