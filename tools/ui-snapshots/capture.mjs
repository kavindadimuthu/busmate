// The generic capture engine. Never edited when a screen is added — everything screen-specific comes from
// apps.mjs's discovery/login functions or is auto-resolved at runtime (see lib/resolve-dynamic.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { APPS, repoRoot } from './apps.mjs';
import { ACCOUNTS } from './lib/accounts.mjs';
import { partitionRoutes } from './lib/discover-routes.mjs';
import { resolveDynamicRoute } from './lib/resolve-dynamic.mjs';

const outputDir = resolve(repoRoot, 'tools/ui-snapshots/output', new Date().toISOString().replace(/[:.]/g, '-'));

function slugify(route) {
  return route === '/' ? 'index' : route.replace(/^\//, '').replace(/\//g, '_');
}

export async function capture({ apps = Object.keys(APPS), baseUrls, headed = false } = {}) {
  const browser = await chromium.launch({ headless: !headed });
  const manifest = []; // { app, route, role, file, status: 'captured'|'skipped', reason? }

  for (const appName of apps) {
    const app = APPS[appName];
    const baseUrl = baseUrls[appName];
    const routes = app.discoverRoutes();
    const { staticRoutes, dynamicRoutes } = partitionRoutes(routes);

    // One authenticated context per role actually needed by this app's routes, created lazily.
    const contextsByRole = new Map();
    const contextFor = async (role) => {
      if (!role) {
        if (!contextsByRole.has(null)) contextsByRole.set(null, await browser.newContext({ viewport: { width: 1280, height: 900 } }));
        return contextsByRole.get(null);
      }
      if (!contextsByRole.has(role)) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();
        const account = ACCOUNTS[role];
        if (!account) throw new Error(`no seeded account configured for role "${role}" (app: ${appName})`);
        await app.login(page, baseUrl, account);
        await page.close();
        contextsByRole.set(role, context);
      }
      return contextsByRole.get(role);
    };

    for (const route of [...staticRoutes, ...dynamicRoutes]) {
      const role = app.roleForRoute(route);
      const context = await contextFor(role);
      const page = await context.newPage();

      let target = route;
      if (route.includes(':')) {
        target = await resolveDynamicRoute(page, baseUrl, route);
        if (!target) {
          manifest.push({ app: appName, route, role, status: 'skipped', reason: 'could not auto-resolve a real id from its list page' });
          await page.close();
          continue;
        }
      }

      try {
        // Not 'networkidle': dashboards with live polling (tracking, notification badges) never go idle
        // and would time out here forever. 'load' plus a short settle covers the common case instead.
        await page.goto(`${baseUrl}${target}`, { waitUntil: 'load', timeout: 30_000 });
        await page.waitForTimeout(1500); // lets client-fetched widgets replace their loading skeletons
        const file = `${appName}/${slugify(route)}.png`;
        const filePath = resolve(outputDir, file);
        mkdirSync(dirname(filePath), { recursive: true });
        await page.screenshot({ path: filePath, fullPage: true });
        manifest.push({ app: appName, route, resolvedRoute: target, role, status: 'captured', file });
      } catch (err) {
        manifest.push({ app: appName, route, role, status: 'skipped', reason: err.message });
      } finally {
        await page.close();
      }
    }

    for (const context of contextsByRole.values()) await context.close();
  }

  await browser.close();
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { outputDir, manifest };
}
