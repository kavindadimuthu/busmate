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
    // 1. Pre-warm the Next.js app to ensure pages are compiled (important in Docker mode)
    console.log('[global-setup] Pre-warming Next.js application...');
    try {
      await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60_000 });
      console.log('[global-setup] Application is ready.');
    } catch (error) {
      console.warn(`[global-setup] Pre-warm failed (may be expected): ${error}`);
      // Continue anyway - the app might just be slow to start
    }

    // Wait a bit to ensure all resources are loaded
    await page.waitForTimeout(2000);

    // 2. Navigate to the landing page (refresh to ensure clean state)
    console.log('[global-setup] Navigating to landing page...');
    await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 30_000 });

    // 3. Click the Asgardeo Sign In button
    console.log('[global-setup] Clicking Sign In button...');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 4. Wait for redirect to Asgardeo login page
    console.log('[global-setup] Waiting for Asgardeo login page...');
    await page.waitForURL(/accounts\.asgardeo\.io|asgardeo/, { timeout: 30_000 });
    console.log(`[global-setup] Asgardeo page URL: ${page.url()}`);

    // 5. Fill in Asgardeo login form
    console.log('[global-setup] Filling in credentials...');
    await page.getByPlaceholder(/enter your username/i).fill(username);
    await page.getByPlaceholder(/enter your password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in|continue/i }).click();

    // 6. Handle potential consent screen (may not appear in test environments)
    try {
      const consentButton = page.getByRole('button', { name: /allow|approve|continue/i });
      await consentButton.click({ timeout: 5_000 });
    } catch {
      // No consent screen — continue
    }

    // 7. Wait for redirect back to the application
    // In Docker mode, the OAuth callback lands at the root (/) and then the app
    // processes the session and redirects to the appropriate dashboard. This can
    // take longer in Docker due to cold-start of Next.js server.
    console.log('[global-setup] Waiting for redirect from Asgardeo...');
    await page.waitForURL(url => !url.toString().includes('asgardeo'), { timeout: 45_000 });
    console.log(`[global-setup] Redirected to: ${page.url()}`);

    // 8. Wait for the app to process authentication and redirect to dashboard
    // The root page calls getUserData() which may take time in Docker mode.
    // We use a polling approach with a generous timeout.
    console.log('[global-setup] Waiting for redirect to MOT dashboard...');
    const dashboardReached = await page.waitForURL(/\/mot\/dashboard/, { 
      timeout: 60_000,  // Increased timeout for Docker cold-start
      waitUntil: 'load'
    }).then(() => true).catch(() => false);

    if (!dashboardReached) {
      // If we're still at root after 60s, something is wrong with the auth flow
      const currentURL = page.url();
      console.error(`[global-setup] Failed to reach dashboard. Current URL: ${currentURL}`);
      
      // Wait a bit more and check the page content for debugging
      await page.waitForTimeout(5000);
      const pageContent = await page.textContent('body');
      console.error(`[global-setup] Page content: ${pageContent?.substring(0, 200)}...`);
      
      throw new Error(`Authentication completed but redirect to dashboard failed. Stuck at: ${currentURL}`);
    }

    // 9. Wait for dashboard content to verify auth worked
    console.log('[global-setup] Dashboard reached. Waiting for content to load...');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // 10. Save authenticated browser state
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
