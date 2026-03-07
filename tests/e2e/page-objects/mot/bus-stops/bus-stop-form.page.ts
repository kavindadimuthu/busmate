import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../../base.page.js';

/**
 * Page object for the Bus Stop create/edit form.
 * Create: /mot/bus-stops/add-new
 * Edit:   /mot/bus-stops/{id}/edit
 *
 * Matches: apps/frontend/management-portal/src/components/mot/bus-stops/bus-stop-form.tsx
 */
export class BusStopFormPage extends BasePage {
  readonly url: string;
  readonly isEdit: boolean;

  // Basic Information fields
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly accessibleCheckbox: Locator;

  // Location fields
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly countryInput: Locator;
  readonly mapSearchInput: Locator;

  // Form actions
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Error indicators
  readonly generalError: Locator;
  readonly fieldErrors: Locator;

  constructor(page: Page, busStopId?: string) {
    super(page);
    this.isEdit = !!busStopId;
    this.url = busStopId
      ? `/mot/bus-stops/${busStopId}/edit`
      : '/mot/bus-stops/add-new';

    // Basic info
    this.nameInput = page.getByPlaceholder('Enter bus stop name');
    this.descriptionInput = page.getByPlaceholder('Enter bus stop description (optional)');
    this.accessibleCheckbox = page.getByText('This bus stop is wheelchair accessible');

    // Location
    this.addressInput = page.getByPlaceholder('Enter street address');
    this.cityInput = page.getByPlaceholder('Enter city');
    this.stateInput = page.getByPlaceholder('Enter state or province');
    this.zipCodeInput = page.getByPlaceholder('Enter ZIP or postal code');
    this.countryInput = page.getByPlaceholder('Enter country');
    this.mapSearchInput = page.getByPlaceholder('Search for an address or place...');

    // Actions — button text depends on create vs edit mode
    this.submitButton = this.isEdit
      ? page.getByRole('button', { name: /update bus stop/i })
      : page.getByRole('button', { name: /create bus stop/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });

    // Errors
    this.generalError = page.locator('.bg-red-50');
    this.fieldErrors = page.locator('.text-red-600');
  }

  /** Fill in the basic information section. */
  async fillBasicInfo(data: {
    name: string;
    description?: string;
    accessible?: boolean;
  }) {
    await this.nameInput.fill(data.name);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.accessible !== undefined) {
      const checkbox = this.page.locator('input[type="checkbox"]').first();
      if (data.accessible) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }
  }

  /** Fill in the location information section. */
  async fillLocationInfo(data: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    country?: string;
  }) {
    await this.addressInput.fill(data.address);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    if (data.zipCode) {
      await this.zipCodeInput.fill(data.zipCode);
    }
    if (data.country) {
      await this.countryInput.fill(data.country);
    }
  }

  /** Submit the form. */
  async submit() {
    await this.submitButton.click();
  }

  /** Cancel and go back. */
  async cancel() {
    await this.cancelButton.click();
  }

  /** Assert a field-level validation error is visible. */
  async expectValidationError(errorText: string) {
    await expect(
      this.fieldErrors.filter({ hasText: errorText }),
    ).toBeVisible();
  }

  /** Assert the general error alert is visible. */
  async expectGeneralError(errorText: string) {
    await expect(
      this.generalError.filter({ hasText: errorText }),
    ).toBeVisible();
  }

  /** Assert the submit button shows loading state. */
  async expectSubmitLoading() {
    await expect(
      this.page.locator('.animate-spin'),
    ).toBeVisible();
  }
}
