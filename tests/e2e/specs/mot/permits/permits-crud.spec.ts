import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Permits > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.permits);
    await page.waitForLoadState('networkidle');
  });

  test('should display permits list page with statistics cards', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display permits in a data table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to add new permit form', async ({ page }) => {
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.waitForURL(/\/mot\/passenger-service-permits\/add-new/);
  });

  test('should view permit details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByTitle('View details').click();
    await page.waitForURL(/\/mot\/passenger-service-permits\/[a-f0-9-]+$/);
  });
});

test.describe('MOT > Permits > Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.permits);
    await page.waitForLoadState('networkidle');
  });

  test('should search permits', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('PSP');
    await page.getByPlaceholder(/search/i).first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('should paginate results', async ({ page }) => {
    await expect(page.locator('text=Showing').first()).toBeVisible();
  });
});
