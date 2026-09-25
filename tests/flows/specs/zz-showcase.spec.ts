import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { passengerWeb, portal } from '../lib/ui';

/**
 * The showcase seed (scripts/seed-community-showcase.mjs) leaves every community state on screen for a person to
 * look at. This runs it against the flows stack and checks the screens really show those states, plus the things a
 * click-through found that no API test could: an imported route with no group must be reachable, an unknown
 * distance must not read as 0 km, and a schedule with no stated days must not read "Operating: Yes".
 * Runs last: it reads what earlier specs left and changes little.
 */
test.describe.serial('the showcase data, on screen', () => {
  test.beforeAll(() => {
    execFileSync('node', ['scripts/seed-community-showcase.mjs', '--api', URLS.api], { stdio: 'inherit', timeout: 240_000 });
  });

  test('the steward’s queue has something in every tab', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.tharindu);
    await page.goto(`${URLS.web}/contribute/review`);
    await expect(page.getByText('Showcase Pending Stop')).toBeVisible();
    await expect(page.getByText('Showcase Pending Travels')).toBeVisible();
    await expect(page.getByText('Who usually runs a departure').first()).toBeVisible();
    await page.getByRole('button', { name: /^Approved/ }).click();
    await expect(page.getByText('Showcase Approved Express')).toBeVisible();
    await page.getByRole('button', { name: /^Rejected/ }).click();
    await expect(page.getByText('Showcase Rejected Stop')).toBeVisible();
    await expect(page.getByText('Showcase Duplicate Travels')).toBeVisible();
    await context.close();
  });

  test('the contributor sees every state, and the reviewer’s reason on a rejection', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(`${URLS.web}/contribute/mine`);
    for (const badge of ['Under review', 'Withdrawn', 'Not approved', 'Reverted', 'Approved']) {
      await expect(page.getByText(badge, { exact: true }).last()).toBeVisible();
    }
    await page.getByText('Showcase Rejected Stop').click();
    await expect(page.getByText("Can't verify this: Showcase: could not find it on the road.")).toBeVisible();
    await page.goto(`${URLS.web}/contribute/mine`);
    await page.getByText('Showcase Pending Travels').click();
    await expect(page.getByTestId('working-proposal')).toContainText('SC-1001 or SC-1002');
    await expect(page.getByText('Rode this bus')).toBeVisible(); // not "past this stop"
    await context.close();
  });

  test('staff review a working proposal beside what is already recorded, and can revert an approved stop correction', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community/review`);
    await expect(staff.page.getByText('Review Proposals')).toBeVisible();
    await staff.page.getByText('Showcase Pending Travels').click();
    await expect(staff.page.getByTestId('working-proposal')).toContainText('Already recorded on this departure');
    await expect(staff.page.getByText('Rode this bus')).toBeVisible();
    await expect(staff.page.getByRole('button', { name: /revert/i })).toHaveCount(0); // a working is removed, not reverted

    await staff.page.goto(`${URLS.portal}/mot/community/review`);
    await staff.page.getByText('Approved', { exact: true }).first().click();
    await staff.page.getByText(/Kadawatha/).first().click();
    await staff.page.getByRole('button', { name: /revert/i }).click();
    await staff.context.close();

    // The database, not a toast, is the evidence: that correction is now reverted.
    const mine = items((await (await as(ACCOUNTS.amara)).get('/api/community/changesets/mine?size=100')).body);
    const undone = mine.find((c: any) => c.proposedValues?.description === 'Showcase: an approved correction');
    expect(undone.status).toBe('REVERTED');
  });

  test('an imported route with no group can be opened, and a stop added to it without breaking its times', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Embilipitiya - Colombo via old road (03)');
    expect(route.routeGroupId ?? null).toBeNull();
    const before = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body)[0];
    const timeBefore = before.scheduleStops[0].departureTimeUnverified;

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/routes`);
    await staff.page.locator('tr', { hasText: 'Embilipitiya - Colombo via old road (03)' }).first().getByTitle('View route').click();
    await staff.page.waitForURL(/\/mot\/routes\/single\//);
    await staff.page.getByRole('button', { name: /^Stops/ }).click();
    await staff.page.getByRole('button', { name: 'Add a stop' }).click();
    await staff.page.getByLabel('Stop to add').selectOption({ index: 1 });
    await staff.page.getByLabel('Comes after').selectOption({ index: 1 });
    await staff.page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(staff.page.getByText('Stop added')).toBeVisible();
    await expect(staff.page.getByText('distance not known')).toBeVisible(); // never "0.0 km from start"
    await staff.context.close();

    const after = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body)[0];
    expect(after.scheduleStops[0].departureTimeUnverified).toBe(timeBefore);
  });

  test('a departure whose days were never stated says so instead of “Operating: Yes”', async ({ page }) => {
    const mot = await as(ACCOUNTS.mot);
    const stops = items((await mot.get('/api/stops/all')).body);
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Embilipitiya - Colombo via old road (03)');
    const schedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body).find((s) => s.name === '05:00 Sample Express');
    const from = stops.find((s) => /Embilipitiya/.test(s.name));
    const to = stops.find((s) => /Pettah/.test(s.name));
    await page.goto(`${URLS.web}/findmybus/detail?scheduleId=${schedule.id}&fromStopId=${from.id}&toStopId=${to.id}`);
    await expect(page.getByText('Days not stated')).toBeVisible();
    await expect(page.getByText('Operating on')).toBeVisible();
    await expect(page.getByText('Yes', { exact: true })).toHaveCount(0);
  });
});
