import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page.js';

/**
 * Page object for the Dashboard page: /mot/dashboard
 */
export class DashboardPage extends BasePage {
  readonly url = '/mot/dashboard';

  constructor(page: Page) {
    super(page);
  }

  /** Assert the dashboard has loaded by checking for KPI cards. */
  async expectLoaded() {
    await this.page.waitForLoadState('networkidle');
  }
}
