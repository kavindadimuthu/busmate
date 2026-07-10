import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 4200,
  },
  plugins: [react(), tailwindcss()],
  // @busmate/ui is a source-only TS lib whose components self-import subpaths
  // like "@busmate/ui/lib/utils" and "@busmate/ui/patterns/*" that aren't in
  // its package "exports". management-portal (Next) resolves those via tsconfig
  // path mapping to source; we do the same with a source alias below and skip
  // dep pre-bundling so Vite treats the lib as source, not a prebundled dep.
  optimizeDeps: {
    exclude: ['@busmate/ui'],
  },
  resolve: {
    // dedupe forces a single React copy (the hoisted root React 19, which is
    // what @busmate/ui requires) so pnpm hoisting can't pull passenger-web's
    // React 18 and cause "Invalid hook call" crashes. No hard react alias:
    // React is hoisted to the root node_modules, not app-local.
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: [
      // Map @busmate/ui subpaths (except the CSS "styles"/"themes" exports) to
      // the lib source so its internal self-imports resolve. Bare "@busmate/ui"
      // (no subpath) still resolves via the package's "." export to src/index.ts.
      {
        find: /^@busmate\/ui\/(?!styles|themes\/)(.*)$/,
        replacement: path.resolve(__dirname, '../../../libs/ui/src/$1'),
      },
      // Shared auth/routing layer, referenced by source (no build step).
      {
        find: '@busmate/portal-shared',
        replacement: path.resolve(__dirname, '../../../libs/portal-shared/src/index.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
});
