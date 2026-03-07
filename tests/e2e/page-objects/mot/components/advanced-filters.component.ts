import { type Page, type Locator } from '@playwright/test';

/**
 * Component object for the filter bar pattern used across list pages.
 * Handles search input, filter dropdowns, and clear actions.
 */
export class AdvancedFiltersComponent {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly clearAllButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search/i).first();
    this.clearAllButton = page.getByRole('button', { name: /clear all|clear filters/i });
  }

  /** Type a search term and press Enter to submit. */
  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /** Clear the search input. */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the "Clear All" filters button. */
  async clearAllFilters() {
    await this.clearAllButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a value from a filter dropdown.
   * Uses the select element that contains the target option.
   */
  async selectFilter(filterLabel: string, optionText: string) {
    const select = this.page.getByLabel(filterLabel);
    await select.selectOption({ label: optionText });
    await this.page.waitForLoadState('networkidle');
  }

  /** Get the current value of the search input. */
  async getSearchValue(): Promise<string> {
    return (await this.searchInput.inputValue()) ?? '';
  }
}
