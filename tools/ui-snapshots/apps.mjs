// The only per-app "adapter" surface. Each entry says *how* to discover an app's routes and *how* to log in
// to it — never lists screens by hand. Adding a new page to an existing app needs no edit here.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileGlobRoutes, jsxRoutes, jsxRoutesInsideElement } from './lib/discover-routes.mjs';
import { withLoginRetry } from './lib/login-retry.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, '../..');

const ROLE_PREFIXES = ['admin', 'mot', 'operator', 'timekeeper'];

export const APPS = {
  'new-react-portal': {
    frontendDir: 'apps/frontend/new-react-portal',
    devServer: { port: 5175, script: 'apps/frontend/new-react-portal', cmd: ['pnpm', 'exec', 'vite', '--port', '5175', '--strictPort'] },
    // A route's leading path segment is its role, if it's one of the layout roles; "/" is the public login page.
    discoverRoutes: () => fileGlobRoutes(resolve(repoRoot, 'apps/frontend/new-react-portal/src/pages')),
    roleForRoute: (route) => {
      const first = route.split('/')[1];
      return ROLE_PREFIXES.includes(first) ? first : null;
    },
    async login(page, baseUrl, account) {
      await withLoginRetry(page, (url) => url !== `${baseUrl}/`, async () => {
        await page.goto(`${baseUrl}/`);
        await page.getByPlaceholder('you@busmate.lk').fill(account.email);
        await page.locator('input[type=password]').fill(account.password);
        await page.locator('button[type=submit]').click();
        await page.waitForURL((u) => u.pathname !== '/', { timeout: 15_000 }).catch(() => {});
      });
    },
  },

  'passenger-web': {
    frontendDir: 'apps/frontend/passenger-web',
    devServer: { port: 4002, cmd: ['pnpm', 'exec', 'vite', '--port', '4002', '--strictPort'] },
    discoverRoutes: () => jsxRoutes(resolve(repoRoot, 'apps/frontend/passenger-web/src/App.tsx')),
    roleForRoute: (route) => {
      const protectedRoutes = jsxRoutesInsideElement(
        resolve(repoRoot, 'apps/frontend/passenger-web/src/App.tsx'),
        'ProtectedRoute',
      );
      return protectedRoutes.includes(route) ? 'passenger' : null;
    },
    async login(page, baseUrl, account) {
      await withLoginRetry(page, (url) => !new URL(url).pathname.startsWith('/login'), async () => {
        await page.goto(`${baseUrl}/login`);
        await page.getByPlaceholder('you@example.com').fill(account.email);
        await page.locator('input[type=password]').fill(account.password);
        await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();
        await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 }).catch(() => {});
      });
    },
  },
};
