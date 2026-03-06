import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Routes > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.routes);
    await page.waitForLoadState('networkidle');
  });

  test('should display routes list page with statistics cards', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display routes in a data table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should view route group details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByTitle('View details').click();
    await page.waitForURL(/\/mot\/routes\/[a-f0-9-]+$/);
  });
});

test.describe('MOT > Routes > Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.routes);
    await page.waitForLoadState('networkidle');
  });

  test('should search routes', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Colombo');
    await page.getByPlaceholder(/search/i).first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('should paginate results', async ({ page }) => {
    await expect(page.locator('text=Showing').first()).toBeVisible();
  });
});
