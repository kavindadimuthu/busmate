import { test, expect } from '../../fixtures/base.fixture.js';
import { MOT_URLS } from '../../utils/constants.js';

test.describe('MOT > Navigation', () => {
  test('should load the dashboard after authentication', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
  });

  test('should navigate to Bus Stops page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Bus Stops', { exact: false }).click();
    await page.waitForURL(/\/mot\/bus-stops/);
    await expect(page.getByText(/bus stops/i).first()).toBeVisible();
  });

  test('should navigate to Buses page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Bus Management', { exact: false }).click();
    await page.waitForURL(/\/mot\/buses/);
  });

  test('should navigate to Operators page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Operator', { exact: false }).click();
    await page.waitForURL(/\/mot\/operators/);
  });

  test('should navigate to Routes page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Route', { exact: false }).click();
    await page.waitForURL(/\/mot\/routes/);
  });

  test('should navigate to Schedules page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Schedule', { exact: false }).click();
    await page.waitForURL(/\/mot\/schedules/);
  });

  test('should navigate to Trips page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Trip', { exact: false }).click();
    await page.waitForURL(/\/mot\/trips/);
  });

  test('should navigate to Permits page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Permit', { exact: false }).click();
    await page.waitForURL(/\/mot\/passenger-service-permits/);
  });

  test('should navigate to Fares page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Fare', { exact: false }).click();
    await page.waitForURL(/\/mot\/fares/);
  });

  test('should navigate to Staff Management page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Staff', { exact: false }).click();
    await page.waitForURL(/\/mot\/staff-management/);
  });

  test('should navigate to Notifications page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Notifications', { exact: false }).click();
    await page.waitForURL(/\/mot\/notifications/);
  });

  test('should navigate to Policies page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Policies', { exact: false }).click();
    await page.waitForURL(/\/mot\/policies/);
  });

  test('should navigate to Analytics page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Analytics', { exact: false }).click();
    await page.waitForURL(/\/mot\/analytics/);
  });

  test('should navigate to Location Tracking page via sidebar', async ({ page }) => {
    await page.goto(MOT_URLS.dashboard);
    await page.waitForLoadState('networkidle');
    await page.locator('nav').getByText('Location Tracking', { exact: false }).click();
    await page.waitForURL(/\/mot\/location-tracking/);
  });
});
