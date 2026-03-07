import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../../base.page.js';
import { DataTableComponent } from '../components/data-table.component.js';
import { DataPaginationComponent } from '../components/data-pagination.component.js';
import { AdvancedFiltersComponent } from '../components/advanced-filters.component.js';
import { DeleteModalComponent } from '../components/delete-modal.component.js';

/**
 * Page object for the Bus Stops list page: /mot/bus-stops
 */
export class BusStopsListPage extends BasePage {
  readonly url = '/mot/bus-stops';
  readonly table: DataTableComponent;
  readonly pagination: DataPaginationComponent;
  readonly filters: AdvancedFiltersComponent;
  readonly deleteModal: DeleteModalComponent;

  // Stats cards
  readonly totalStopsCard: Locator;
  readonly accessibleStopsCard: Locator;

  // Action buttons (rendered in the page header via PageContext)
  readonly addBusStopButton: Locator;
  readonly importButton: Locator;

  // View tabs
  readonly tableViewTab: Locator;
  readonly mapViewTab: Locator;

  // Error state
  readonly errorMessage: Locator;
  readonly tryAgainButton: Locator;

  constructor(page: Page) {
    super(page);
    this.table = new DataTableComponent(page);
    this.pagination = new DataPaginationComponent(page);
    this.filters = new AdvancedFiltersComponent(page);
    this.deleteModal = new DeleteModalComponent(page);

    this.totalStopsCard = page.getByText(/total stops/i);
    this.accessibleStopsCard = page.getByText(/accessible/i).first();

    this.addBusStopButton = page.getByRole('button', { name: /add new|add bus stop|new stop/i });
    this.importButton = page.getByRole('button', { name: /import/i });

    this.tableViewTab = page.getByText('Table', { exact: true });
    this.mapViewTab = page.getByText('Map', { exact: true });

    this.errorMessage = page.getByText(/error loading bus stops/i);
    this.tryAgainButton = page.getByRole('button', { name: /try again/i });
  }

  /** Click the Add Bus Stop button — navigates to /mot/bus-stops/add-new. */
  async clickAddBusStop() {
    await this.addBusStopButton.click();
    await this.page.waitForURL(/\/mot\/bus-stops\/add-new/);
  }

  /** Click the Import button — navigates to /mot/bus-stops/import. */
  async clickImport() {
    await this.importButton.click();
    await this.page.waitForURL(/\/mot\/bus-stops\/import/);
  }

  /** Switch to the map view tab. */
  async switchToMapView() {
    await this.mapViewTab.click();
  }

  /** Switch to the table view tab. */
  async switchToTableView() {
    await this.tableViewTab.click();
  }

  /** Click View on a bus stop row. */
  async viewBusStop(name: string) {
    await this.table.clickViewButton(name);
    await this.page.waitForURL(/\/mot\/bus-stops\/[a-f0-9-]+$/);
  }

  /** Click Edit on a bus stop row. */
  async editBusStop(name: string) {
    await this.table.clickEditButton(name);
    await this.page.waitForURL(/\/mot\/bus-stops\/[a-f0-9-]+\/edit/);
  }

  /** Delete a bus stop via the confirmation modal. */
  async deleteBusStop(name: string) {
    await this.table.clickDeleteButton(name);
    await this.deleteModal.expectVisible();
    await this.deleteModal.confirm();
  }

  /** Assert the stats cards are visible. */
  async expectStatsVisible() {
    await expect(this.totalStopsCard).toBeVisible();
  }

  /** Assert the error state is showing. */
  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }
}
