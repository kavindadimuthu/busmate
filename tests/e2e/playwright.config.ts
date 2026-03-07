import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// When running against the Docker e2e environment the backend is on port 8081.
// When running against the local dev environment the backend is on port 8080.
// The API_URL variable (set in .env) controls which backend the Next.js dev
// server points to via the NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL env var.
const API_URL = process.env.API_URL || 'http://localhost:8080';

// Set to true when using the Docker e2e environment (pnpm run e2e:docker).
// In Docker mode we never reuse an already-running server because it may be
// pointing at the wrong backend (e.g. a local dev server on port 8080).
const isDockerEnv = process.env.E2E_DOCKER === 'true';

// When running against the Docker e2e environment the backend is on port 8081.
// When running against the local dev environment the backend is on port 8080.
// The API_URL variable (set in .env) controls which backend the Next.js dev
// server points to via the NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL env var.
const API_URL = process.env.API_URL || 'http://localhost:8080';

// Set to true when using the Docker e2e environment (pnpm run e2e:docker).
// In Docker mode we never reuse an already-running server because it may be
// pointing at the wrong backend (e.g. a local dev server on port 8080).
const isDockerEnv = process.env.E2E_DOCKER === 'true';

export default defineConfig({
  testDir: './specs',
  testMatch: '**/*.spec.ts',

  /* Maximum time one test can run */
  timeout: 60_000,

  /* Assertion timeout */
  expect: {
    timeout: 10_000,
  },

  /* Sequential — shared DB means parallel would cause data conflicts */
  fullyParallel: false,

  /* Fail the build on CI if test.only was left in source */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Single worker for real backend stability */
  workers: 1,

  /* Reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  /* Shared settings for all projects */
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* Global setup: authenticate once via Asgardeo, save storageState */
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Absolute path so this config works regardless of working directory
        storageState: path.resolve(__dirname, 'auth/storage-state.json'),
      },
    },
    // Uncomment to add more browser targets:
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: path.resolve(__dirname, 'auth/storage-state.json'),
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: path.resolve(__dirname, 'auth/storage-state.json'),
    //   },
    // },
  ],

  /* Start the Next.js dev server before running tests.
   *
   * In Docker e2e mode (E2E_DOCKER=true) the server is always started fresh so
   * that the NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL env var is guaranteed to point
   * at the Docker test backend, not a stale dev server on port 8080.
   *
   * In standard dev mode the server is reused if already running (unless on CI).
   * 
   * Webpack is used instead of Turbopack in Docker e2e mode to prevent build hangs
   * and resource exhaustion issues. Memory limits are also set to prevent system lockups.
   */
  webServer: {
    // Use webpack in e2e mode instead of Turbopack to prevent build hangs
    // Set memory limits to prevent resource exhaustion
    command: isDockerEnv 
      ? 'NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter @busmate/management-portal dev -- --webpack'
      : 'pnpm --filter @busmate/management-portal dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI && !isDockerEnv,
    timeout: isDockerEnv ? 120_000 : 120_000,  // Increased timeout for Docker cold-start
    cwd: path.resolve(__dirname, '../..'), // monorepo root
    env: {
      // Forward the test backend URL so the Next.js dev server uses the correct
      // API endpoint (Docker: http://localhost:8081, dev: http://localhost:8080).
      NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL: API_URL,
    },
    env: {
      // Forward the test backend URL so the Next.js dev server uses the correct
      // API endpoint (Docker: http://localhost:8081, dev: http://localhost:8080).
      NEXT_PUBLIC_ROUTE_MANAGEMENT_API_URL: API_URL,
    },
  },
});
