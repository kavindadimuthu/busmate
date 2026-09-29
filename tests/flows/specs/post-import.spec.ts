import { expect, test } from '@playwright/test';
import { ACCOUNTS, URLS } from '../lib/api';
import { portal } from '../lib/ui';

/**
 * INC-060: staff paste a community post, an AI reads it, code checks the reading. This spec exercises the
 * page end to end without calling a real AI provider — the backend call is intercepted at the browser level
 * with a crafted reading, the same way the server-side integration tests replace PostReaderClient with a
 * fake. What's under test here is the review UI (flags shown, original text alongside the reading), not
 * Gemini.
 */
test.describe.serial('an AI reads a pasted post for staff review', () => {
  test('a grounded row and an ungrounded claim are both shown, with the flag only on the second', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);

    await staff.page.route('**/api/community/post-imports', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '11111111-1111-1111-1111-111111111111',
          pastedText: '6.30am Colombo to Galle - Super Line ABC-1234\n7.45am Colombo to Matara',
          aiProvider: 'gemini',
          aiModel: 'gemini-2.5-flash',
          status: 'READ',
          departures: [
            {
              departure: {
                time: '6.30am', origin: 'Colombo', destination: 'Galle', operatorName: 'Super Line',
                plates: ['ABC-1234'], sourceLines: ['6.30am Colombo to Galle - Super Line ABC-1234'],
              },
              grounded: true,
              ungroundedFields: [],
            },
            {
              departure: {
                time: '7.45am', origin: 'Colombo', destination: 'Matara', operatorName: 'Invented Travels',
                plates: [], sourceLines: ['7.45am Colombo to Matara'],
              },
              grounded: false,
              ungroundedFields: ['operatorName'],
            },
          ],
          skipped: [],
          unaccountedLines: [],
          createdAt: new Date().toISOString(),
          createdBy: 'test',
        }),
      });
    });

    await staff.page.goto(`${URLS.portal}/mot/community/post-import`);
    await staff.page.getByTestId('post-import-textarea').fill(
      '6.30am Colombo to Galle - Super Line ABC-1234\n7.45am Colombo to Matara',
    );
    await staff.page.getByTestId('post-import-submit').click();

    const rows = staff.page.getByTestId('post-import-row');
    await expect(rows).toHaveCount(2);
    // Rows are editable inputs now (INC-061), so "which row" is found by an input's value, not text content.
    const grounded = rows.filter({ has: staff.page.locator('input[value="Super Line"]') });
    const ungrounded = rows.filter({ has: staff.page.locator('input[value="Invented Travels"]') });
    await expect(grounded.getByText(/Not backed by/)).toHaveCount(0);
    await expect(ungrounded.getByText(/Not backed by/)).toBeVisible();
    await expect(staff.page.getByTestId('post-import-result')).toContainText('Colombo to Galle');

    await staff.context.close();
  });

  test('an unaccounted timed line is surfaced, not silently dropped', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);

    await staff.page.route('**/api/community/post-imports', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '22222222-2222-2222-2222-222222222222',
          pastedText: '6.30am Colombo to Galle\n9.00pm Colombo to Jaffna',
          aiProvider: 'gemini',
          aiModel: 'gemini-2.5-flash',
          status: 'READ',
          departures: [
            {
              departure: { time: '6.30am', origin: 'Colombo', destination: 'Galle', plates: [], sourceLines: ['6.30am Colombo to Galle'] },
              grounded: true,
              ungroundedFields: [],
            },
          ],
          skipped: [],
          unaccountedLines: ['9.00pm Colombo to Jaffna'],
          createdAt: new Date().toISOString(),
          createdBy: 'test',
        }),
      });
    });

    await staff.page.goto(`${URLS.portal}/mot/community/post-import`);
    await staff.page.getByTestId('post-import-textarea').fill('6.30am Colombo to Galle\n9.00pm Colombo to Jaffna');
    await staff.page.getByTestId('post-import-submit').click();

    await expect(staff.page.getByText("weren't read or explicitly set aside")).toBeVisible();
    await expect(staff.page.locator('li').filter({ hasText: '9.00pm Colombo to Jaffna' })).toBeVisible();

    await staff.context.close();
  });

  test('the submit button stays disabled until something is pasted', async ({ browser }) => {
    const staff = await portal(browser, ACCOUNTS.mot);
    await staff.page.goto(`${URLS.portal}/mot/community/post-import`);
    await expect(staff.page.getByTestId('post-import-submit')).toBeDisabled();
    await staff.page.getByTestId('post-import-textarea').fill('6.30am Colombo to Galle');
    await expect(staff.page.getByTestId('post-import-submit')).toBeEnabled();
    await staff.context.close();
  });
});
