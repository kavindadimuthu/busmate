import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { resolve } from "node:path";

const workspaceRoot = resolve(__dirname, "../../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: [
    '@busmate/ui',
    '@busmate/api-client-route',
    '@busmate/api-client-ticketing',
    '@busmate/api-client-location',
    '@busmate/api-client-user',
  ],
  turbopack: {
    root: workspaceRoot,
  },
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // ✅ Ignore TS errors during build (only for deployment)
  typescript: {
    ignoreBuildErrors: true,
  },

  async rewrites() {
    return [
      {
        source: '/api/user-management/:path*',
        destination: 'http://54.91.217.117:8081/:path*' // Vercel will proxy server-side
      },
      {
        source: '/api/route-management/:path*',
        destination: 'http://18.140.161.237:8080/:path*'
      },
      {
        source: '/api/notification-management/:path*',
        destination: 'http://13.51.177.104:8080/:path*'
      }
    ]
  }
};

// Wraps the config to upload source maps to Sentry so stack traces de-minify.
// No-ops (build proceeds normally without upload) until SENTRY_AUTH_TOKEN/ORG/PROJECT
// are set — see config/observability/README.md.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  disableSentryWebpackConfig: !process.env.SENTRY_AUTH_TOKEN,
});
