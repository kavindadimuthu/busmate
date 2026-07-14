import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    alias: [
      { find: /^@busmate\/ui$/, replacement: path.resolve(__dirname, '../../../libs/ui/src/index.ts') },
      { find: /^@busmate\/ui\/styles$/, replacement: path.resolve(__dirname, '../../../libs/ui/src/styles/globals.css') },
      { find: /^@busmate\/ui\/(.*)$/, replacement: path.resolve(__dirname, '../../../libs/ui/src/$1') },
      { find: /^@busmate\/api-client-route$/, replacement: path.resolve(__dirname, '../../../libs/api-clients/route-management/src/index.ts') },
      { find: /^@busmate\/api-client-ticketing$/, replacement: path.resolve(__dirname, '../../../libs/api-clients/ticketing-management/src/index.ts') },
      { find: /^@busmate\/api-client-location$/, replacement: path.resolve(__dirname, '../../../libs/api-clients/location-tracking/src/index.ts') },
      { find: /^@busmate\/api-client-user$/, replacement: path.resolve(__dirname, '../../../libs/api-clients/user-management/src/index.ts') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    exclude: ['@busmate/ui'],
  },
})
