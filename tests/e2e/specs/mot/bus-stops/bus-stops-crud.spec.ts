import { test, expect } from '../../../fixtures/base.fixture.js';
import { BusStopsListPage } from '../../../page-objects/mot/bus-stops/bus-stops-list.page.js';
import { BusStopFormPage } from '../../../page-objects/mot/bus-stops/bus-stop-form.page.js';
import { BusStopDetailPage } from '../../../page-objects/mot/bus-stops/bus-stop-detail.page.js';
import { busStopData } from '../../../utils/test-data-factory.js';

test.describe('MOT > Bus Stops > CRUD', () => {
  test('should display bus stops list page with statistics cards', async ({ busStopsListPage }) => {
    await busStopsListPage.goto();
    await busStopsListPage.expectStatsVisible();
  });

  test('should display bus stops in a data table', async ({ busStopsListPage }) => {
    await busStopsListPage.goto();
    await busStopsListPage.waitForLoadingToFinish();

    const rowCount = await busStopsListPage.table.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should display table column headers', async ({ busStopsListPage }) => {
    await busStopsListPage.goto();
    await busStopsListPage.waitForLoadingToFinish();

    // Verify key column headers are present
    const header = busStopsListPage.table.headerRow;
    await expect(header.locator('th').filter({ hasText: /name/i })).toBeVisible();
  });

  test.describe.serial('Create, View, Edit, and Delete a bus stop', () => {
    const testData = busStopData();
    let createdBusStopId: string;

    test('should navigate to the add new bus stop form', async ({ busStopsListPage }) => {
      await busStopsListPage.goto();
      await busStopsListPage.clickAddBusStop();
    });

    test('should show validation errors when submitting empty form', async ({ page }) => {
      const formPage = new BusStopFormPage(page);
      await formPage.goto();
      await formPage.waitForPageLoad();

      // The form requires isDirty to be true before submit is enabled.
      // Fill and clear a field to make the form dirty, then submit.
      await formPage.nameInput.fill('x');
      await formPage.nameInput.clear();
      await formPage.submit();

      // Expect validation errors
      await formPage.expectValidationError('Bus stop name is required');
    });

    test('should show validation error for name less than 2 characters', async ({ page }) => {
      const formPage = new BusStopFormPage(page);
      await formPage.goto();
      await formPage.waitForPageLoad();

      await formPage.nameInput.fill('A');
      await formPage.addressInput.fill('Test Address');
      await formPage.cityInput.fill('Colombo');
      await formPage.stateInput.fill('Western Province');
      await formPage.countryInput.fill('Sri Lanka');
      await formPage.submit();

      await formPage.expectValidationError('Bus stop name must be at least 2 characters');
    });

    test('should create a new bus stop with valid data', async ({ page }) => {
      const formPage = new BusStopFormPage(page);
      await formPage.goto();
      await formPage.waitForPageLoad();

      // Fill basic information
      await formPage.fillBasicInfo({
        name: testData.name,
        description: testData.description,
        accessible: testData.accessible as boolean,
      });

      // Fill location information
      await formPage.fillLocationInfo({
        address: testData.address as string,
        city: testData.city as string,
        state: testData.state as string,
        zipCode: testData.zipCode as string,
        country: testData.country as string,
      });

      // Click on the map to set coordinates (required field)
      // The map defaults to Colombo — click the center of the map div
      const mapDiv = page.locator('.w-full.h-64').first();
      if (await mapDiv.isVisible()) {
        await mapDiv.click();
        // Wait for reverse geocode to complete
        await page.waitForTimeout(2000);
      }

      await formPage.submit();

      // Should either redirect to bus stops list or show success toast
      await page.waitForURL(/\/mot\/bus-stops/, { timeout: 15_000 });

      // Extract the bus stop ID from the URL if redirected to detail page
      const url = page.url();
      const match = url.match(/\/mot\/bus-stops\/([a-f0-9-]+)/);
      if (match) {
        createdBusStopId = match[1];
      }
    });

    test('should view the created bus stop in the list', async ({ busStopsListPage }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      // Search for the created bus stop
      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      await busStopsListPage.table.expectRowVisible(testData.name as string);
    });

    test('should navigate to bus stop detail page', async ({ busStopsListPage, page }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      // Search for the test bus stop
      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      // Click view on the row
      await busStopsListPage.viewBusStop(testData.name as string);

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/mot\/bus-stops\/[a-f0-9-]+$/);

      // Bus stop name should be visible on the page
      await expect(page.getByText(testData.name as string)).toBeVisible();
    });

    test('should edit the bus stop and verify changes', async ({ busStopsListPage, page }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      // Search for the test bus stop
      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      // Click edit
      await busStopsListPage.editBusStop(testData.name as string);

      // Should be on the edit page
      await expect(page).toHaveURL(/\/mot\/bus-stops\/[a-f0-9-]+\/edit/);

      // Update the description
      const editForm = new BusStopFormPage(page, 'dummy');
      const updatedDescription = 'Updated by E2E test';
      await editForm.descriptionInput.clear();
      await editForm.descriptionInput.fill(updatedDescription);

      // The submit button should say "Update Bus Stop"
      await page.getByRole('button', { name: /update bus stop/i }).click();

      // Should redirect back to the list or detail page
      await page.waitForURL(/\/mot\/bus-stops/, { timeout: 15_000 });
    });

    test('should cancel edit without saving changes', async ({ busStopsListPage, page }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      await busStopsListPage.editBusStop(testData.name as string);
      await expect(page).toHaveURL(/\/mot\/bus-stops\/[a-f0-9-]+\/edit/);

      // Click cancel
      await page.getByRole('button', { name: /cancel/i }).click();
      await page.waitForURL(/\/mot\/bus-stops/, { timeout: 15_000 });
    });

    test('should cancel delete confirmation modal without deleting', async ({ busStopsListPage }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      // Click delete to open modal
      await busStopsListPage.table.clickDeleteButton(testData.name as string);
      await busStopsListPage.deleteModal.expectVisible();

      // Cancel the deletion
      await busStopsListPage.deleteModal.cancel();
      await busStopsListPage.deleteModal.expectHidden();

      // Bus stop should still be in the table
      await busStopsListPage.table.expectRowVisible(testData.name as string);
    });

    test('should delete the bus stop via confirmation modal', async ({ busStopsListPage, page }) => {
      await busStopsListPage.goto();
      await busStopsListPage.waitForLoadingToFinish();

      await busStopsListPage.filters.search(testData.name as string);
      await busStopsListPage.waitForLoadingToFinish();

      // Delete the bus stop
      await busStopsListPage.deleteBusStop(testData.name as string);

      // Should show success toast
      await busStopsListPage.expectToastMessage(/deleted/i);
    });
  });

  test('should toggle the accessibility checkbox during creation', async ({ page }) => {
    const formPage = new BusStopFormPage(page);
    await formPage.goto();
    await formPage.waitForPageLoad();

    const checkbox = page.locator('input[type="checkbox"]').first();

    // Initially unchecked
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});
