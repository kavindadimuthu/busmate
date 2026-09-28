import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ACCOUNTS, as, items, request, URLS } from '../lib/api';

/**
 * A community timetable post, loaded through staff tooling and read by a passenger (INC-047, INC-048, ADR-024,
 * ADR-025). The post here is invented; the real one lives outside the repository. What must hold for real data:
 * it is a report dated to the post, times are never authoritative, nothing is guessed, a passenger can search and
 * open every departure, and loading twice changes nothing.
 */
const root = path.resolve(__dirname, '../../..');
const script = path.join(root, 'scripts/timetable-post/import.mjs');
const post = path.join(root, 'tests/flows/fixtures/sample-post.txt');
const LABEL = 'flow test post (13 Oct 2025)';

const node = (...args: string[]) =>
  execFileSync('node', [script, ...args], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, BUSMATE_EMAIL: ACCOUNTS.mot.email, BUSMATE_PASSWORD: ACCOUNTS.mot.password, BUSMATE_API: URLS.api },
  });

/** A future weekday and Sunday, as ISO dates, so the schedules' effective window is not in question. */
function nextDay(dayOfWeek: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + ((dayOfWeek - d.getUTCDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

test.describe.serial('a community timetable post', () => {
  let csv: string;
  const ids: Record<string, string> = {};

  test('is read into a CSV that says what it skipped, and never captures a phone number', async () => {
    csv = path.join(mkdtempSync(path.join(tmpdir(), 'flows-')), 'departures.csv');
    const out = node('parse', '--file', post, '--csv', csv);
    expect(out).toContain('Read 4 departures');
    expect(out).toMatch(/1 other sections?, 1 departure lines/); // the route-69 list is not read, and is counted
    expect(out).toContain('1 booking-contact lines');
    expect(readFileSync(csv, 'utf8')).not.toMatch(/0770000000/);
  });

  test('is loaded as reports dated to the post, with nothing guessed', async () => {
    const out = node('load', '--csv', csv, '--observed-on', '2025-10-13', '--label', LABEL);
    expect(out).toMatch(/Schedules\s+created 4, already there 0, failed 0/);
    expect(out).toMatch(/Workings\s+created 4, already there 0, failed 0/);

    const mot = await as(ACCOUNTS.mot);
    const stops = items((await mot.get('/api/stops/all')).body);
    const embilipitiya = stops.find((s) => s.name === 'Embilipitiya Central Bus Stand');
    expect(embilipitiya.provenance.sourceTier).toBe('SRC_5');
    expect(embilipitiya.provenance.observedAt).toBe('2025-10-13T00:00:00Z');
    expect(embilipitiya.location.latitude ?? null).toBeNull(); // the post gives no positions, so none are recorded
    ids.from = embilipitiya.id;
    ids.to = stops.find((s) => s.name === 'Colombo Pettah (bus stand)').id;

    const route = items((await mot.get('/api/routes/all')).body).find((r) => r.name === 'Embilipitiya - Colombo via old road (03)');
    expect(route.stopListCompleteness).toBe('PARTIAL'); // the endpoints are known and more stops exist
    expect(route.trust.label).toBe('REPORTED');
    ids.route = route.id;

    const schedules = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body);
    expect(schedules.map((s) => s.name).sort()).toEqual(['05:00 Sample Express', '06:00 Sample Lines', '07:15 Sample Board']);
    for (const s of schedules) {
      expect(s.timingCompleteness).toBe('ORIGIN_ONLY');
      expect(s.provenance.sourceTier).toBe('SRC_5');
      expect(s.provenance.attributionLabel).toBe(LABEL);
    }
    // a calendar only where the post states days: "except Sunday" gets one, the rest get none
    const byName = Object.fromEntries(schedules.map((s) => [s.name, s]));
    const full = async (n: string) => (await mot.get(`/api/schedules/${byName[n].id}`)).body;
    expect((await full('05:00 Sample Express')).scheduleCalendars ?? []).toHaveLength(0);
    const [days] = (await full('06:00 Sample Lines')).scheduleCalendars;
    expect([days.saturday, days.sunday]).toEqual([true, false]);
    // community times are never authoritative, so they can never become trips
    const stopTime = (await full('05:00 Sample Express')).scheduleStops[0];
    expect(stopTime.departureTime ?? null).toBeNull();
    expect(stopTime.departureTimeUnverified).toBe('05:00:00');
    ids.express = byName['05:00 Sample Express'].id;
    ids.lines = byName['06:00 Sample Lines'].id;
    const generate = await mot.post(`/api/trips/generate?scheduleId=${ids.express}&fromDate=2026-10-01&toDate=2026-10-02`);
    expect(generate.status).toBe(400);
  });

  test('a passenger finds each departure, sees who usually runs it as a report, and can open it', async ({ page }) => {
    const monday = nextDay(1);
    await page.goto(`${URLS.web}/findmybus?fromStopId=${ids.from}&toStopId=${ids.to}&fromName=Embilipitiya&toName=Colombo&date=${monday}`);
    await expect(page.getByText('3 buses found')).toBeVisible();
    await expect(page.getByText(/Usually\s+Sample Express\s*·\s*AA-1111/)).toBeVisible();
    await expect(page.getByText(/Usually\s+Sample Board\s*·\s*CC-3333 or CC-4444/)).toBeVisible(); // a rotation says "or"
    await expect(page.getByText('Reported').first()).toBeVisible();
    await expect(page.getByText('Observed')).toHaveCount(0); // it is a stranger's post, not BusMate's own observation

    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.getByText(/Usually/).first()).toBeVisible();
    await expect(page.getByText(/not stated in the post/)).toBeVisible(); // the note that says what was not known reaches the passenger
    await expect(page.getByText('Invalid stop sequence')).toHaveCount(0);
  });

  test('"except Sunday" is honoured and nothing else is assumed away', async () => {
    const search = async (date: string) =>
      (await request('GET', `/api/passenger/find-my-bus?fromStopId=${ids.from}&toStopId=${ids.to}&date=${date}`)).body;
    expect((await search(nextDay(1))).totalResults).toBe(3);
    expect((await search(nextDay(0))).totalResults).toBe(2); // the "except Sunday" line drops out; the two with no days stated stay
  });

  test('the details page says No on the day a calendar excludes, not the "Yes" a passenger would be told before INC-055', async ({ page }) => {
    const detailUrl = (scheduleId: string, date: string) =>
      `${URLS.web}/findmybus/detail?scheduleId=${scheduleId}&fromStopId=${ids.from}&toStopId=${ids.to}&date=${date}`;

    // "06:00 Sample Lines" excludes Sunday: wrong before INC-055, since `isActiveOnDate` was never actually computed.
    await page.goto(detailUrl(ids.lines, nextDay(0)));
    await expect(page.getByText('Operating on')).toBeVisible();
    await expect(page.getByText('No', { exact: true })).toBeVisible();
    await page.goto(detailUrl(ids.lines, nextDay(1)));
    await expect(page.getByText('Yes', { exact: true })).toBeVisible();
    await expect(page.getByText('Except Sunday')).toBeVisible(); // the summary, now actually populated

    // "05:00 Sample Express" has no calendar at all: neither day claims to know, on any day of the week.
    await page.goto(detailUrl(ids.express, nextDay(0)));
    await expect(page.getByText('Days not stated')).toBeVisible();
    await page.goto(detailUrl(ids.express, nextDay(1)));
    await expect(page.getByText('Days not stated')).toBeVisible();
  });

  test('the route page admits it lists only some stops', async ({ page }) => {
    await page.goto(`${URLS.web}/routes/${ids.route}`);
    await expect(page.getByText("only some of this route's stops")).toBeVisible();
  });

  test('loading the same post again changes nothing', async () => {
    const out = node('load', '--csv', csv, '--observed-on', '2025-10-13', '--label', LABEL);
    expect(out).toMatch(/Stops\s+created 0, already there 3/);
    expect(out).toMatch(/Schedules\s+created 0, already there 4, failed 0/);
    expect(out).toMatch(/Workings\s+created 0, already there 4, failed 0/);
  });
});
