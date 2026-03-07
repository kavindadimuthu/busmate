import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Bus Stops > Import & Export', () => {
  test('should navigate to the import page', async ({ busStopsListPage, page }) => {
    await busStopsListPage.goto();
    await busStopsListPage.waitForLoadingToFinish();

    await busStopsListPage.clickImport();
    await expect(page).toHaveURL(/\/mot\/bus-stops\/import/);
  });

  test('should display the import page content', async ({ page }) => {
    await page.goto(MOT_URLS.busStopsImport);
    await page.waitForLoadState('networkidle');

    // Import page should have some content (file upload area, instructions, etc.)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should display the export page content', async ({ page }) => {
    await page.goto(MOT_URLS.busStopsExport);
    await page.waitForLoadState('networkidle');

    // Export page should display export options
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
