import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { portal } from '../lib/ui';

/**
 * INC-051: a route known by its ends learns a stop in the middle, from the route page, and can lose it again.
 * Builds its own route group so it depends on no other spec's data.
 */
test.describe.serial('placing a stop into a route', () => {
  let groupId: string;
  let routeId: string;
  let middle: { id: string; name: string };

  test('staff add a stop after the origin, and the list keeps its order', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const stops = items((await mot.get('/api/stops/all')).body);
    const [a, b, c] = stops.slice(0, 3);
    middle = c;
    groupId = (await mot.post('/api/routes/groups', { name: `Flow stops ${Date.now()}` })).body.id;
    routeId = (await mot.post('/api/routes', {
      name: `Flow route ${Date.now()}`, routeGroupId: groupId, startStopId: a.id, endStopId: b.id, direction: 'OUTBOUND', distanceKm: 100,
    })).body.id;

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/routes/${groupId}`);
    await staff.page.getByRole('button', { name: /^Stops/ }).click();
    await staff.page.getByRole('button', { name: 'Add a stop' }).click();
    await staff.page.getByLabel('Stop to add').selectOption({ label: middle.name });
    await staff.page.getByLabel('Comes after').selectOption({ label: a.name });
    await staff.page.getByLabel('Distance from the start').fill('42.5');
    await staff.page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(staff.page.getByText('Stop added')).toBeVisible();
    await staff.context.close();

    const route = (await mot.get(`/api/routes/${routeId}`)).body;
    expect(route.routeStops.map((rs: any) => rs.stopId)).toEqual([a.id, middle.id, b.id]);
    expect(route.routeStops.map((rs: any) => rs.stopOrder)).toEqual([1, 2, 3]);
    expect(route.routeStops[1].distanceFromStartKmUnverified).toBe(42.5);
    expect(route.routeStops[1].distanceFromStartKm ?? null).toBeNull();
  });

  test('the route’s ends cannot be removed, but a placed stop can', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const before = (await mot.get(`/api/routes/${routeId}`)).body.routeStops;
    expect((await mot.delete(`/api/routes/${routeId}/stops/${before[0].id}`)).status).toBe(409);

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/routes/${groupId}`);
    await staff.page.getByRole('button', { name: /^Stops/ }).click();
    staff.page.once('dialog', (d) => d.accept());
    await staff.page.locator('h4', { hasText: middle.name }).hover();
    await staff.page.getByTitle('Remove stop from route').click();
    await expect(staff.page.locator('h4', { hasText: middle.name })).toHaveCount(0);
    await staff.context.close();

    const after = (await mot.get(`/api/routes/${routeId}`)).body.routeStops;
    expect(after.map((rs: any) => rs.stopOrder)).toEqual([1, 2]);
  });
});
