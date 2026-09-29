import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { portal } from '../lib/ui';

/**
 * INC-050: staff record who usually works a departure from the schedule page, and it is stored as a report
 * they can end. Runs on the seeded dev data; uses the first seeded route's first schedule.
 */
test.describe.serial('usual workings in the portal', () => {
  let scheduleId: string;

  test('staff record a working from the schedule page', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const route = items((await mot.get('/api/routes/all')).body)[0];
    scheduleId = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body)[0].id;

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/schedules/${scheduleId}`);
    await staff.page.getByRole('button', { name: /Usual Workings/ }).click();
    await staff.page.getByRole('button', { name: 'Record a working' }).click();
    await staff.page.getByLabel('Operator as seen').fill('Flow Test Travels');
    await staff.page.getByLabel('Plates').fill('ZZ-9001, ZZ-9002');
    await staff.page.getByRole('button', { name: 'Save' }).click();

    const row = staff.page.getByTestId('working-row').filter({ hasText: 'Flow Test Travels' });
    await expect(row).toBeVisible();
    await expect(row).toContainText('ZZ-9001 · ZZ-9002');
    await expect(row).toContainText('not a registered operator');
    await staff.context.close();

    const stored = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body;
    expect(stored.find((w: any) => w.operatorNameObserved === 'Flow Test Travels').vehicles).toHaveLength(2);
  });

  test('a working can be ended, and stays on record', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/schedules/${scheduleId}`);
    await staff.page.getByRole('button', { name: /Usual Workings/ }).click();
    const row = staff.page.getByTestId('working-row').filter({ hasText: 'Flow Test Travels' });
    await row.getByTitle('End today').click();
    await expect(row).toContainText(/to \d{4}-\d{2}-\d{2}/);
    await staff.context.close();
  });

  test('an empty request is refused before it reaches the server', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/schedules/${scheduleId}`);
    await staff.page.getByRole('button', { name: /Usual Workings/ }).click();
    await staff.page.getByRole('button', { name: 'Record a working' }).click();
    await staff.page.getByRole('button', { name: 'Save' }).click();
    await expect(staff.page.getByText('Give an operator, a plate or a service class')).toBeVisible();
    await staff.context.close();
  });
});
