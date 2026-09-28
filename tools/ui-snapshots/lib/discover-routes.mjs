// Generic route discovery. Each app tells us *how* to find its routes; we never hand-list them, so a new
// screen shows up here automatically and this file never needs editing when one is added.
import { readFileSync, readdirSync } from 'node:fs';
import { sep } from 'node:path';

/**
 * File-based routing (new-react-portal's convention: `import.meta.glob("./pages/**\/page.tsx")` in App.tsx).
 * We mirror that same file's `routePathFromFile` logic exactly, so discovery here can never drift from what
 * the app itself does.
 */
export function fileGlobRoutes(pagesDir) {
  const files = readdirSync(pagesDir, { recursive: true })
    .filter((f) => f.endsWith(`page.tsx`))
    .map((f) => f.split(sep).join('/'));

  return files.map((f) => {
    const route = `/${f}`
      .replace(/\/page\.tsx$/, '')
      .replace(/\[(.+?)\]/g, ':$1');
    return route === '' ? '/' : route;
  });
}

/**
 * Explicit-JSX routing (passenger-web's convention: `<Route path="...">` literals in one file). A new route
 * necessarily adds a line to that file, so a regex pass over it stays current with zero separate manifest.
 */
export function jsxRoutes(appFilePath) {
  const src = readFileSync(appFilePath, 'utf8');
  const paths = [...src.matchAll(/<Route\s[^>]*\bpath=["']([^"']+)["']/g)].map((m) => m[1]);
  return [...new Set(paths)].filter((p) => p !== '*');
}

/** Splits routes into static (capturable as-is) and dynamic (need a param substitution to resolve). */
export function partitionRoutes(routes) {
  const dynamicSegment = /:[^/]+/;
  const staticRoutes = routes.filter((r) => !dynamicSegment.test(r));
  const dynamicRoutes = routes.filter((r) => dynamicSegment.test(r));
  return { staticRoutes, dynamicRoutes };
}

/**
 * Which of `jsxRoutes`' paths are nested inside `<Route element={<SomeWrapper .../>}>...</Route>` (e.g. an
 * auth-gate wrapper). Generic over the wrapper's element name — an app can have more than one such gate.
 * Used so "which routes need login" is read from the router itself, not hand-maintained alongside it.
 */
export function jsxRoutesInsideElement(appFilePath, elementName) {
  const src = readFileSync(appFilePath, 'utf8');
  const marker = `<Route element={<${elementName}`;
  const markerIdx = src.indexOf(marker);
  if (markerIdx === -1) return [];
  const wrapperOpenEnd = src.indexOf('>', markerIdx) + 1;

  const tagRe = /<Route\b[^>]*?(\/?)>|<\/Route>/g;
  tagRe.lastIndex = wrapperOpenEnd;
  let depth = 1;
  let bodyEnd = src.length;
  let m;
  while ((m = tagRe.exec(src))) {
    if (m[0] === '</Route>') {
      depth--;
      if (depth === 0) { bodyEnd = m.index; break; }
    } else if (!m[1]) {
      depth++;
    }
  }
  const body = src.slice(wrapperOpenEnd, bodyEnd);
  return [...body.matchAll(/<Route\s[^>]*\bpath=["']([^"']+)["']/g)].map((mm) => mm[1]);
}

/** Resolves a dynamic route's `:param` segments using a per-app params map; returns null if unresolvable. */
export function resolveDynamicRoute(route, params) {
  let resolved = route;
  for (const [key, value] of Object.entries(params ?? {})) {
    resolved = resolved.replace(`:${key}`, value);
  }
  return resolved.includes(':') ? null : resolved;
}
