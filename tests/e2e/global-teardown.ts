import type { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig) {
  // ── Docker e2e environment ────────────────────────────────────────────────
  // When running against the Docker test environment (pnpm run e2e:docker),
  // all test data cleanup is handled automatically by stopping the environment:
  //
  //   pnpm run e2e:env:stop
  //
  // That command runs `docker compose down -v`, which removes the PostgreSQL
  // container and its volume, wiping every record created during the test run.
  // No explicit per-record cleanup is needed here.
  //
  // ── Local dev environment ─────────────────────────────────────────────────
  // When running against a shared dev environment, test data prefixed with
  // E2E_TEST_ can be removed via cleanupAllTestData() from utils/api-helpers.
  // Uncomment and adapt the block below if required:
  //
  // import { createApiClient, cleanupAllTestData } from './utils/api-helpers.js';
  // const token = process.env.E2E_API_TOKEN;
  // if (token) {
  //   const client = createApiClient(token);
  //   await cleanupAllTestData(client);
  // }

  console.log('[global-teardown] Teardown complete.');
}

export default globalTeardown;
