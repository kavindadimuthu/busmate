#!/usr/bin/env node

/**
 * API Client Analyzer
 *
 * Analyzes generated OpenAPI client service files and produces markdown reports
 * detailing which endpoints are defined, which are used across the codebase,
 * and which remain unused.
 *
 * Usage:
 *   node scripts/analyze-api-client.js <api-client-path> [options]
 *
 * See README-analyze-api-client.md for full documentation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── CLI argument parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const apiClientArg = args.find((a) => !a.startsWith('-'));

if (!apiClientArg) {
  console.error(
    '❌  Error: API client path is required.\n' +
      '   Usage: node scripts/analyze-api-client.js <api-client-path> [options]\n' +
      '   Run with --help for more information.'
  );
  process.exit(1);
}

const options = {
  /** Root of the project — defaults to the parent of scripts/ */
  projectRoot: path.resolve(__dirname, '..'),
  /** Path to the api-client to analyse (resolved below) */
  apiClientPath: '',
  /** Directories (relative to projectRoot) to search for usages */
  searchDirs: getOption(args, '--search-dirs', 'src').split(','),
  /** File extensions to search for usages */
  extensions: getOption(args, '--extensions', '.ts,.tsx,.js,.jsx').split(','),
  /** Output directory for markdown reports */
  outputDir: getOption(args, '--output', 'reports/api-client-analysis'),
  /** Suppress console output */
  quiet: args.includes('--quiet') || args.includes('-q'),
  /** Print report to stdout instead of saving files */
  stdout: args.includes('--stdout'),
};

// Resolve the api-client path — support both absolute and relative (from cwd)
options.apiClientPath = path.isAbsolute(apiClientArg)
  ? apiClientArg
  : path.resolve(process.cwd(), apiClientArg);

if (!fs.existsSync(options.apiClientPath)) {
  console.error(`❌  Error: API client directory not found: ${options.apiClientPath}`);
  process.exit(1);
}

// ─── ANSI colour helpers ──────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const log = (...msg) => !options.quiet && console.log(...msg);

// ─── Step 1 – Parse service files ────────────────────────────────────────────

const servicesDir = path.join(options.apiClientPath, 'services');

if (!fs.existsSync(servicesDir)) {
  console.error(
    `❌  Error: No "services" directory found inside ${options.apiClientPath}`
  );
  process.exit(1);
}

log(`\n${c.bold}${c.cyan}API Client Analyzer${c.reset}`);
log(`${c.gray}${'─'.repeat(60)}${c.reset}`);
log(`${c.gray}Client :${c.reset} ${options.apiClientPath}`);
log(
  `${c.gray}Search :${c.reset} ${options.searchDirs
    .map((d) => path.join(options.projectRoot, d))
    .join(', ')}`
);
log(`${c.gray}Output :${c.reset} ${path.join(options.projectRoot, options.outputDir)}`);
log(`${c.gray}${'─'.repeat(60)}${c.reset}\n`);

/**
 * @typedef {Object} Endpoint
 * @property {string} service       - Service class name
 * @property {string} serviceFile   - Filename of the service
 * @property {string} method        - TypeScript method name
 * @property {string} httpMethod    - HTTP verb (GET, POST, …)
 * @property {string} urlPath       - API URL path
 * @property {Usage[]} usages       - Locations where the method is called
 */

/**
 * @typedef {Object} Usage
 * @property {string} file    - Relative path to the file containing the call
 * @property {number} line    - 1-based line number
 * @property {string} snippet - The actual line content (trimmed)
 */

/** @type {Endpoint[]} */
const endpoints = [];

const serviceFiles = fs
  .readdirSync(servicesDir)
  .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

log(`${c.bold}Parsing service files…${c.reset}`);

for (const file of serviceFiles) {
  const filePath = path.join(servicesDir, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');

  // Derive service class name from file name (e.g. BusManagementService.ts)
  const serviceName = file.replace(/\.(ts|js)$/, '');

  // We walk line-by-line and build a lightweight state machine:
  //   • When we see `public static <methodName>`, capture it
  //   • Scan forward for the first `method:` and `url:` values
  //   • Stop scanning when we hit the next `public static` or end-of-function

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const methodMatch = line.match(/public static (\w+)\s*[(<]/);

    if (methodMatch) {
      const methodName = methodMatch[1];
      let httpMethod = '';
      let urlPath = '';

      // Scan up to 40 lines ahead for method/url inside the __request block
      const scanLimit = Math.min(i + 40, lines.length);
      for (let j = i + 1; j < scanLimit; j++) {
        const scanLine = lines[j];

        // Stop if we hit the next public static (found nothing useful)
        if (/public static/.test(scanLine) && j !== i) break;

        if (!httpMethod) {
          const mMatch = scanLine.match(/method:\s*['"]([A-Z]+)['"]/);
          if (mMatch) httpMethod = mMatch[1];
        }

        if (!urlPath) {
          const uMatch = scanLine.match(/url:\s*['"]([^'"]+)['"]/);
          if (uMatch) urlPath = uMatch[1];
        }

        if (httpMethod && urlPath) break;
      }

      endpoints.push({
        service: serviceName,
        serviceFile: file,
        method: methodName,
        httpMethod: httpMethod || 'UNKNOWN',
        urlPath: urlPath || 'UNKNOWN',
        usages: [],
      });
    }

    i++;
  }

  log(`  ${c.green}✓${c.reset}  ${file} — ${
    endpoints.filter((e) => e.serviceFile === file).length
  } endpoints`);
}

log(`\n  ${c.bold}Total endpoints defined: ${endpoints.length}${c.reset}\n`);

// ─── Step 2 – Search codebase for usages ─────────────────────────────────────

log(`${c.bold}Scanning codebase for endpoint usages…${c.reset}`);

/**
 * Recursively collect all files matching the given extensions inside `dir`.
 * @param {string} dir
 * @param {string[]} exts
 * @returns {string[]}
 */
function collectFiles(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and generated clients themselves to avoid false pos.
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      results.push(...collectFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// Collect source files (excluding the api-client itself to avoid self-matches)
const sourceFiles = [];
for (const dir of options.searchDirs) {
  const absDir = path.join(options.projectRoot, dir);
  sourceFiles.push(...collectFiles(absDir, options.extensions));
}

// Filter out files that are inside the api-client itself
const clientAbsPath = path.resolve(options.apiClientPath);
const filteredSourceFiles = sourceFiles.filter(
  (f) => !path.resolve(f).startsWith(clientAbsPath)
);

log(`  Searching in ${filteredSourceFiles.length} source files…`);

// Build a lookup: serviceName → list of methods for quick matching
// We build one combined regex per service for efficiency
for (const file of filteredSourceFiles) {
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = source.split('\n');
  const relFile = path.relative(options.projectRoot, file);

  for (const endpoint of endpoints) {
    // Pattern: ServiceClassName.methodName( — covers any whitespace variants
    // We allow the service to be imported under a different name via aliasing
    // by also checking for a bare `methodName(` when the service is imported.
    // Primary pattern covers the explicit ServiceName.method() call.
    const pattern = new RegExp(
      `(?:${escapeRegex(endpoint.service)}\\.)?\\b${escapeRegex(endpoint.method)}\\s*\\(`,
      'g'
    );

    // Only flag if the file actually imports or references the service
    // to reduce false positives from method name collisions.
    const serviceReferenced =
      source.includes(endpoint.service) ||
      source.includes(`'${endpoint.method}'`) ||
      source.includes(`"${endpoint.method}"`);

    if (!serviceReferenced) continue;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];
      if (pattern.test(lineText)) {
        // Reset lastIndex after global regex use
        pattern.lastIndex = 0;
        endpoint.usages.push({
          file: relFile,
          line: lineIdx + 1,
          snippet: lineText.trim(),
        });
      }
      pattern.lastIndex = 0;
    }
  }
}

const usedEndpoints = endpoints.filter((e) => e.usages.length > 0);
const unusedEndpoints = endpoints.filter((e) => e.usages.length === 0);

log(`\n  ${c.green}Used endpoints  : ${usedEndpoints.length}${c.reset}`);
log(`  ${c.yellow}Unused endpoints: ${unusedEndpoints.length}${c.reset}`);
log(`  ${c.bold}Total           : ${endpoints.length}${c.reset}\n`);

// ─── Step 3 – Generate markdown reports ──────────────────────────────────────

log(`${c.bold}Generating markdown reports…${c.reset}`);

const timestamp = new Date().toISOString();
const clientName = path.basename(options.apiClientPath);

// Group endpoints by service for display
function groupByService(eps) {
  return eps.reduce((acc, ep) => {
    if (!acc[ep.service]) acc[ep.service] = [];
    acc[ep.service].push(ep);
    return acc;
  }, {});
}

/**
 * ── Report 1: Summary ──────────────────────────────────────────────────────
 */
function buildSummaryReport() {
  const byService = groupByService(endpoints);
  const lines = [];

  lines.push(`# API Client Analysis — \`${clientName}\``);
  lines.push('');
  lines.push(`> **Generated:** ${timestamp}  `);
  lines.push(`> **Client path:** \`${options.apiClientPath}\``);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|--------|------:|');
  lines.push(`| Total endpoints defined | **${endpoints.length}** |`);
  lines.push(`| Endpoints used in codebase | **${usedEndpoints.length}** |`);
  lines.push(`| Unused endpoints | **${unusedEndpoints.length}** |`);
  lines.push(
    `| Usage coverage | **${((usedEndpoints.length / endpoints.length) * 100).toFixed(1)}%** |`
  );
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Endpoints per Service');
  lines.push('');
  lines.push('| Service | Total | Used | Unused |');
  lines.push('|---------|------:|-----:|-------:|');

  for (const [svc, eps] of Object.entries(byService)) {
    const used = eps.filter((e) => e.usages.length > 0).length;
    const unused = eps.length - used;
    lines.push(`| \`${svc}\` | ${eps.length} | ${used} | ${unused} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## All Defined Endpoints');
  lines.push('');
  lines.push('| # | Service | Method | HTTP | URL Path | Status |');
  lines.push('|---|---------|--------|------|----------|--------|');

  let idx = 1;
  for (const ep of endpoints) {
    const status = ep.usages.length > 0 ? '✅ Used' : '⚠️ Unused';
    lines.push(
      `| ${idx++} | \`${ep.service}\` | \`${ep.method}\` | \`${ep.httpMethod}\` | \`${ep.urlPath}\` | ${status} |`
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(
    '_See [used-endpoints.md](used-endpoints.md) and [unused-endpoints.md](unused-endpoints.md) for detailed breakdowns._'
  );
  lines.push('');

  return lines.join('\n');
}

/**
 * ── Report 2: Used Endpoints ───────────────────────────────────────────────
 */
function buildUsedReport() {
  const byService = groupByService(usedEndpoints);
  const lines = [];

  lines.push(`# Used Endpoints — \`${clientName}\``);
  lines.push('');
  lines.push(`> **Generated:** ${timestamp}  `);
  lines.push(
    `> ${usedEndpoints.length} of ${endpoints.length} endpoints are actively used in the codebase.`
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  if (usedEndpoints.length === 0) {
    lines.push('_No endpoints are currently used in the codebase._');
    return lines.join('\n');
  }

  for (const [svc, eps] of Object.entries(byService)) {
    lines.push(`## ${svc}`);
    lines.push('');

    for (const ep of eps) {
      lines.push(`### \`${ep.method}\``);
      lines.push('');
      lines.push(`- **HTTP Method:** \`${ep.httpMethod}\``);
      lines.push(`- **URL Path:** \`${ep.urlPath}\``);
      lines.push(`- **Usage count:** ${ep.usages.length}`);
      lines.push('');
      lines.push('**Usage locations:**');
      lines.push('');

      // Deduplicate by file, showing all line refs per file
      const byFile = ep.usages.reduce((acc, u) => {
        if (!acc[u.file]) acc[u.file] = [];
        acc[u.file].push(u);
        return acc;
      }, {});

      for (const [file, usages] of Object.entries(byFile)) {
        lines.push(`- **\`${file}\`**`);
        for (const u of usages) {
          lines.push(`  - Line ${u.line}: \`${u.snippet}\``);
        }
      }

      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * ── Report 3: Unused Endpoints ────────────────────────────────────────────
 */
function buildUnusedReport() {
  const byService = groupByService(unusedEndpoints);
  const lines = [];

  lines.push(`# Unused Endpoints — \`${clientName}\``);
  lines.push('');
  lines.push(`> **Generated:** ${timestamp}  `);
  lines.push(
    `> ${unusedEndpoints.length} of ${endpoints.length} endpoints are **not used** anywhere in the codebase.`
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  if (unusedEndpoints.length === 0) {
    lines.push('✅ _All defined endpoints are used somewhere in the codebase._');
    return lines.join('\n');
  }

  lines.push('## Summary Table');
  lines.push('');
  lines.push('| # | Service | Method | HTTP | URL Path |');
  lines.push('|---|---------|--------|------|----------|');

  let idx = 1;
  for (const ep of unusedEndpoints) {
    lines.push(
      `| ${idx++} | \`${ep.service}\` | \`${ep.method}\` | \`${ep.httpMethod}\` | \`${ep.urlPath}\` |`
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Detailed Breakdown by Service');
  lines.push('');

  for (const [svc, eps] of Object.entries(byService)) {
    lines.push(`### ${svc}`);
    lines.push('');
    lines.push('| Method | HTTP | URL Path |');
    lines.push('|--------|------|----------|');
    for (const ep of eps) {
      lines.push(`| \`${ep.method}\` | \`${ep.httpMethod}\` | \`${ep.urlPath}\` |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Step 4 – Write / print output ───────────────────────────────────────────

const summaryMd = buildSummaryReport();
const usedMd = buildUsedReport();
const unusedMd = buildUnusedReport();

if (options.stdout) {
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(summaryMd);
  console.log('\n' + '='.repeat(60));
  console.log('USED ENDPOINTS');
  console.log('='.repeat(60));
  console.log(usedMd);
  console.log('\n' + '='.repeat(60));
  console.log('UNUSED ENDPOINTS');
  console.log('='.repeat(60));
  console.log(unusedMd);
} else {
  const outDir = path.join(options.projectRoot, options.outputDir);
  // Create a sub-folder named after the client for easy multi-client runs
  const clientOutDir = path.join(outDir, clientName);
  fs.mkdirSync(clientOutDir, { recursive: true });

  const files = [
    ['summary.md', summaryMd],
    ['used-endpoints.md', usedMd],
    ['unused-endpoints.md', unusedMd],
  ];

  for (const [name, content] of files) {
    const filePath = path.join(clientOutDir, name);
    fs.writeFileSync(filePath, content, 'utf8');
    log(
      `  ${c.green}✓${c.reset}  ${c.bold}${name}${c.reset} → ${path.relative(
        options.projectRoot,
        filePath
      )}`
    );
  }

  log(
    `\n${c.green}${c.bold}Done!${c.reset} Reports saved to ${c.cyan}${path.relative(
      options.projectRoot,
      clientOutDir
    )}/${c.reset}\n`
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getOption(argsList, flag, defaultVal) {
  const entry = argsList.find((a) => a.startsWith(`${flag}=`));
  return entry ? entry.split('=').slice(1).join('=') : defaultVal;
}

function printHelp() {
  console.log(`
${c.bold}${c.cyan}API Client Analyzer${c.reset}
Analyzes generated OpenAPI client service files and produces markdown reports.

${c.bold}Usage:${c.reset}
  node scripts/analyze-api-client.js <api-client-path> [options]

${c.bold}Arguments:${c.reset}
  <api-client-path>   Path to the generated API client directory.
                      Can be absolute or relative to the current working directory.
                      The directory must contain a "services/" sub-folder.

${c.bold}Options:${c.reset}
  --search-dirs=<dirs>  Comma-separated list of directories (relative to project
                        root) to search for endpoint usages.
                        Default: src

  --extensions=<exts>   Comma-separated list of file extensions to search.
                        Default: .ts,.tsx,.js,.jsx

  --output=<dir>        Output directory for markdown reports (relative to project
                        root). A sub-folder named after the client is created
                        inside this directory.
                        Default: reports/api-client-analysis

  --stdout              Print reports to stdout instead of saving to files.

  --quiet, -q           Suppress console progress output.

  --help, -h            Show this help message.

${c.bold}Examples:${c.reset}
  # Analyse the route-management client
  node scripts/analyze-api-client.js generated/api-clients/route-management

  # Analyse from an absolute path, save to a custom output folder
  node scripts/analyze-api-client.js /path/to/api-client --output=reports/my-analysis

  # Print results to stdout without saving
  node scripts/analyze-api-client.js generated/api-clients/route-management --stdout --quiet

  # Search additional directories (e.g. also search pages/)
  node scripts/analyze-api-client.js generated/api-clients/route-management --search-dirs=src,pages
`);
}
