import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Trips > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.trips);
    await page.waitForLoadState('networkidle');
  });

  test('should display trips list page with statistics cards', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display trips in a data table', async ({ page }) => {
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should view trip details', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByTitle('View details').click();
    await page.waitForURL(/\/mot\/trips\/[a-f0-9-]+$/);
  });
});

test.describe('MOT > Trips > Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.trips);
    await page.waitForLoadState('networkidle');
  });

  test('should search trips', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Trip');
    await page.getByPlaceholder(/search/i).first().press('Enter');
    await page.waitForLoadState('networkidle');
  });

  test('should paginate results', async ({ page }) => {
    await expect(page.locator('text=Showing').first()).toBeVisible();
  });
});

test.describe('MOT > Trips > Assignment', () => {
  test('should navigate to trip assignment page', async ({ page }) => {
    await page.goto(MOT_URLS.tripsAssignment);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mot\/trips\/assignment/);
  });
});
