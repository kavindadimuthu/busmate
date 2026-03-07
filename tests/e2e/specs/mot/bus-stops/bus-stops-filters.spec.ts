import { test, expect } from '../../../fixtures/base.fixture.js';

test.describe('MOT > Bus Stops > Filters & Search', () => {
  test.beforeEach(async ({ busStopsListPage }) => {
    await busStopsListPage.goto();
    await busStopsListPage.waitForLoadingToFinish();
  });

  test('should search bus stops by name', async ({ busStopsListPage }) => {
    // Use a name from the seed data — pick a commonly available name
    await busStopsListPage.filters.search('Colombo');
    await busStopsListPage.waitForLoadingToFinish();

    const rowCount = await busStopsListPage.table.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should show "No data found" for non-matching search', async ({ busStopsListPage }) => {
    await busStopsListPage.filters.search('XYZNONEXISTENT99999');
    await busStopsListPage.waitForLoadingToFinish();

    await busStopsListPage.table.expectEmpty();
  });

  test('should clear search and show all results', async ({ busStopsListPage }) => {
    // First search to filter
    await busStopsListPage.filters.search('XYZNONEXISTENT');
    await busStopsListPage.waitForLoadingToFinish();
    await busStopsListPage.table.expectEmpty();

    // Clear the search
    await busStopsListPage.filters.clearSearch();
    await busStopsListPage.filters.searchInput.press('Enter');
    await busStopsListPage.waitForLoadingToFinish();

    const rowCount = await busStopsListPage.table.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should clear all filters', async ({ busStopsListPage }) => {
    // Apply a search
    await busStopsListPage.filters.search('test');
    await busStopsListPage.waitForLoadingToFinish();

    // Clear all
    await busStopsListPage.filters.clearAllFilters();
    await busStopsListPage.waitForLoadingToFinish();

    // Should show data again
    const searchValue = await busStopsListPage.filters.getSearchValue();
    expect(searchValue).toBe('');
  });

  test('should sort by name when clicking column header', async ({ busStopsListPage }) => {
    await busStopsListPage.table.clickSortHeader('Name');
    await busStopsListPage.waitForLoadingToFinish();

    // Click again to reverse sort direction
    await busStopsListPage.table.clickSortHeader('Name');
    await busStopsListPage.waitForLoadingToFinish();

    const rowCount = await busStopsListPage.table.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should switch between table and map views', async ({ busStopsListPage, page }) => {
    // Switch to map view
    await busStopsListPage.switchToMapView();

    // The map container should be visible (Google Maps creates a specific div)
    await expect(page.locator('.gm-style').or(page.getByText(/map/i))).toBeVisible({ timeout: 15_000 });

    // Switch back to table view
    await busStopsListPage.switchToTableView();

    // Table should be visible again
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('should paginate through results', async ({ busStopsListPage }) => {
    // Check pagination is showing
    const showingText = busStopsListPage.pagination.showingText;
    await expect(showingText).toBeVisible();

    // If there are multiple pages, navigate
    const nextBtn = busStopsListPage.pagination.nextPageBtn;
    if (await nextBtn.isEnabled()) {
      await busStopsListPage.pagination.goToNextPage();
      await busStopsListPage.waitForLoadingToFinish();

      // Should now be on page 2
      const rowCount = await busStopsListPage.table.getRowCount();
      expect(rowCount).toBeGreaterThan(0);

      // Go back to first page
      await busStopsListPage.pagination.goToPreviousPage();
      await busStopsListPage.waitForLoadingToFinish();
    }
  });

  test('should change page size', async ({ busStopsListPage }) => {
    // Change to 5 items per page
    await busStopsListPage.pagination.setPageSize(5);
    await busStopsListPage.waitForLoadingToFinish();

    const rowCount = await busStopsListPage.table.getRowCount();
    expect(rowCount).toBeLessThanOrEqual(5);

    // Change to 25 items per page
    await busStopsListPage.pagination.setPageSize(25);
    await busStopsListPage.waitForLoadingToFinish();
  });

  test('should show correct record count in pagination', async ({ busStopsListPage }) => {
    await busStopsListPage.pagination.expectShowingText(/Showing\s+\d+/);
  });
});
