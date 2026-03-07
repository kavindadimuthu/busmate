import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component object for the shared DataPagination component.
 * Matches: apps/frontend/management-portal/src/components/shared/DataPagination.tsx
 *
 * Note: Pages are zero-based internally but displayed as 1-based to the user.
 */
export class DataPaginationComponent {
  readonly page: Page;
  readonly showingText: Locator;
  readonly pageSizeSelect: Locator;
  readonly firstPageBtn: Locator;
  readonly prevPageBtn: Locator;
  readonly nextPageBtn: Locator;
  readonly lastPageBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.showingText = page.locator('text=Showing').first();
    this.pageSizeSelect = page.locator('#dataPaginationPageSize');
    this.firstPageBtn = page.getByTitle('First page');
    this.prevPageBtn = page.getByRole('button', { name: 'Prev' });
    this.nextPageBtn = page.getByRole('button', { name: 'Next' });
    this.lastPageBtn = page.getByTitle('Last page');
  }

  async goToNextPage() {
    await this.nextPageBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPreviousPage() {
    await this.prevPageBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToFirstPage() {
    await this.firstPageBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToLastPage() {
    await this.lastPageBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Change the page size via the dropdown. */
  async setPageSize(size: number) {
    await this.pageSizeSelect.selectOption(String(size));
    await this.page.waitForLoadState('networkidle');
  }

  /** Click a specific page number button (1-based, as displayed). */
  async goToPage(displayedPageNumber: number) {
    await this.page
      .getByRole('button', { name: String(displayedPageNumber), exact: true })
      .click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert the "Showing X–Y of Z" text matches a pattern. */
  async expectShowingText(pattern: RegExp) {
    await expect(this.showingText).toHaveText(pattern);
  }

  /** Assert "No results" is shown. */
  async expectNoResults() {
    await expect(this.page.locator('text=No results')).toBeVisible();
  }

  /** Assert the next button is disabled. */
  async expectNextDisabled() {
    await expect(this.nextPageBtn).toBeDisabled();
  }

  /** Assert the previous button is disabled. */
  async expectPrevDisabled() {
    await expect(this.prevPageBtn).toBeDisabled();
  }
}
