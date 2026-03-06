import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Notifications > CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.notifications);
    await page.waitForLoadState('networkidle');
  });

  test('should display notifications page', async ({ page }) => {
    await expect(page).toHaveURL(/\/mot\/notifications/);
  });

  test('should display inbox and sent tabs', async ({ page }) => {
    await expect(page.getByText(/inbox|sent/i).first()).toBeVisible();
  });
});

test.describe('MOT > Notifications > Compose', () => {
  test('should navigate to compose page', async ({ page }) => {
    await page.goto(MOT_URLS.notificationsCompose);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/mot\/notifications\/compose/);
  });

  test('should display compose form', async ({ page }) => {
    await page.goto(MOT_URLS.notificationsCompose);
    await page.waitForLoadState('networkidle');

    // Compose page should have input fields
    await expect(page.locator('input, textarea').first()).toBeVisible();
  });
});
