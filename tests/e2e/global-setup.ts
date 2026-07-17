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
 * bounced back to the sign-in page at the app root).
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
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5173';
  const email = process.env.MOT_TEST_EMAIL;
  const password = process.env.MOT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'MOT_TEST_EMAIL and MOT_TEST_PASSWORD must be set in .env file. ' +
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

  // Reuse existing session if still valid — avoids a full login round-trip on
  // every individual test run.
  if (await isAuthStateValid(baseURL)) {
    return;
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Load the app root, which renders the self-hosted sign-in form. In Docker
    // mode the Vite dev server may be cold-starting, so allow a generous timeout.
    console.log('[global-setup] Loading sign-in page...');
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60_000 });

    // 2. Fill in the email/password login form (see components/auth/LoginForm.tsx).
    console.log('[global-setup] Filling in credentials...');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);

    // 3. Submit and wait for the BFF session to be established. On success the app
    // redirects by role — the MOT test account lands on /mot/dashboard.
    console.log('[global-setup] Submitting login...');
    await page.getByRole('button', { name: /sign in/i }).click();

    console.log('[global-setup] Waiting for redirect to MOT dashboard...');
    const dashboardReached = await page
      .waitForURL(/\/mot\/dashboard/, { timeout: 60_000, waitUntil: 'load' })
      .then(() => true)
      .catch(() => false);

    if (!dashboardReached) {
      const currentURL = page.url();
      console.error(`[global-setup] Failed to reach dashboard. Current URL: ${currentURL}`);
      await page.waitForTimeout(3000);
      const pageContent = await page.textContent('body');
      console.error(`[global-setup] Page content: ${pageContent?.substring(0, 200)}...`);
      throw new Error(`Login completed but redirect to dashboard failed. Stuck at: ${currentURL}`);
    }

    // 4. Wait for dashboard content to verify auth worked.
    console.log('[global-setup] Dashboard reached. Waiting for content to load...');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // 5. Save authenticated browser state (BFF session cookies) for the test run.
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
