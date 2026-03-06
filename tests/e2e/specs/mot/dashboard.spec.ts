import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('MOT > Dashboard', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  test('should display the dashboard page', async ({ page }) => {
    await expect(page).toHaveURL(/\/mot\/dashboard/);
  });

  test('should display KPI stat cards', async ({ page }) => {
    // The dashboard should show stat cards with numbers
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should display charts and visualizations', async ({ page }) => {
    // Check that chart containers are present
    await page.waitForLoadState('networkidle');
    // Charts are rendered via Recharts — they create SVG elements
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15_000 });
  });

  test('should display quick action buttons', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Dashboard quick actions should be clickable
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
  });
});
