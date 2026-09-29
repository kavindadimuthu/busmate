import { expect, test } from '@playwright/test';
import { ACCOUNTS, as, items, URLS } from '../lib/api';
import { passengerWeb, portal } from '../lib/ui';

/**
 * The contributor programme end to end (INC-029 to INC-043): someone applies, staff accept them, a steward is
 * appointed, a contributor proposes a correction, the steward reviews it inside their corridor and without seeing who
 * made it, and staff can end a steward's authority. Ordered, on the seeded dev data of a fresh stack.
 *
 * Fixed ids come from the dev seed contract: the seeded steward reviews Colombo-Kandy, and the seeded Galle
 * contributor's pending proposal (…12002) is the out-of-corridor one.
 */
test.describe.serial('the contribution loop', () => {
  const OUT_OF_CORRIDOR_PROPOSAL = '00000000-0000-0000-0000-000000012002';

  test('a passenger applies through the form, and staff accept them in the portal', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.dilani);
    await page.goto(`${URLS.web}/contribute/apply`);
    await page.getByPlaceholder('Which routes do you know well, and why?').fill('Flow test: I know the Colombo-Kandy road.');
    await page.getByPlaceholder('e.g. Colombo').fill('Colombo');
    await page.locator('label:has(button[role=checkbox])').filter({ hasText: /Colombo - Kandy/ }).first().locator('button[role=checkbox]').click();
    await page.locator('label:has-text("I have read and accept the contributor agreement")').locator('button[role=checkbox]').click();
    await page.getByRole('button', { name: /submit|apply/i }).last().click();
    await expect(page.getByText(/under review/i).first()).toBeVisible();
    await context.close();

    expect((await (await as(ACCOUNTS.dilani)).get('/api/community/me')).body.status).toBe('APPLIED');

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community`);
    await staff.page.getByText(ACCOUNTS.dilani.name).first().click();
    await staff.page.getByRole('button', { name: 'Accept' }).click();
    await expect(staff.page.getByText('Contributor accepted')).toBeVisible();
    await staff.context.close();

    // The database, not the toast, is the evidence.
    expect((await (await as(ACCOUNTS.dilani)).get('/api/community/me')).body.status).toBe('ACTIVE');
  });

  test('staff appoint them steward for one corridor', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community?status=ACTIVE`);
    await staff.page.getByText(ACCOUNTS.dilani.name).first().click();
    await staff.page.getByRole('button', { name: 'Appoint as steward' }).click();
    // Their declared corridor is suggested; nothing else is ticked.
    await staff.page.getByRole('button', { name: 'Save' }).click();
    await expect(staff.page.getByText(/Reviews proposals in 1 corridor/)).toBeVisible();
    await staff.context.close();

    const me = (await (await as(ACCOUNTS.dilani)).get('/api/community/me')).body;
    expect(me.activeSteward).toBe(true);
    expect(me.contributor.stewardScopeRouteGroupIds).toHaveLength(1);
  });

  test('a contributor proposes a correction, and the form keeps the stop’s translations', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.amara);
    await page.goto(`${URLS.web}/contribute/propose`);
    await page.getByRole('button', { name: /correct/i }).first().click();
    await page.locator('#stop-search').fill('Kadawatha');
    await page.getByRole('button', { name: /Kadawatha/ }).first().click();
    // The search result carries no Sinhala or Tamil names; the form loads the full stop so it does not send them blank.
    await expect(page.locator('#stop-name-si')).toHaveValue('කඩවත');
    await expect(page.locator('#stop-name-ta')).toHaveValue('கடவத');
    await page.locator('#stop-name').fill('Kadawatha Junction');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /Rode the route/i }).click();
    await page.locator('#note').fill('Flow test: the signboard now says Junction.');
    await page.getByRole('button', { name: /submit/i }).last().click();
    await expect(page.getByText(/submitted for review/i).first()).toBeVisible();
    await context.close();
  });

  test('the steward sees proposals in their corridor only, and never who made them', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.tharindu);
    await page.goto(`${URLS.web}/contribute/mine`);
    await page.getByRole('link', { name: /Review proposals/ }).click();

    await expect(page.getByText('Kadawatha Junction')).toBeVisible();
    await expect(page.getByText('Peradeniya Road Junction')).toBeVisible();
    const queue = await page.locator('body').innerText();
    expect(queue).not.toContain('Moratuwa Flyover Stop'); // the Galle contributor's proposal is another corridor's
    expect(queue).not.toContain(ACCOUNTS.amara.name); // and nobody is named

    await page.goto(`${URLS.web}/contribute/review/${OUT_OF_CORRIDOR_PROPOSAL}`);
    await expect(page.getByText('outside the corridors you review')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
    await context.close();
  });

  test('the steward approves; the stop is renamed and keeps its translations, credited generically', async ({ browser }) => {
    const { context, page } = await passengerWeb(browser, ACCOUNTS.tharindu);
    await page.goto(`${URLS.web}/contribute/review`);
    await page.getByText('Kadawatha Junction').click();
    await expect(page.getByText('What would change')).toBeVisible();
    // The reviewer sees the translations as kept, not blanked.
    await expect(page.locator('tr', { hasText: 'Name (Sinhala)' }).locator('td').last()).toHaveText('කඩවත');
    await expect(page.getByRole('button', { name: /revert/i })).toHaveCount(0);
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Proposal approved')).toBeVisible();
    await context.close();

    const stop = items((await (await as(ACCOUNTS.mot)).get('/api/stops/all')).body).find((s) => s.name === 'Kadawatha Junction');
    expect(stop, 'the stop was renamed').toBeTruthy();
    expect(stop.nameSinhala).toBe('කඩවත');
    expect(stop.nameTamil).toBe('கடவத');
    expect(stop.provenance.sourceTier).toBe('SRC_4');
    expect(stop.provenance.attributionLabel).toBe('Community contributor');
  });

  test('authority is enforced by the server, not by the screens', async () => {
    const status = async (who: keyof typeof ACCOUNTS, method: 'get' | 'post', path: string) =>
      (await (await as(ACCOUNTS[who]))[method](path)).status;

    // people with no review standing
    expect(await status('ishara', 'get', '/api/community/changesets')).toBe(403);
    expect(await status('amara', 'get', '/api/community/changesets')).toBe(403);
    // a steward outside their corridor, and beyond what a steward may do
    expect(await status('tharindu', 'post', `/api/community/changesets/${OUT_OF_CORRIDOR_PROPOSAL}/approve`)).toBe(403);
    expect(await status('tharindu', 'get', '/api/community/contributors/promotion-candidates')).toBe(403);
  });

  test('staff see who is ready to be promoted', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community?status=CANDIDATES`);
    await expect(staff.page.getByText(ACCOUNTS.amara.name)).toBeVisible(); // one approved proposal clears the bar this stack sets
    await expect(staff.page.getByText(ACCOUNTS.tharindu.name)).toHaveCount(0); // a steward is already promoted
    await staff.context.close();
  });

  test('suspending a steward ends their authority on their very next request', async ({ browser }) => {
    const before = await (await as(ACCOUNTS.dilani)).get('/api/community/changesets');
    expect(before.status).toBe(200);

    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community?status=ACTIVE`);
    await staff.page.getByText(ACCOUNTS.dilani.name).first().click();
    await staff.page.getByRole('button', { name: 'Suspend' }).first().click();
    await staff.page.locator('#community-reason').fill('Flow test: ending a steward’s authority.');
    await staff.page.getByRole('button', { name: 'Confirm' }).click();
    await expect(staff.page.getByText('Contributor suspended')).toBeVisible();
    await staff.context.close();

    expect((await (await as(ACCOUNTS.dilani)).get('/api/community/changesets')).status).toBe(403);
    const me = (await (await as(ACCOUNTS.dilani)).get('/api/community/me')).body;
    expect(me.activeSteward).toBe(false);
    expect(me.contributor.level).toBe('CONTRIBUTOR');
  });
});
