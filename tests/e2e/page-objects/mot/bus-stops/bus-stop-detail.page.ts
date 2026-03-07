import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../../base.page.js';
import { DeleteModalComponent } from '../components/delete-modal.component.js';

/**
 * Page object for the Bus Stop detail page: /mot/bus-stops/{id}
 *
 * Shows basic info, location details with multilingual tabs,
 * a Google Maps mini-map, and system metadata.
 */
export class BusStopDetailPage extends BasePage {
  readonly url: string;
  readonly deleteModal: DeleteModalComponent;

  // Basic information
  readonly stopName: Locator;
  readonly stopDescription: Locator;
  readonly accessibilityBadge: Locator;

  // Location fields
  readonly addressValue: Locator;
  readonly cityValue: Locator;
  readonly stateValue: Locator;
  readonly coordinatesValue: Locator;

  // Action buttons (rendered in page header)
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  // Language tabs
  readonly englishTab: Locator;
  readonly sinhalaTab: Locator;
  readonly tamilTab: Locator;

  constructor(page: Page, busStopId?: string) {
    super(page);
    this.url = busStopId ? `/mot/bus-stops/${busStopId}` : '/mot/bus-stops';
    this.deleteModal = new DeleteModalComponent(page);

    this.stopName = page.locator('h2, h3').first();
    this.stopDescription = page.getByText(/description/i).locator('~ *').first();
    this.accessibilityBadge = page.getByText(/accessible|not accessible/i).first();

    this.addressValue = page.getByText(/address/i).first();
    this.cityValue = page.getByText(/city/i).first();
    this.stateValue = page.getByText(/state/i).first();
    this.coordinatesValue = page.locator('.font-mono').first();

    this.editButton = page.getByRole('button', { name: /edit/i });
    this.deleteButton = page.getByRole('button', { name: /delete/i });

    this.englishTab = page.getByRole('tab', { name: /english/i }).or(page.getByText('English', { exact: true }));
    this.sinhalaTab = page.getByRole('tab', { name: /sinhala/i }).or(page.getByText('Sinhala', { exact: true }));
    this.tamilTab = page.getByRole('tab', { name: /tamil/i }).or(page.getByText('Tamil', { exact: true }));
  }

  /** Assert the bus stop name is displayed. */
  async expectName(name: string) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  /** Click Edit — navigates to edit page. */
  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForURL(/\/mot\/bus-stops\/[a-f0-9-]+\/edit/);
  }

  /** Click Delete — opens the delete confirmation modal. */
  async clickDelete() {
    await this.deleteButton.click();
    await this.deleteModal.expectVisible();
  }

  /** Confirm deletion from the detail page. */
  async confirmDelete() {
    await this.deleteModal.confirm();
  }

  /** Switch to a language tab. */
  async switchToLanguageTab(lang: 'english' | 'sinhala' | 'tamil') {
    const tab = {
      english: this.englishTab,
      sinhala: this.sinhalaTab,
      tamil: this.tamilTab,
    }[lang];
    await tab.click();
  }
}
