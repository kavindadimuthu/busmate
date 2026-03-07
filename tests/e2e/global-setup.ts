import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '.env') });

const STORAGE_STATE_PATH = path.resolve(__dirname, 'auth/storage-state.json');
const AUTH_DIR = path.resolve(__dirname, 'auth');
const TEST_RESULTS_DIR = path.resolve(__dirname, 'test-results');

/**
 * Check whether the saved storage state still grants access to the dashboard.
 * Returns true if a quick headless navigation lands on /mot/dashboard (not
 * redirected to the Asgardeo login page).
 */
async function isAuthStateValid(baseURL: string): Promise<boolean> {
  if (!fs.existsSync(STORAGE_STATE_PATH)) {
    console.log('[global-setup] No existing storage state found.');
    return false;
  }

  console.log('[global-setup] Validating existing auth state...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/mot/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 20_000,
    });
    const currentURL = page.url();
    const valid = currentURL.includes('/mot/dashboard');
    console.log(
      valid
        ? '[global-setup] Existing auth state is valid — skipping re-authentication.'
        : `[global-setup] Auth state is stale (landed on: ${currentURL}).`
    );
    return valid;
  } catch {
    console.log('[global-setup] Could not validate auth state (timeout or navigation error).');
    return false;
  } finally {
    await browser.close();
  }
}

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
  const username = process.env.ASGARDEO_TEST_USERNAME;
  const password = process.env.ASGARDEO_TEST_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'ASGARDEO_TEST_USERNAME and ASGARDEO_TEST_PASSWORD must be set in .env file. ' +
      'Copy .env.example to .env and fill in test credentials.'
    );
  }

  // Ensure directories exist
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  }

  // Reuse existing session if still valid — avoids full Asgardeo round-trip
  // on every individual test run.
  if (await isAuthStateValid(baseURL)) {
    return;
  }

  // --headed sets PWHEADLESS=0 (or leaves it unset); headless runs set it to 1.
  // Keep setup headless regardless — the visible browser is the test browser.
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  // Hide the webdriver flag that Asgardeo uses to detect headless automation
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();

  try {
    // 1. Navigate to the landing page
    console.log('[global-setup] Navigating to landing page...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });

    // 2. Click the Asgardeo Sign In button
    console.log('[global-setup] Clicking Sign In button...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3. Wait for redirect to Asgardeo login page
    console.log('[global-setup] Waiting for Asgardeo login page...');
    await page.waitForURL(/accounts\.asgardeo\.io|asgardeo/, { timeout: 30_000 });
    console.log(`[global-setup] Asgardeo page URL: ${page.url()}`);

    // 4. Fill in Asgardeo login form
    console.log('[global-setup] Filling in credentials...');
    await page.getByPlaceholder(/enter your username/i).fill(username);
    await page.getByPlaceholder(/enter your password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in|continue/i }).click();

    // 5. Handle potential consent screen (may not appear in test environments)
    try {
      const consentButton = page.getByRole('button', { name: /allow|approve|continue/i });
      await consentButton.click({ timeout: 5_000 });
    } catch {
      // No consent screen — continue
    }

    // 6. Wait for redirect back to the MOT dashboard
    console.log('[global-setup] Waiting for redirect to MOT dashboard...');
    await page.waitForURL(/\/mot\/dashboard/, { timeout: 30_000 });

    // 7. Wait for dashboard content to verify auth worked
    await page.waitForLoadState('networkidle');

    // 8. Save authenticated browser state
    await context.storageState({ path: STORAGE_STATE_PATH });
    console.log('[global-setup] Authentication successful. Storage state saved.');
  } catch (error) {
    // Save screenshot for debugging auth failures
    const screenshotPath = path.resolve(TEST_RESULTS_DIR, 'auth-failure.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`[global-setup] Auth failure screenshot saved to: ${screenshotPath}`);
    throw new Error(`Global setup authentication failed: ${error}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
