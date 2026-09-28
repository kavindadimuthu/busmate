import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { portal } from '../lib/ui';

/**
 * INC-057: staff link a name or plate someone only saw to the real registry it is. Linking never overwrites
 * what was seen — it only adds the connection — and the server refuses a bus registered to someone else.
 */
test.describe.serial('linking a working to the registry', () => {
  const OPERATOR_NAME = 'Lanka Suwaseriya Travels (Pvt) Ltd';
  const PLATE = 'WP CAA-4521';
  let scheduleId: string;

  test('staff link an observed operator and plate to the real registry records', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Colombo Fort to Negombo');
    const schedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body)[0];
    scheduleId = schedule.id;
    const created = await mot.post(`/api/schedules/${scheduleId}/workings`, {
      operatorNameObserved: OPERATOR_NAME, vehicles: [{ plateObserved: PLATE }],
    });
    expect(created.status).toBe(201);

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/schedules/${scheduleId}`);
    await staff.page.getByRole('button', { name: /Usual Workings/ }).click();
    const row = staff.page.getByTestId('working-row').filter({ hasText: OPERATOR_NAME });
    await expect(row).toContainText('not a registered operator');

    await row.getByRole('button', { name: 'Link' }).first().click();
    await row.getByLabel(`Operator for ${OPERATOR_NAME}`).selectOption({ label: OPERATOR_NAME });
    await row.getByRole('button', { name: 'Save' }).click();
    await expect(staff.page.getByText('Linked').first()).toBeVisible();
    await expect(row).not.toContainText('not a registered operator');

    await row.getByRole('button', { name: 'Link' }).click(); // now only the plate's Link button remains
    await row.getByLabel(`Bus for ${PLATE}`).selectOption({ label: `${PLATE} — ${OPERATOR_NAME}` });
    await row.getByRole('button', { name: 'Save' }).click();
    await expect(staff.page.getByText('Linked').first()).toBeVisible();
    await staff.context.close();

    const stored = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body;
    const working = stored.find((w: any) => w.operatorNameObserved === OPERATOR_NAME);
    expect(working.operatorResolved).toBe(true);
    expect(working.operatorName).toBe(OPERATOR_NAME);
    expect(working.vehicles[0].resolved).toBe(true);
    expect(working.vehicles[0].plateObserved).toBe(PLATE); // what was seen is kept, not overwritten
  });

  test('a bus registered to a different operator is refused by the server', async () => {
    const mot = await as(ACCOUNTS.mot);
    // A second schedule, so this working's operator doesn't overlap the one linked in the previous test.
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Negombo to Colombo Fort');
    const otherSchedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body)[0];
    // Linked to Lanka Suwaseriya (10501), with a plate that belongs to Southern Comfort (10502) instead.
    const created = await mot.post(`/api/schedules/${otherSchedule.id}/workings`, {
      operatorId: '00000000-0000-0000-0000-000000010501',
      vehicles: [{ plateObserved: 'Mismatch test' }],
    });
    expect(created.status).toBe(201);
    const vehicleId = created.body.vehicles[0].id;
    const res = await mot.put(`/api/schedule-working-vehicles/${vehicleId}/bus`, {
      busId: '00000000-0000-0000-0000-000000010303', // Southern Comfort's own bus
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('different operator');
  });
});
