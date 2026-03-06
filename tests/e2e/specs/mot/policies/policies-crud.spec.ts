import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Policies > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.policies);
    await page.waitForLoadState('networkidle');
  });

  test('should display policies list page', async ({ page }) => {
    await expect(page).toHaveURL(/\/mot\/policies/);
  });

  test('should display policies in a list', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });

  test('should navigate to upload policy page', async ({ page }) => {
    const uploadBtn = page.getByRole('button', { name: /upload|add|new/i });
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      await page.waitForURL(/\/mot\/policies\/upload/);
    }
  });
});
