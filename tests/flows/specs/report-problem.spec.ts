import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { passengerWeb, portal } from '../lib/ui';

/**
 * INC-056: a passenger reports something wrong on a departure without needing to be a contributor; staff see
 * it in a queue and resolve it once the real record has been checked. Uses the seeded Colombo–Kandy morning
 * express — a report is independent of anything else that spec files do to that schedule.
 */
test.describe.serial('reporting a problem', () => {
  let scheduleId: string;
  let detailUrl: string;

  test('signed out, the link sends you to sign in instead of opening the form', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Colombo Fort to Kandy');
    const schedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body).find((s) => s.name === 'Colombo-Kandy Morning Express');
    scheduleId = schedule.id;
    const stops = schedule.scheduleStops;
    detailUrl = `${URLS.web}/findmybus/detail?scheduleId=${scheduleId}&fromStopId=${stops[0].stopId}&toStopId=${stops[stops.length - 1].stopId}`;

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(detailUrl);
    await page.getByRole('button', { name: 'Report a problem with this departure' }).click();
    await page.waitForURL(/\/login/);
    await ctx.close();
  });

  test('signed in, a passenger reports it without being a contributor', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.ishara); // an ordinary passenger, never applied
    await page.goto(detailUrl);
    await page.getByRole('button', { name: 'Report a problem with this departure' }).click();
    await page.getByRole('combobox', { name: "What's wrong" }).click();
    await page.getByRole('option', { name: "The bus didn't come" }).click();
    await page.getByLabel('Anything else? (optional)').fill('Waited 20 minutes, nothing showed up.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('a staff member will take a look')).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();
    await context.close();
  });

  test('reporting the same thing again is refused; the server enforces it, not just the screen', async () => {
    const ishara = await as(ACCOUNTS.ishara);
    const res = await ishara.post('/api/community/reports', {
      entityType: 'SCHEDULE', targetId: scheduleId, reason: 'WRONG_TIME',
    });
    expect(res.status).toBe(409);
  });

  test('staff see it in the open queue, and resolving moves it to resolved', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community/reports`);
    const row = staff.page.getByTestId('report-row').filter({ hasText: "The bus didn't come" });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Waited 20 minutes');
    expect(await staff.page.locator('body').innerText()).not.toContain(ACCOUNTS.ishara.name); // no reporter identity in the queue

    await row.getByRole('button', { name: 'Resolve' }).click();
    await expect(staff.page.getByText('Marked resolved')).toBeVisible();

    await staff.page.getByRole('button', { name: /^Resolved/ }).click();
    await expect(staff.page.getByTestId('report-row').filter({ hasText: "The bus didn't come" })).toBeVisible();
    await staff.context.close();
  });
});
