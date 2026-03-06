import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Staff Management > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.staffManagement);
    await page.waitForLoadState('networkidle');
  });

  test('should display staff list page with statistics cards', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display staff in a data table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to add new staff form', async ({ page }) => {
    await page.getByRole('button', { name: /add|new/i }).click();
    await page.waitForURL(/\/mot\/staff-management\/add-new/);
  });

  test('should view staff details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByTitle('View details').click();
    await page.waitForURL(/\/mot\/staff-management\/[a-f0-9-]+$/);
  });
});

test.describe('MOT > Staff Management > Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.staffManagement);
    await page.waitForLoadState('networkidle');
  });

  test('should search staff', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('driver');
    await page.getByPlaceholder(/search/i).first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('should paginate results', async ({ page }) => {
    await expect(page.locator('text=Showing').first()).toBeVisible();
  });
});
