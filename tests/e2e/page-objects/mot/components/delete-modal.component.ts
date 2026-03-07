import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component object for the DeleteConfirmationModal.
 * Matches: apps/frontend/management-portal/src/components/mot/confirmation-modals.tsx
 *
 * The modal overlay uses `fixed inset-0` positioning with a white card inside.
 */
export class DeleteModalComponent {
  readonly page: Page;
  readonly modal: Locator;
  readonly title: Locator;
  readonly itemName: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // The modal is a fixed overlay that contains "permanently delete" text
    this.modal = page.locator('.fixed.inset-0').filter({ hasText: /delete/i });
    this.title = this.modal.locator('h3');
    this.itemName = this.modal.locator('.font-medium');
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
    this.confirmButton = this.modal.getByRole('button', { name: /delete permanently/i });
    this.loadingSpinner = this.modal.locator('.animate-spin');
  }

  /** Assert the delete modal is visible. */
  async expectVisible() {
    await expect(this.modal).toBeVisible();
  }

  /** Assert the item name shown in the modal. */
  async expectItemName(name: string) {
    await expect(this.itemName).toContainText(name);
  }

  /** Confirm deletion. */
  async confirm() {
    await this.confirmButton.click();
  }

  /** Cancel deletion. */
  async cancel() {
    await this.cancelButton.click();
  }

  /** Assert the modal has disappeared. */
  async expectHidden() {
    await expect(this.modal).toBeHidden();
  }
}
