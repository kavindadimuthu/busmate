import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Base page object with common methods shared by all pages.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastContainer = page.locator('[data-sonner-toaster], [role="status"]');
  }

  /** The URL path for this page (e.g., '/mot/bus-stops'). */
  abstract readonly url: string;

  /** Navigate to this page. */
  async goto() {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /** Wait for the page to fully load. */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for a specific API response matching the URL pattern. */
  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(
      (response) =>
        (typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())) && response.status() === 200,
    );
  }

  /** Navigate using the sidebar link text. */
  async navigateViaSidebar(label: string) {
    await this.page.locator('nav').getByText(label, { exact: false }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert that a toast message is visible. */
  async expectToastMessage(text: string | RegExp) {
    await expect(
      this.page
        .locator('[data-sonner-toast], [role="status"]')
        .filter({ hasText: text }),
    ).toBeVisible({ timeout: 10_000 });
  }

  /** Assert visible text on the page. */
  async expectPageTitle(title: string) {
    await expect(
      this.page.getByText(title, { exact: false }).first(),
    ).toBeVisible();
  }

  /** Get current URL. */
  async getUrl(): Promise<string> {
    return this.page.url();
  }

  /** Wait for all skeleton loaders and spinners to disappear. */
  async waitForLoadingToFinish() {
    await this.page.waitForFunction(
      () => {
        const spinners = document.querySelectorAll('.animate-spin');
        const pulses = document.querySelectorAll('.animate-pulse');
        return spinners.length === 0 && pulses.length === 0;
      },
      null,
      { timeout: 30_000 },
    );
  }
}
