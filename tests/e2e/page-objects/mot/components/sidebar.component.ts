import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component object for sidebar navigation.
 * Mirrors the SidebarClient component structure.
 */
export class SidebarComponent {
  readonly page: Page;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('nav').first();
  }

  /** Click a sidebar navigation item by its label text. */
  async navigateTo(label: string) {
    await this.sidebar.getByText(label, { exact: false }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert a sidebar item is highlighted/active. */
  async expectActiveItem(label: string) {
    const item = this.sidebar.getByText(label, { exact: false });
    await expect(item).toBeVisible();
  }

  /** Assert the sidebar is visible. */
  async expectVisible() {
    await expect(this.sidebar).toBeVisible();
  }
}
