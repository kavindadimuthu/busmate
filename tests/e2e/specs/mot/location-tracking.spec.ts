import { test, expect } from '../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../utils/constants.js';

test.describe('MOT > Location Tracking', () => {
  test('should display the location tracking page', async ({ page }) => {
    await page.goto(MOT_URLS.locationTracking);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mot\/location-tracking/);
  });

  test('should render map component', async ({ page }) => {
    await page.goto(MOT_URLS.locationTracking);
    await page.waitForLoadState('networkidle');

    // Google Maps creates a div with class "gm-style"
    await expect(
      page.locator('.gm-style').or(page.locator('[class*="map"]')),
    ).toBeVisible({ timeout: 15_000 });
  });
});
