// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/test-results.xml' }],
    ['list'] // Console output
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',

    /* API testing configuration */
    extraHTTPHeaders: {
      // Add any default headers here if needed
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  },

  /* Configure projects for major browsers - For API testing, we mainly use one project */
  projects: [
    {
      name: 'api-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.spec.js',
    },
  ],

  /* Run your local Spring Boot server before starting the tests */
  webServer: {
    command: 'echo "Please make sure your Spring Boot server is running on http://localhost:8080"',
    url: 'http://localhost:8080/actuator/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./utils/global-setup.js'),
  globalTeardown: require.resolve('./utils/global-teardown.js'),

  /* Test timeout */
  timeout: 30000,
  expect: {
    timeout: 10000
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',
});