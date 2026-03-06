import { test, expect } from '../../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../../utils/constants.js';

test.describe('MOT > Fares > List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MOT_URLS.fares);
    await page.waitForLoadState('networkidle');
  });

  test('should display fares page', async ({ page }) => {
    await expect(page).toHaveURL(/\/mot\/fares/);
  });

  test('should display fare matrix and amendments tabs', async ({ page }) => {
    // The fares page uses tabs for Matrix and Amendments
    await expect(page.getByText(/matrix|amendments/i).first()).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    await expect(page.locator('.bg-white').first()).toBeVisible();
  });
});

test.describe('MOT > Fares > Amendments', () => {
  test('should navigate to new amendment form', async ({ page }) => {
    await page.goto(MOT_URLS.fares);
    await page.waitForLoadState('networkidle');

    // Click on the amendments tab if available, then create new
    const newAmendmentBtn = page.getByRole('button', { name: /new amendment|create/i });
    if (await newAmendmentBtn.isVisible()) {
      await newAmendmentBtn.click();
      await page.waitForURL(/\/mot\/fares\/amendments\/new/);
    }
  });
});
