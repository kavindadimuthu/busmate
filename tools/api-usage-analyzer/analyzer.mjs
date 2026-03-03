#!/usr/bin/env node
/**
 * BusMate API Usage Analyzer
 *
 * Analyzes API client libraries to identify which endpoints are actively used
 * across the application codebase, producing structured JSON and Markdown reports.
 *
 * Usage:
 *   node tools/api-usage-analyzer/analyzer.mjs [options]
 *
 * Run with --help for full usage information.
 */

import { resolve, join, relative } from 'path';
import { existsSync } from 'fs';

import { discoverApiClients, parseApiClients } from './lib/parser.mjs';
import { findUsages } from './lib/searcher.mjs';
import { generateJsonReport, generateMarkdownReport } from './lib/reporter.mjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.0.0';
const TOOL_NAME = 'busmate/api-usage-analyzer';

const DEFAULT_CLIENTS_DIR = 'libs/api-clients';
const DEFAULT_APPS_DIR = 'apps/frontend';
const DEFAULT_OUTPUT_DIR = 'reports/api-usage';
const DEFAULT_FORMAT = 'all';

const HELP_TEXT = `
${TOOL_NAME} v${VERSION}
Analyze API client usage across the monorepo.

USAGE
  node tools/api-usage-analyzer/analyzer.mjs [options]

OPTIONS
  --client <path>      Path to an API client directory (relative to --root).
                       Can be specified multiple times.
                       Default: auto-discovers all clients in ${DEFAULT_CLIENTS_DIR}/

  --app <path>         Path to an application directory to search (relative to --root).
                       Can be specified multiple times.
                       Default: ${DEFAULT_APPS_DIR}/

  --output <path>      Output directory for reports (relative to --root).
                       Default: ${DEFAULT_OUTPUT_DIR}/

  --format <fmt>       Output format: json | markdown | all
                       Default: ${DEFAULT_FORMAT}

  --root <path>        Monorepo root directory.
                       Default: current working directory (${process.cwd()})

  --help, -h           Show this help message.
  --version, -v        Print version.

EXAMPLES
  # Analyze all clients against all frontend apps (default)
  node tools/api-usage-analyzer/analyzer.mjs

  # Analyze a specific client only
  node tools/api-usage-analyzer/analyzer.mjs \\
    --client libs/api-clients/route-management

  # Analyze against a specific app
  node tools/api-usage-analyzer/analyzer.mjs \\
    --app apps/frontend/management-portal

  # Multiple clients + apps, custom output
  node tools/api-usage-analyzer/analyzer.mjs \\
    --client libs/api-clients/route-management \\
    --client libs/api-clients/ticketing-management \\
    --app apps/frontend/management-portal \\
    --app apps/frontend/passenger-web \\
    --output reports/api-usage \\
    --format all
`.trim();

// ─── Argument Parsing ─────────────────────────────────────────────────────────

/**
 * Minimalist arg parser (no external dependencies).
 *
 * @param {string[]} argv
 * @returns {{ clients: string[], apps: string[], output: string, format: string, root: string }}
 */
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    clients: [],
    apps: [],
    output: DEFAULT_OUTPUT_DIR,
    format: DEFAULT_FORMAT,
    root: process.cwd(),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        console.log(HELP_TEXT);
        process.exit(0);
        break;
      case '--version':
      case '-v':
        console.log(`${TOOL_NAME} v${VERSION}`);
        process.exit(0);
        break;
      case '--client':
        opts.clients.push(args[++i]);
        break;
      case '--app':
        opts.apps.push(args[++i]);
        break;
      case '--output':
        opts.output = args[++i];
        break;
      case '--format':
        opts.format = args[++i];
        break;
      case '--root':
        opts.root = args[++i];
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}. Run with --help for usage.`);
          process.exit(1);
        }
    }
  }

  return opts;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  const rootDir = resolve(opts.root);

  // Validate format
  if (!['json', 'markdown', 'all'].includes(opts.format)) {
    console.error(
      `Invalid --format "${opts.format}". Must be one of: json, markdown, all`,
    );
    process.exit(1);
  }

  console.log(`\n${TOOL_NAME} v${VERSION}`);
  console.log('─'.repeat(50));
  console.log(`Root: ${rootDir}`);

  // ── Resolve API client directories ────────────────────────────────────────

  let clientDirs;

  if (opts.clients.length > 0) {
    clientDirs = opts.clients.map(c => resolve(rootDir, c));
  } else {
    const defaultClientsRoot = join(rootDir, DEFAULT_CLIENTS_DIR);
    console.log(`\nAuto-discovering API clients in: ${relative(rootDir, defaultClientsRoot)}/`);
    clientDirs = discoverApiClients(defaultClientsRoot);
  }

  if (clientDirs.length === 0) {
    console.error(
      '\nNo API client directories found. Use --client to specify paths manually.',
    );
    process.exit(1);
  }

  // Validate each client dir
  for (const dir of clientDirs) {
    if (!existsSync(dir)) {
      console.error(`API client directory not found: ${dir}`);
      process.exit(1);
    }
  }

  console.log(`\nAPI clients (${clientDirs.length}):`);
  clientDirs.forEach(d => console.log(`  • ${relative(rootDir, d)}`));

  // ── Resolve application directories ───────────────────────────────────────

  let appDirs;

  if (opts.apps.length > 0) {
    appDirs = opts.apps.map(a => resolve(rootDir, a));
  } else {
    appDirs = [join(rootDir, DEFAULT_APPS_DIR)];
  }

  console.log(`\nApplication directories (${appDirs.length}):`);
  appDirs.forEach(d => console.log(`  • ${relative(rootDir, d)}`));

  // ── Parse API clients ──────────────────────────────────────────────────────

  console.log('\nParsing API clients…');
  const tsconfigBasePath = join(rootDir, 'tsconfig.base.json');
  const clients = parseApiClients(clientDirs, { tsconfigBasePath });

  const totalEndpoints = clients.reduce((s, c) => s + c.endpoints.length, 0);
  console.log(
    `  Found ${totalEndpoints} endpoint(s) across ${clients.length} client(s).`,
  );

  if (totalEndpoints === 0) {
    console.warn(
      '\nWarning: No endpoints were parsed. Check that the client directories contain service files.',
    );
  }

  // ── Search for usages ──────────────────────────────────────────────────────

  console.log('\nSearching for usages…');
  const clientsWithUsage = findUsages(clients, appDirs, rootDir);

  // ── Compute and print a quick summary ─────────────────────────────────────

  const used = clientsWithUsage.flatMap(c => c.endpoints).filter(e => e.isUsed);
  const unused = clientsWithUsage
    .flatMap(c => c.endpoints)
    .filter(e => !e.isUsed);
  const commentedOnly = unused.filter(e => e.commentedUsages.length > 0);
  const fullyUnused = unused.filter(e => e.commentedUsages.length === 0);

  console.log('\nResults:');
  console.log(`  ✅  Used         : ${used.length}`);
  console.log(`  ⚠️   Commented    : ${commentedOnly.length}`);
  console.log(`  ❌  Unused        : ${fullyUnused.length}`);
  console.log(
    `  %   Usage rate   : ${totalEndpoints > 0 ? Math.round((used.length / totalEndpoints) * 100) : 0}%`,
  );

  // ── Generate reports ───────────────────────────────────────────────────────

  const outputDir = resolve(rootDir, opts.output);
  const meta = {
    analyzedClients: clients.map(c => c.packageName),
    analyzedApps: appDirs.map(d => relative(rootDir, d)),
  };

  const written = [];

  if (opts.format === 'json' || opts.format === 'all') {
    const path = generateJsonReport(clientsWithUsage, meta, outputDir);
    written.push(relative(rootDir, path));
  }

  if (opts.format === 'markdown' || opts.format === 'all') {
    const path = generateMarkdownReport(clientsWithUsage, meta, outputDir);
    written.push(relative(rootDir, path));
  }

  console.log('\nReports written:');
  written.forEach(f => console.log(`  📄  ${f}`));

  console.log(
    `\nTip: Open the web viewer for an interactive view:\n` +
      `  tools/api-usage-analyzer/viewer/index.html\n`,
  );
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
