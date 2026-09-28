// Auto-resolves a dynamic route (e.g. "/mot/operators/:operatorId") to a concrete one by visiting its list
// page (already authenticated) and picking up a real id from an actual link on it — never a hand-maintained
// id. A route the tool can't resolve this way is skipped and reported, not guessed at.

/** The static prefix before the first `:param` segment, e.g. "/mot/operators/:id/edit" -> "/mot/operators". */
function listPathFor(route) {
  const parts = route.split('/');
  const dynamicIndex = parts.findIndex((p) => p.startsWith(':'));
  return parts.slice(0, dynamicIndex).join('/') || '/';
}

const cache = new Map(); // listPath -> resolved id (reused across sibling routes, e.g. detail + edit)

export async function resolveDynamicRoute(page, baseUrl, route) {
  const listPath = listPathFor(route);
  const cacheKey = `${baseUrl}${listPath}`;
  if (!cache.has(cacheKey)) {
    await page.goto(`${baseUrl}${listPath}`, { waitUntil: 'load', timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(500); // let client-rendered list rows (fetched after load) appear
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    const match = hrefs
      .filter(Boolean)
      .map((h) => h.match(new RegExp(`^${listPath}/([^/]+)`)))
      .find(Boolean);
    cache.set(cacheKey, match ? match[1] : null);
  }
  const id = cache.get(cacheKey);
  if (!id) return null;

  const paramName = route.split('/').find((p) => p.startsWith(':')).slice(1);
  return route.replace(`:${paramName}`, id);
}
