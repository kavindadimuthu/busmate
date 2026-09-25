import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { passengerWeb } from '../lib/ui';

/**
 * INC-052: a contributor proposes who usually works a departure; the steward for its corridor reviews it beside
 * stop proposals; approval shows it to passengers as "usually", observed. Uses the seeded Colombo–Kandy morning
 * express, whose corridor the seeded steward reviews.
 */
test.describe.serial('contributors propose who works a departure', () => {
  const OPERATOR = 'Flow Test Express';
  let scheduleId: string;
  let detailUrl: string;

  test('a contributor proposes from the departure’s page, and nothing changes for passengers yet', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const groups = items((await mot.get('/api/routes/groups/all')).body);
    const kandy = groups.find((g) => g.name === 'Colombo - Kandy');
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.routeGroupId === kandy.id && r.name === 'Colombo Fort to Kandy');
    const schedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body).find((s) => s.name === 'Colombo-Kandy Morning Express');
    scheduleId = schedule.id;
    const stops = schedule.scheduleStops;
    detailUrl = `${URLS.web}/findmybus/detail?scheduleId=${scheduleId}&fromStopId=${stops[0].stopId}&toStopId=${stops[stops.length - 1].stopId}`;

    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(detailUrl);
    await page.getByTestId('propose-working-link').click();
    await page.locator('#working-operator').fill(OPERATOR);
    await page.locator('#working-plates').fill('ZX-1001, ZX-1002');
    await page.getByRole('combobox', { name: 'How do you know' }).click();
    await page.getByRole('option', { name: /I rode this bus/ }).click();
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.getByText(OPERATOR)).toBeVisible(); // it lands on "my contributions"
    await expect(page.getByText('Who usually runs a departure')).toBeVisible();
    await context.close();

    expect((await mot.get(`/api/schedules/${scheduleId}/workings`)).body).toHaveLength(0);
  });

  test('someone who is not a contributor is refused by the server', async () => {
    const res = await (await as(ACCOUNTS.ishara)).post('/api/community/working-proposals', {
      scheduleId, operatorNameObserved: 'Nope', observedOn: '2026-09-01', observationMethod: 'OTHER',
    });
    expect(res.status).toBe(403);
  });

  test('the steward sees it in the queue, beside the departure, without who proposed it', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.tharindu);
    await page.goto(`${URLS.web}/contribute/review`);
    await page.getByText(OPERATOR).click();
    await expect(page.getByTestId('working-proposal')).toContainText('Colombo-Kandy Morning Express');
    await expect(page.getByTestId('working-proposal')).toContainText('ZX-1001 or ZX-1002');
    await expect(page.getByTestId('working-proposal')).toContainText('Nobody yet');
    expect(await page.locator('body').innerText()).not.toContain(ACCOUNTS.amara.name);
    await context.close();
  });

  test('approval records it as observed, and passengers see it as "usually"', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.tharindu);
    await page.goto(`${URLS.web}/contribute/review`);
    await page.getByText(OPERATOR).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Proposal approved')).toBeVisible();
    await context.close();

    const stored = (await (await as(ACCOUNTS.mot)).get(`/api/schedules/${scheduleId}/workings`)).body;
    expect(stored).toHaveLength(1);
    expect(stored[0].trust.label).toBe('OBSERVED');
    expect(stored[0].vehicles.map((v: any) => v.plateObserved)).toEqual(['ZX-1001', 'ZX-1002']);

    const passenger = await browser.newPage();
    await passenger.goto(detailUrl);
    await expect(passenger.getByText(/Usually\s+Flow Test Express\s*·\s*ZX-1001 or ZX-1002/)).toBeVisible();
    await expect(passenger.getByTestId('propose-working-link')).toHaveText('Seen it run differently? Tell us');
    await passenger.close();
  });

  test('the contributor sees it approved', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(`${URLS.web}/contribute/mine`);
    const row = page.getByRole('link', { name: new RegExp(OPERATOR) });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Approved');
    await context.close();
  });
});
