/**
 * Usage Searcher
 *
 * Walks application source directories and locates every call site for
 * each API endpoint method defined in the parsed API clients.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, extname } from 'path';

/** Source file extensions to scan */
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

/** Directories to always skip when walking the file tree */
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nx',
  'out',
  '.turbo',
  'coverage',
  '.git',
  '__generated__',
]);

/**
 * Recursively collect all source files under `dir`.
 *
 * @param {string} dir - Directory to walk
 * @param {string[]} [acc=[]] - Accumulator (internal)
 * @returns {string[]} Absolute file paths
 */
export function collectSourceFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;

  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      collectSourceFiles(fullPath, acc);
    } else if (stat.isFile() && SOURCE_EXTENSIONS.has(extname(entry))) {
      acc.push(fullPath);
    }
  }

  return acc;
}

/**
 * Search a single file for calls to a specific service method and return
 * all matching locations.
 *
 * Detects both live calls  (`ServiceName.method(`) and commented-out calls
 * (`// ServiceName.method(` / `/* ... ServiceName.method( ... *\/`).
 *
 * @param {string} filePath
 * @param {string} serviceName  - e.g. `RouteManagementService`
 * @param {string} methodName   - e.g. `getAllRoutes`
 * @param {string} rootDir      - Monorepo root used to produce relative paths
 * @returns {UsageLocation[]}
 */
function searchFileForMethod(filePath, serviceName, methodName, rootDir) {
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  // Pattern: ServiceName.methodName  (followed by `(` or end-of-line for type references)
  const pattern = new RegExp(
    `${escapeRegex(serviceName)}\\.${escapeRegex(methodName)}\\s*[(<]`,
    'g',
  );

  const usages = [];
  const lines = content.split('\n');
  let lineStart = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    pattern.lastIndex = 0; // reset for each line

    let match;
    while ((match = pattern.exec(line)) !== null) {
      // Determine whether this is a commented-out call
      const commented = isCommented(line, match.index);

      usages.push({
        file: relative(rootDir, filePath),
        line: lineIdx + 1,
        column: match.index + 1,
        snippet: line.trim(),
        commented,
      });
    }

    lineStart += line.length + 1; // +1 for the '\n'
  }

  return usages;
}

/**
 * Returns true if the match at `matchIndex` within `line` is inside a
 * single-line comment (`//`).  Block comment detection is approximate.
 *
 * @param {string} line
 * @param {number} matchIndex
 * @returns {boolean}
 */
function isCommented(line, matchIndex) {
  const beforeMatch = line.slice(0, matchIndex);
  // Single-line comment
  if (beforeMatch.includes('//')) return true;
  // Very rough block-comment open without close before the match
  const lastOpen = beforeMatch.lastIndexOf('/*');
  if (lastOpen !== -1 && !beforeMatch.slice(lastOpen).includes('*/')) return true;
  return false;
}

/**
 * Escape special regex characters in a string.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Search all provided source files for usage of a given endpoint method.
 *
 * @param {string[]} sourceFiles - Absolute paths to files to search
 * @param {string} serviceName
 * @param {string} methodName
 * @param {string} rootDir
 * @returns {UsageLocation[]}
 */
function searchForMethod(sourceFiles, serviceName, methodName, rootDir) {
  const usages = [];

  for (const file of sourceFiles) {
    usages.push(...searchFileForMethod(file, serviceName, methodName, rootDir));
  }

  return usages;
}

/**
 * Annotate every endpoint in every parsed API client with its usages.
 *
 * @param {ApiClient[]} apiClients     - Output from `parseApiClients()`
 * @param {string[]}    appDirs        - Application source directories to scan
 * @param {string}      rootDir        - Monorepo root (for relative paths in report)
 * @returns {ApiClientWithUsage[]}
 */
export function findUsages(apiClients, appDirs, rootDir) {
  // Collect source files once across all app dirs
  const sourceFiles = [];
  for (const dir of appDirs) {
    collectSourceFiles(dir, sourceFiles);
  }

  console.log(
    `  Scanning ${sourceFiles.length} source file(s) across ${appDirs.length} app(s)…`,
  );

  return apiClients.map(client => {
    const endpointsWithUsage = client.endpoints.map(ep => {
      const allUsages = searchForMethod(
        sourceFiles,
        ep.serviceName,
        ep.methodName,
        rootDir,
      );

      const liveUsages = allUsages.filter(u => !u.commented);
      const commentedUsages = allUsages.filter(u => u.commented);

      return {
        ...ep,
        usages: liveUsages,
        commentedUsages,
        isUsed: liveUsages.length > 0,
      };
    });

    return { ...client, endpoints: endpointsWithUsage };
  });
}
