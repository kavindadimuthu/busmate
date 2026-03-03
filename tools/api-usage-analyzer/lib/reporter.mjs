/**
 * Report Generator
 *
 * Converts the annotated API-client data (clients + endpoint usages) into
 * structured JSON and human-readable Markdown reports.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure an output directory exists, creating it recursively if needed.
 *
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Compute aggregated statistics across all clients.
 *
 * @param {ApiClientWithUsage[]} clients
 * @returns {SummaryStats}
 */
function computeStats(clients) {
  let totalEndpoints = 0;
  let usedEndpoints = 0;
  let totalUsages = 0;
  let totalCommentedUsages = 0;

  const perClient = clients.map(c => {
    const total = c.endpoints.length;
    const used = c.endpoints.filter(e => e.isUsed).length;
    const usages = c.endpoints.reduce((s, e) => s + e.usages.length, 0);
    const commented = c.endpoints.reduce(
      (s, e) => s + e.commentedUsages.length,
      0,
    );

    totalEndpoints += total;
    usedEndpoints += used;
    totalUsages += usages;
    totalCommentedUsages += commented;

    return {
      clientName: c.clientName,
      packageName: c.packageName,
      totalEndpoints: total,
      usedEndpoints: used,
      unusedEndpoints: total - used,
      usageRate:
        total > 0 ? Math.round((used / total) * 100) : 0,
      totalCallSites: usages,
      commentedCallSites: commented,
    };
  });

  return {
    totalEndpoints,
    usedEndpoints,
    unusedEndpoints: totalEndpoints - usedEndpoints,
    usageRate:
      totalEndpoints > 0
        ? Math.round((usedEndpoints / totalEndpoints) * 100)
        : 0,
    totalCallSites: totalUsages,
    commentedCallSites: totalCommentedUsages,
    perClient,
  };
}

// ─── JSON Report ──────────────────────────────────────────────────────────────

/**
 * Build and write the full JSON report.
 *
 * @param {ApiClientWithUsage[]} clients
 * @param {object} meta   - Metadata from the CLI (analyzedApps, generatedAt, …)
 * @param {string} outDir - Output directory
 * @returns {string} Absolute path of the written file
 */
export function generateJsonReport(clients, meta, outDir) {
  ensureDir(outDir);

  const stats = computeStats(clients);

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      tool: 'busmate/api-usage-analyzer',
      ...meta,
    },
    summary: stats,
    clients: clients.map(c => ({
      clientName: c.clientName,
      packageName: c.packageName,
      stats: stats.perClient.find(p => p.clientName === c.clientName),
      endpoints: c.endpoints.map(e => ({
        serviceName: e.serviceName,
        methodName: e.methodName,
        httpMethod: e.httpMethod,
        url: e.url,
        description: e.description,
        isUsed: e.isUsed,
        callSiteCount: e.usages.length,
        commentedCallSiteCount: e.commentedUsages.length,
        usages: e.usages,
        commentedUsages: e.commentedUsages,
      })),
    })),
  };

  const filePath = join(outDir, 'report.json');
  writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}

// ─── Markdown Report ──────────────────────────────────────────────────────────

const METHOD_BADGE = {
  GET: '`GET`    ',
  POST: '`POST`   ',
  PUT: '`PUT`    ',
  PATCH: '`PATCH`  ',
  DELETE: '`DELETE` ',
  HEAD: '`HEAD`   ',
  OPTIONS: '`OPTIONS`',
  UNKNOWN: '`?`      ',
};

function badge(method) {
  return METHOD_BADGE[method] ?? `\`${method}\``;
}

function usedIcon(ep) {
  if (ep.isUsed) return '✅';
  if (ep.commentedUsages.length > 0) return '⚠️ ';
  return '❌';
}

/**
 * Build and write the Markdown report.
 *
 * @param {ApiClientWithUsage[]} clients
 * @param {object} meta
 * @param {string} outDir
 * @returns {string} Absolute path of the written file
 */
export function generateMarkdownReport(clients, meta, outDir) {
  ensureDir(outDir);

  const stats = computeStats(clients);
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const lines = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push('# API Usage Report');
  lines.push('');
  lines.push(`> Generated: ${ts}`);
  if (meta.analyzedApps?.length) {
    lines.push(`> Apps analyzed: ${meta.analyzedApps.join(', ')}`);
  }
  if (meta.analyzedClients?.length) {
    lines.push(`> Clients analyzed: ${meta.analyzedClients.join(', ')}`);
  }
  lines.push('');

  // ── Overall Summary ───────────────────────────────────────────────────────
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total endpoints | **${stats.totalEndpoints}** |`);
  lines.push(`| Used endpoints | **${stats.usedEndpoints}** |`);
  lines.push(`| Unused endpoints | **${stats.unusedEndpoints}** |`);
  lines.push(`| Usage rate | **${stats.usageRate}%** |`);
  lines.push(`| Total call sites | ${stats.totalCallSites} |`);
  lines.push(`| Commented-out call sites | ${stats.commentedCallSites} |`);
  lines.push('');

  // ── Per-client Summary ────────────────────────────────────────────────────
  lines.push('## Clients at a Glance');
  lines.push('');
  lines.push(
    '| Client | Package | Total | Used | Unused | Rate | Call Sites |',
  );
  lines.push(
    '|--------|---------|------:|-----:|-------:|-----:|-----------:|',
  );
  for (const cs of stats.perClient) {
    lines.push(
      `| ${cs.clientName} | \`${cs.packageName}\` | ${cs.totalEndpoints} | ${cs.usedEndpoints} | ${cs.unusedEndpoints} | ${cs.usageRate}% | ${cs.totalCallSites} |`,
    );
  }
  lines.push('');

  // ── Per-client Detail ─────────────────────────────────────────────────────
  for (const client of clients) {
    const cs = stats.perClient.find(p => p.clientName === client.clientName);
    lines.push(`---`);
    lines.push('');
    lines.push(`## ${client.clientName}`);
    lines.push('');
    lines.push(`**Package:** \`${client.packageName}\``);
    lines.push(
      `**Usage:** ${cs.usedEndpoints}/${cs.totalEndpoints} endpoints used (${cs.usageRate}%)`,
    );
    lines.push('');

    // Unused section first (highest priority for action)
    const unused = client.endpoints.filter(e => !e.isUsed);
    const commentedOnly = unused.filter(e => e.commentedUsages.length > 0);
    const fullyUnused = unused.filter(e => e.commentedUsages.length === 0);

    if (fullyUnused.length > 0) {
      lines.push('### ❌ Unused Endpoints');
      lines.push('');
      lines.push('These endpoints are defined but never called in the analyzed apps.');
      lines.push('');
      lines.push('| | Method | URL | Service | Endpoint |');
      lines.push('|-|--------|-----|---------|----------|');
      for (const ep of fullyUnused) {
        lines.push(
          `| ❌ | ${badge(ep.httpMethod)} | \`${ep.url}\` | ${ep.serviceName} | \`${ep.methodName}\` |`,
        );
      }
      lines.push('');
    }

    if (commentedOnly.length > 0) {
      lines.push('### ⚠️  Commented-Out Endpoints');
      lines.push('');
      lines.push(
        'These endpoints have no live call sites but appear in commented-out code.',
      );
      lines.push('');
      lines.push('| | Method | URL | Service | Endpoint | Commented Sites |');
      lines.push('|-|--------|-----|---------|----------|-----------------|');
      for (const ep of commentedOnly) {
        lines.push(
          `| ⚠️  | ${badge(ep.httpMethod)} | \`${ep.url}\` | ${ep.serviceName} | \`${ep.methodName}\` | ${ep.commentedUsages.length} |`,
        );
      }
      lines.push('');
    }

    // Used endpoints
    const used = client.endpoints.filter(e => e.isUsed);
    if (used.length > 0) {
      lines.push('### ✅ Used Endpoints');
      lines.push('');
      lines.push(
        '| | Method | URL | Service | Endpoint | Call Sites |',
      );
      lines.push(
        '|-|--------|-----|---------|----------|----------:|',
      );
      for (const ep of used) {
        lines.push(
          `| ✅ | ${badge(ep.httpMethod)} | \`${ep.url}\` | ${ep.serviceName} | \`${ep.methodName}\` | ${ep.usages.length} |`,
        );
      }
      lines.push('');
    }

    // Detailed usage locations for used endpoints
    const usedWithDetails = used.filter(e => e.usages.length > 0);
    if (usedWithDetails.length > 0) {
      lines.push('### Call Site Details');
      lines.push('');
      for (const ep of usedWithDetails) {
        lines.push(
          `#### \`${ep.serviceName}.${ep.methodName}\` — ${ep.httpMethod} ${ep.url}`,
        );
        if (ep.description) {
          lines.push('');
          lines.push(`> ${ep.description}`);
        }
        lines.push('');
        for (const u of ep.usages) {
          lines.push(`- \`${u.file}\` line ${u.line}`);
        }
        lines.push('');
      }
    }
  }

  // ── Legend ────────────────────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push('## Legend');
  lines.push('');
  lines.push('| Symbol | Meaning |');
  lines.push('|--------|---------|');
  lines.push('| ✅ | Endpoint has at least one live call site |');
  lines.push('| ⚠️  | Endpoint exists only in commented-out code |');
  lines.push('| ❌ | Endpoint is defined but never referenced |');
  lines.push('');
  lines.push(
    '_Report generated by [busmate/api-usage-analyzer](../../tools/api-usage-analyzer)_',
  );

  const filePath = join(outDir, 'report.md');
  writeFileSync(filePath, lines.join('\n'), 'utf-8');
  return filePath;
}
