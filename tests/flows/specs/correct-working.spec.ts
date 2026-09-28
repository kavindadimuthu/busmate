import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { passengerWeb, portal } from '../lib/ui';

/**
 * INC-058, ADR-027: a contributor corrects a working already on record, or says it has stopped; staff can do
 * the same directly. Uses the seeded Colombo–Kandy afternoon express, and its own operator so it never
 * collides with other specs' workings on the same schedule.
 */
test.describe.serial('correcting or ending a working', () => {
  const ORIGINAL = 'Correction Test Travels';
  const CORRECTED = 'Corrected Test Travels';
  let scheduleId: string;
  let workingId: string;
  let detailUrl: string;

  test('a contributor proposes a correction from the departure’s page', async ({ browser }) => {
    const mot = await as(ACCOUNTS.mot);
    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Kandy to Colombo Fort');
    const schedule = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body).find((s) => s.name === 'Kandy-Colombo Afternoon Express');
    scheduleId = schedule.id;
    const created = await mot.post(`/api/schedules/${scheduleId}/workings`, {
      operatorNameObserved: ORIGINAL, vehicles: [{ plateObserved: 'CX-1000' }], effectiveStartDate: '2025-01-01',
    });
    expect(created.status).toBe(201);
    workingId = created.body.id;
    const stops = schedule.scheduleStops;
    detailUrl = `${URLS.web}/findmybus/detail?scheduleId=${scheduleId}&fromStopId=${stops[0].stopId}&toStopId=${stops[stops.length - 1].stopId}`;

    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(detailUrl);
    await page.getByTestId('correct-working-link').filter({ hasText: ORIGINAL }).click();
    await page.getByLabel('Operator, as written on the bus now').fill(CORRECTED);
    await page.getByRole('combobox', { name: 'How do you know' }).click();
    await page.getByRole('option', { name: /I rode this bus/ }).click();
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.getByText(CORRECTED)).toBeVisible(); // lands on "my contributions"
    await context.close();

    // Nothing changed on the real record until it is approved.
    const stillOriginal = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body;
    expect(stillOriginal.find((w: any) => w.id === workingId).operatorNameObserved).toBe(ORIGINAL);
  });

  test('the reviewer sees what would actually change, and approves it', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community/review`);
    await staff.page.getByText(CORRECTED).click();
    await expect(staff.page.getByTestId('working-proposal')).toContainText(ORIGINAL);
    await expect(staff.page.getByTestId('working-proposal')).toContainText(CORRECTED);
    await expect(staff.page.getByTestId('working-proposal')).toContainText('CX-1000'); // untouched, so shown plainly
    await staff.page.getByRole('button', { name: 'Approve' }).click();
    await expect(staff.page.getByText('Proposal approved')).toBeVisible();
    await staff.context.close();

    const mot = await as(ACCOUNTS.mot);
    const workings = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body;
    const working = workings.find((w: any) => w.id === workingId);
    expect(working.operatorNameObserved).toBe(CORRECTED);
    expect(working.vehicles[0].plateObserved).toBe('CX-1000');
    expect(working.trust.label).toBe('OBSERVED');
  });

  test('staff correct a working directly, from the schedule page', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/schedules/${scheduleId}`);
    await staff.page.getByRole('button', { name: /Usual Workings/ }).click();
    const row = staff.page.getByTestId('working-row').filter({ hasText: CORRECTED });
    await row.getByTitle('Edit').click();
    // The row's own text (the operator name) now lives inside an input's value, not as text content, so a
    // fresh scope keyed off it would match nothing; the edit form is unique on the page while open.
    const form = staff.page.getByTestId('working-edit-form');
    await form.getByLabel('Edit plates').fill('CX-2000');
    await form.getByRole('button', { name: 'Save' }).click();
    await expect(staff.page.getByText('Corrected', { exact: true })).toBeVisible();
    const updatedRow = staff.page.getByTestId('working-row').filter({ hasText: CORRECTED });
    await expect(updatedRow).toContainText('CX-2000');
    await staff.context.close();

    const mot = await as(ACCOUNTS.mot);
    const working = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body.find((w: any) => w.id === workingId);
    expect(working.vehicles[0].plateObserved).toBe('CX-2000');
  });

  test('a contributor proposes that it has stopped, and once approved passengers no longer see it', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(detailUrl);
    await page.getByTestId('correct-working-link').filter({ hasText: CORRECTED }).click();
    await page.getByRole('checkbox', { name: 'It has stopped running like this' }).check();
    await page.getByLabel('Last day it ran').fill('2026-01-01'); // well in the past, so it reads as ended now
    await page.getByRole('combobox', { name: 'How do you know' }).click();
    await page.getByRole('option', { name: /I rode this bus/ }).click();
    await page.getByRole('button', { name: 'Send for review' }).click();
    await expect(page.getByText('Under review').first()).toBeVisible();
    await context.close();

    const mot = await as(ACCOUNTS.mot);
    const pending = items((await mot.get('/api/community/changesets?status=PENDING&entityType=SCHEDULE_WORKING')).body);
    const ending = pending.find((c: any) => c.changeset.targetId === workingId);
    await mot.post(`/api/community/changesets/${ending.changeset.id}/approve`);

    const working = (await mot.get(`/api/schedules/${scheduleId}/workings`)).body.find((w: any) => w.id === workingId);
    expect(working.effectiveEndDate).toBe('2026-01-01');

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx2.newPage();
    await p.goto(detailUrl);
    await expect(p.getByText(CORRECTED)).toHaveCount(0);
    await ctx2.close();
  });
});
