import type { Page } from '@playwright/test';
import { TIMEOUTS } from './constants.js';

/**
 * Wait for all loading indicators (spinners/skeletons) to disappear.
 */
export async function waitForLoadingToFinish(page: Page, timeout = TIMEOUTS.navigation) {
  await page.waitForFunction(
    () => {
      const spinners = document.querySelectorAll('.animate-spin');
      const pulses = document.querySelectorAll('.animate-pulse');
      return spinners.length === 0 && pulses.length === 0;
    },
    null,
    { timeout },
  );
}

/**
 * Wait for a specific API response and return it.
 */
export async function waitForApiResponse(page: Page, urlPattern: string) {
  return page.waitForResponse(
    (response) => response.url().includes(urlPattern) && response.status() === 200,
    { timeout: TIMEOUTS.navigation },
  );
}

/**
 * Wait for the filter debounce period, then wait for the API response.
 * Use this after changing a filter value that has a debounce.
 */
export async function waitForFilterResult(page: Page, apiUrlPattern: string) {
  await page.waitForTimeout(TIMEOUTS.filterDebounce);
  await waitForApiResponse(page, apiUrlPattern);
}

/**
 * Wait for a toast notification to appear with matching text.
 */
export async function waitForToast(page: Page, text: string | RegExp) {
  const toast = page
    .locator('[data-sonner-toast], [role="status"]')
    .filter({ hasText: text });
  await toast.waitFor({ state: 'visible', timeout: TIMEOUTS.toast });
  return toast;
}
