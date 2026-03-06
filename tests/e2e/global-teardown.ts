import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  // Optional: Clean up test data created during the test run.
  // The cleanupAllTestData() function from utils/api-helpers.ts can be called
  // here to remove any orphaned E2E_TEST_ prefixed records from the database.
  //
  // For now this is a no-op. Uncomment and implement when needed:
  //
  // import { cleanupAllTestData } from './utils/api-helpers';
  // await cleanupAllTestData(token);

  console.log('[global-teardown] Teardown complete.');
}

export default globalTeardown;
