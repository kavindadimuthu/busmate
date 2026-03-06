import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

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

  /* Start the Next.js dev server before running tests */
  webServer: {
    command: 'pnpm --filter @busmate/management-portal dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: path.resolve(__dirname, '../..'), // monorepo root
  },
});
