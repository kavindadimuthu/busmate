/**
 * API Client Parser
 *
 * Parses openapi-typescript-codegen generated service files to extract
 * all defined endpoints with their HTTP method, URL, and description.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';

/**
 * Discover all API client directories under a given root.
 * Looks for directories containing a `src/services/` subdirectory.
 *
 * @param {string} searchRoot - Directory to search in (e.g. `libs/api-clients`)
 * @returns {string[]} List of absolute paths to API client root directories
 */
export function discoverApiClients(searchRoot) {
  const clients = [];

  if (!existsSync(searchRoot)) return clients;

  for (const entry of readdirSync(searchRoot)) {
    const clientDir = join(searchRoot, entry);
    if (!statSync(clientDir).isDirectory()) continue;

    const servicesDir = join(clientDir, 'src', 'services');
    if (existsSync(servicesDir) && statSync(servicesDir).isDirectory()) {
      clients.push(clientDir);
    }
  }

  return clients;
}

/**
 * Resolve the npm package name for an API client.
 * Checks for a package.json; falls back to deriving from the directory name.
 *
 * @param {string} clientDir - Absolute path to the API client root
 * @param {string} [tsconfigBasePath] - Optional path to tsconfig.base.json for path alias lookup
 * @returns {string} Package name (e.g. `@busmate/api-client-route`)
 */
export function resolvePackageName(clientDir, tsconfigBasePath) {
  // 1. Try package.json
  const pkgJsonPath = join(clientDir, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      if (pkg.name) return pkg.name;
    } catch {
      // ignore
    }
  }

  // 2. Try tsconfig.base.json path aliases
  if (tsconfigBasePath && existsSync(tsconfigBasePath)) {
    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigBasePath, 'utf-8'));
      const paths = tsconfig?.compilerOptions?.paths ?? {};
      const srcIndexPath = join(clientDir, 'src', 'index.ts')
        // make it relative and normalise separators
        .replace(dirname(tsconfigBasePath) + '/', '')
        .replace(/\\/g, '/');

      for (const [alias, targets] of Object.entries(paths)) {
        if (targets.some(t => t.replace(/\\/g, '/').includes(srcIndexPath))) {
          return alias;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Derive from directory name  (e.g. route-management → @busmate/api-client-route-management)
  const dirName = basename(clientDir);
  return `@busmate/api-client-${dirName}`;
}

/**
 * Parse a single service file and extract all endpoints defined in it.
 *
 * @param {string} filePath - Absolute path to the service TypeScript file
 * @returns {Endpoint[]} Array of endpoint objects
 */
export function parseServiceFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const endpoints = [];

  // Extract the service class name
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const serviceName = classMatch ? classMatch[1] : basename(filePath, '.ts');

  // Collect positions of every `public static` method declaration
  const methodStarts = [];
  const methodRegex = /public\s+static\s+(\w+)\s*\(/g;
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    methodStarts.push({ name: m[1], start: m.index });
  }

  for (let i = 0; i < methodStarts.length; i++) {
    const { name, start } = methodStarts[i];
    const end = i + 1 < methodStarts.length ? methodStarts[i + 1].start : content.length;

    // Slice the method body to limit search scope
    const methodBody = content.slice(start, end);

    // Locate the __request call
    const requestIdx = methodBody.indexOf('__request(OpenAPI,');
    if (requestIdx === -1) continue;

    // Search for method and url in a reasonable window after __request
    const optionsWindow = methodBody.slice(requestIdx, requestIdx + 1000);

    const httpMethod =
      optionsWindow.match(/\bmethod:\s*['"]([A-Z]+)['"]/)?.[1] ?? 'UNKNOWN';
    const url =
      optionsWindow.match(/\burl:\s*['"]([^'"]+)['"]/)?.[1] ?? 'unknown';

    // Extract JSDoc description from the block preceding this method
    const beforeDecl = content.slice(0, start);
    const jsdocMatch = beforeDecl.match(/\/\*\*([\s\S]*?)\*\/\s*$/);
    let description = '';
    if (jsdocMatch) {
      description = jsdocMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, '').trim())
        .filter(l => l && !l.startsWith('@'))
        .join(' ')
        .trim();
    }

    endpoints.push({
      serviceName,
      methodName: name,
      httpMethod,
      url,
      description,
    });
  }

  return endpoints;
}

/**
 * Parse a complete API client directory and return all its endpoints.
 *
 * @param {string} clientDir - Absolute path to the API client root dir
 * @param {object} [opts]
 * @param {string} [opts.tsconfigBasePath] - Path to tsconfig.base.json for package name lookup
 * @returns {ApiClient}
 */
export function parseApiClient(clientDir, opts = {}) {
  const servicesDir = join(clientDir, 'src', 'services');
  const packageName = resolvePackageName(clientDir, opts.tsconfigBasePath);
  const clientName = basename(clientDir);

  const endpoints = [];

  for (const file of readdirSync(servicesDir)) {
    if (!file.endsWith('.ts')) continue;
    const filePath = join(servicesDir, file);
    endpoints.push(...parseServiceFile(filePath));
  }

  return {
    clientName,
    packageName,
    clientDir,
    endpoints,
  };
}

/**
 * Parse multiple API client directories.
 *
 * @param {string[]} clientDirs - Absolute paths to client root dirs
 * @param {object} [opts]
 * @returns {ApiClient[]}
 */
export function parseApiClients(clientDirs, opts = {}) {
  return clientDirs.map(dir => parseApiClient(dir, opts));
}
