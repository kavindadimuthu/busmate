import { expect, test } from '@playwright/test';
import { ACCOUNTS, URLS } from '../lib/api';
import { portal } from '../lib/ui';

/**
 * INC-061: staff correct an AI's reading, match places to stops, and load the result as reports. Unlike
 * INC-060's own flow test, the AI read here is never mocked at the browser level — resolution and approve
 * are keyed by a real draft id, and a response mocked at the browser edge would disagree with what the real
 * backend actually stored and checks against (found the hard way: a first draft of this test intercepted
 * the create response but left the real, differently-shaped Gemini answer sitting in the database, so the
 * resolution built from the mocked departures didn't match what approve validated against). So this accepts
 * a real, slower Gemini call and asserts on shape (a row rendered, a load result appeared, nothing crashed),
 * never on exact content — the deterministic case-by-case behaviour (flag needs a reason, an unaccounted
 * line needs acknowledging, re-approving is idempotent) is already proven against real Postgres with a
 * fake AI reader in PostImportLoadIntegrationTest; this spec's job is only to prove the real UI wiring works.
 */
test.describe.serial('staff correct, match stops and load an AI-read post', () => {
  test('a real draft can be reviewed and loaded end to end through the UI', async ({ browser }) => {
    test.setTimeout(330_000);
    const staff = await portal(browser, ACCOUNTS.mot);

    const pastedText = 'INC061 Flow Stand to INC061 Flow City\n\n06:30 Flow Test Operator FL-0009';
    await staff.page.goto(`${URLS.portal}/mot/community/post-import`);
    await staff.page.getByTestId('post-import-textarea').fill(pastedText);
    await staff.page.getByTestId('post-import-submit').click();
    await expect(staff.page.getByTestId('post-import-row')).toBeVisible({ timeout: 300_000 });

    // Resolve whatever the real AI actually flagged, generically — a real reading of this one-line post may
    // or may not be grounded depending on the model's own phrasing, and that's fine either way.
    const overrideReasons = staff.page.getByTestId('override-reason');
    for (let i = 0; i < (await overrideReasons.count()); i++) {
      await overrideReasons.nth(i).fill('Checked manually against the post — correct.');
    }
    const acknowledgeBoxes = staff.page.getByTestId('acknowledge-unaccounted');
    for (let i = 0; i < (await acknowledgeBoxes.count()); i++) {
      await acknowledgeBoxes.nth(i).check();
    }

    await staff.page.getByTestId('save-resolution').click();
    await expect(staff.page.getByTestId('approve-load')).toBeEnabled();

    await staff.page.getByTestId('approve-load').click();
    await expect(staff.page.getByTestId('load-result')).toBeVisible({ timeout: 15_000 });
    // Any of these is a legitimate outcome of a real AI call — CREATED/ALREADY_THERE prove the write path,
    // FAILED (e.g. the AI didn't extract an origin this time) proves the loader refuses cleanly rather than
    // guessing or crashing. What matters here is that the mechanism ran end to end and said something.
    await expect(staff.page.getByText(/Row 0: (CREATED|ALREADY_THERE|FAILED)/)).toBeVisible();

    await staff.context.close();
  });
});
