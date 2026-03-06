/**
 * Root-level Playwright config so tests can be run from the monorepo root
 * without specifying --config. All paths are absolute so they resolve
 * correctly regardless of the working directory.
 *
 * Usage examples (from monorepo root):
 *   pnpm exec playwright test                                        # full suite
 *   pnpm exec playwright test tests/e2e/specs/mot/navigation.spec.ts # single file
 *   pnpm exec playwright test -g "should navigate to Schedules"      # single test
 *   pnpm exec playwright test --headed                               # headed mode
 *   pnpm e2e                                                         # via npm script
 *   pnpm e2e:headed                                                  # headed via script
 */
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// __dirname is a CJS global — available because root package.json has no "type": "module"
const e2eDir = path.resolve(__dirname, 'tests/e2e');

dotenv.config({ path: path.resolve(e2eDir, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: path.resolve(e2eDir, 'specs'),
  testMatch: '**/*.spec.ts',

  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: path.resolve(e2eDir, 'playwright-report'), open: 'never' }],
    ['list'],
    ['json', { outputFile: path.resolve(e2eDir, 'test-results/results.json') }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  globalSetup: path.resolve(e2eDir, 'global-setup.ts'),
  globalTeardown: path.resolve(e2eDir, 'global-teardown.ts'),

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.resolve(e2eDir, 'auth/storage-state.json'),
      },
    },
  ],

  webServer: {
    command: 'pnpm --filter @busmate/management-portal dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: __dirname,
  },
});
