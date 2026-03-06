import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Operators > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.operators);
    await page.waitForLoadState('networkidle');
  });

  test('should display operators list page with statistics cards', async ({ page }) => {
    // Stats cards should be visible
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display operators in a data table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to add new operator form', async ({ page }) => {
    await page.getByRole('button', { name: /add|new/i }).click();
    await page.waitForURL(/\/mot\/operators\/add-new/);
  });

  test('should view operator details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByTitle('View details').click();
    await page.waitForURL(/\/mot\/operators\/[a-f0-9-]+$/);
  });
});

test.describe('MOT > Operators > Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.operators);
    await page.waitForLoadState('networkidle');
  });

  test('should search operators by name', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('CTB');
    await page.getByPlaceholder(/search/i).first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('should paginate results', async ({ page }) => {
    await expect(page.locator('text=Showing').first()).toBeVisible();
  });
});
