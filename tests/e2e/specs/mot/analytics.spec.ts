import { test, expect } from '../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../utils/constants.js';

test.describe('MOT > Analytics', () => {
  test('should display the analytics page', async ({ page }) => {
    await page.goto(MOT_URLS.analytics);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mot\/analytics/);
  });

  test('should render chart components', async ({ page }) => {
    await page.goto(MOT_URLS.analytics);
    await page.waitForLoadState('networkidle');

    // Charts render as SVG via Recharts
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15_000 });
  });
});
