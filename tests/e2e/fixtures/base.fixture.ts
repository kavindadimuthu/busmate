import { test as base, expect } from '@playwright/test';
import { BusStopsListPage } from '../page-objects/mot/bus-stops/bus-stops-list.page.js';
import { BusStopFormPage } from '../page-objects/mot/bus-stops/bus-stop-form.page.js';
import { BusStopDetailPage } from '../page-objects/mot/bus-stops/bus-stop-detail.page.js';
import { DashboardPage } from '../page-objects/mot/dashboard.page.js';

/**
 * Extended test fixture that injects pre-built page objects.
 *
 * Import `test` and `expect` from this file in all spec files
 * instead of from `@playwright/test`.
 */
type PageObjects = {
  dashboardPage: DashboardPage;
  busStopsListPage: BusStopsListPage;
  busStopFormPage: BusStopFormPage;
  busStopDetailPage: BusStopDetailPage;
};

export const test = base.extend<PageObjects>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  busStopsListPage: async ({ page }, use) => {
    await use(new BusStopsListPage(page));
  },
  busStopFormPage: async ({ page }, use) => {
    await use(new BusStopFormPage(page));
  },
  busStopDetailPage: async ({ page }, use) => {
    await use(new BusStopDetailPage(page));
  },
});

export { expect };
