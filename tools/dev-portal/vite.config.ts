import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 4001,
    strictPort: true,
    // Use polling instead of inotify — required on NTFS/mounted drives on Linux
    watch: {
      usePolling: true,
      interval: 500,
    },
    proxy: {
      // Proxy API requests to Express backend server (port 3001)
      "/proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/portal": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
