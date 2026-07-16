import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Root is this `web/` dir; build output goes to web/dist, which the Express
// server serves in production. In `dev:web` mode Vite runs its own server on
// 5174 and proxies /api to the Express server on 4321.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:4321',
    },
  },
});
