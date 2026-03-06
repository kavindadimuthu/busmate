import { test, expect } from '../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../utils/constants.js';

test.describe('MOT > Profile', () => {
  test('should display the profile page', async ({ page }) => {
    await page.goto(MOT_URLS.profile);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mot\/profile/);
  });

  test('should display user information', async ({ page }) => {
    await page.goto(MOT_URLS.profile);
    await page.waitForLoadState('networkidle');

    // Profile page should show user details
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });
});
