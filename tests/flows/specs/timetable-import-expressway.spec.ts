import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ACCOUNTS, as, items, URLS } from '../lib/api';

/**
 * The Southern Expressway section of a community timetable post (INC-059): a departure from Embilipitiya
 * names its own destination on its own line — the section carries no one fixed route — and the return legs
 * give an operator with no plate far more often than the road/old-road sections do. The post here is
 * invented; the real one lives outside the repository.
 */
const root = path.resolve(__dirname, '../../..');
const script = path.join(root, 'scripts/timetable-post/import.mjs');
const post = path.join(root, 'tests/flows/fixtures/sample-post-expressway.txt');
const LABEL = 'flow test expressway post (13 Oct 2025)';

const node = (...args: string[]) =>
  execFileSync('node', [script, ...args], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, BUSMATE_EMAIL: ACCOUNTS.mot.email, BUSMATE_PASSWORD: ACCOUNTS.mot.password, BUSMATE_API: URLS.api },
  });

test.describe.serial('the Southern Expressway section of a community post', () => {
  let csv: string;
  const ids: Record<string, string> = {};

  test('is read as three departures; the destination-varies-per-line section and its Colombo echo are both skipped', async () => {
    csv = path.join(mkdtempSync(path.join(tmpdir(), 'flows-expressway-')), 'departures.csv');
    const out = node('parse', '--file', post, '--csv', csv);
    expect(out).toContain('Read 3 departures');
    expect(out).toMatch(/2 other sections?, 1 departure lines/);
    expect(readFileSync(csv, 'utf8')).not.toMatch(/0770000000/);
  });

  test('is loaded as reports; a route is named per destination, and an operator with no plate is a valid claim', async () => {
    const out = node('load', '--csv', csv, '--observed-on', '2025-10-13', '--label', LABEL);
    expect(out).toMatch(/Routes\s+created 3, already there 0/);
    expect(out).toMatch(/Schedules\s+created 3, already there 0, failed 0/);
    expect(out).toMatch(/Workings\s+created 3, already there 0, failed 0/);

    const mot = await as(ACCOUNTS.mot);
    const stops = items((await mot.get('/api/stops/all')).body);
    const kaduwela = stops.find((s) => s.name === 'Kaduwela');
    const makumbura = stops.find((s) => s.name === 'Makumbura');
    expect(kaduwela.location.latitude ?? null).toBeNull(); // the post gives no positions, so none are recorded
    expect(makumbura).toBeTruthy();
    ids.from = stops.find((s) => s.name === 'Embilipitiya Central Bus Stand').id;
    ids.to = kaduwela.id;

    const route = items((await mot.get('/api/routes/all')).body)
      .find((r) => r.name === 'Embilipitiya Central Bus Stand - Kaduwela via Southern Expressway');
    expect(route.roadType).toBe('EXPRESSWAY');
    expect(route.trust.label).toBe('REPORTED');

    const schedules = items((await mot.get(`/api/schedules/by-route/${route.id}`)).body);
    expect(schedules).toHaveLength(1);
    const full = (await mot.get(`/api/schedules/${schedules[0].id}`)).body;
    // "the journey carries on to Colombo" is the post's own hyphen, kept as a note, never a second stop
    expect(full.description).toContain('කඩුවෙල-කොළඹ');
    ids.kaduwelaSchedule = schedules[0].id;

    const makumburaRoute = items((await mot.get('/api/routes/all')).body)
      .find((r) => r.name === 'Embilipitiya Central Bus Stand - Makumbura via Southern Expressway');
    const makumburaSchedule = items((await mot.get(`/api/schedules/by-route/${makumburaRoute.id}`)).body)[0];
    const workings = (await mot.get(`/api/schedules/${makumburaSchedule.id}/workings`)).body;
    expect(workings[0].operatorNameObserved).toBe('Sample Feeder');
    expect(workings[0].vehicles).toHaveLength(0); // the post names no plate for this one — a valid claim, not a gap
  });

  test('a passenger can find and open the Kaduwela departure', async ({ page }) => {
    await page.goto(`${URLS.web}/findmybus?fromStopId=${ids.from}&toStopId=${ids.to}&fromName=Embilipitiya&toName=Kaduwela&date=2026-10-05`);
    await expect(page.getByText(/Usually\s+Sample Highway Express\s*·\s*AA-1111/)).toBeVisible();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await expect(page.getByText('Invalid stop sequence')).toHaveCount(0);
  });

  test('loading the same post again changes nothing', async () => {
    const out = node('load', '--csv', csv, '--observed-on', '2025-10-13', '--label', LABEL);
    expect(out).toMatch(/Schedules\s+created 0, already there 3, failed 0/);
    expect(out).toMatch(/Workings\s+created 0, already there 3, failed 0/);
  });
});
