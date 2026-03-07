import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component object for the shared DataTable component.
 * Matches: apps/frontend/management-portal/src/components/shared/DataTable.tsx
 */
export class DataTableComponent {
  readonly page: Page;
  readonly root: Locator;
  readonly headerRow: Locator;
  readonly bodyRows: Locator;
  readonly emptyStateHeading: Locator;
  readonly emptyStateDescription: Locator;
  readonly refreshingIndicator: Locator;

  constructor(page: Page, rootSelector?: string) {
    this.page = page;
    this.root = rootSelector ? page.locator(rootSelector) : page.locator('table').first();
    this.headerRow = this.root.locator('thead tr');
    this.bodyRows = this.root.locator('tbody tr');
    // Empty state is rendered outside the table element
    this.emptyStateHeading = page.locator('h3:has-text("No data found")');
    this.emptyStateDescription = page.locator('text=Try adjusting your search or filters');
    this.refreshingIndicator = page.locator('text=Refreshing…');
  }

  /** Get the number of visible data rows. */
  async getRowCount(): Promise<number> {
    return this.bodyRows.count();
  }

  /** Click a sortable column header to toggle sort. */
  async clickSortHeader(headerText: string) {
    await this.headerRow.locator('th').filter({ hasText: headerText }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Get a row locator by its index (0-based). */
  getRowByIndex(index: number): Locator {
    return this.bodyRows.nth(index);
  }

  /** Get a row locator by matching text content. */
  getRowByText(text: string): Locator {
    return this.bodyRows.filter({ hasText: text });
  }

  /** Click an action button within a specific row. */
  async clickRowAction(rowText: string, actionTitle: string) {
    const row = this.bodyRows.filter({ hasText: rowText });
    await row.getByTitle(actionTitle).click();
  }

  /** Click the View action on a row. */
  async clickViewButton(rowText: string) {
    await this.clickRowAction(rowText, 'View details');
  }

  /** Click the Edit action on a row. */
  async clickEditButton(rowText: string) {
    await this.clickRowAction(rowText, 'Edit');
  }

  /** Click the Delete action on a row. */
  async clickDeleteButton(rowText: string) {
    await this.clickRowAction(rowText, 'Delete');
  }

  /** Assert a row with the given text is visible. */
  async expectRowVisible(text: string) {
    await expect(this.bodyRows.filter({ hasText: text })).toBeVisible();
  }

  /** Assert the table is showing the empty state. */
  async expectEmpty() {
    await expect(this.emptyStateHeading).toBeVisible();
  }

  /** Assert skeleton loading rows are visible. */
  async expectLoading() {
    await expect(this.page.locator('.animate-pulse').first()).toBeVisible();
  }

  /** Assert the refreshing indicator is visible. */
  async expectRefreshing() {
    await expect(this.refreshingIndicator).toBeVisible();
  }
}
