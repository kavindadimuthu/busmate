import { defineConfig } from '@playwright/test';

/**
 * Flow tests: real browsers against a real local stack (`node tests/flows/stack.mjs up`), one spec per journey.
 * They are ordered and share one database, so they run serially. PW_CHANNEL=chrome uses an installed Chrome
 * instead of Playwright's own Chromium (`pnpm exec playwright install chromium`).
 */
export default defineConfig({
  testDir: './specs',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'report', open: 'never' }]],
  use: {
    channel: process.env.PW_CHANNEL || undefined,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },
  outputDir: 'test-results',
});
