import type { Browser, BrowserContext, Page } from '@playwright/test';
import type { Account } from './accounts';
import { URLS } from './api';

/** A fresh browser context signed in to passenger-web as this account. */
export async function passengerWeb(browser: Browser, account: Account): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${URLS.web}/login`);
  await page.getByPlaceholder('you@example.com').fill(account.email);
  await page.locator('input[type=password]').fill(account.password);
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
  return { context, page };
}

/** A fresh browser context signed in to the staff portal as this account. */
export async function portal(browser: Browser, account: Account): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${URLS.portal}/`);
  await page.getByPlaceholder('you@busmate.lk').fill(account.email);
  await page.locator('input[type=password]').fill(account.password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((u) => u.pathname !== '/', { timeout: 30_000 });
  return { context, page };
}
