import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The console is served by the simulator's own server after `build`; in dev, Vite serves it and
// proxies the API through to that server.
const api = process.env.BUS_SIM_API ?? 'http://127.0.0.1:4600';

export default defineConfig({
  root: 'src/console',
  plugins: [react()],
  build: { outDir: '../../dist/console', emptyOutDir: true },
  server: { port: 4601, proxy: { '/api': api } },
});
