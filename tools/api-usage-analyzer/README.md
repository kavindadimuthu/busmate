# API Usage Analyzer

An internal developer tool that identifies which API endpoints (defined in the
shared `libs/api-clients/` libraries) are actually being called across frontend
applications, and which are unused.

## Why

API clients are the single source of truth for what the backend exposes to the
frontend. Tracking usage at this layer is far more reliable than grepping raw
HTTP strings across the codebase.  By running this tool you can:

- Spot endpoints that can safely be removed from both the client lib and the backend.
- Find endpoints that exist in commented-out code (candidates for removal or cleanup).
- Understand which parts of the API a specific application depends on.

## Directory Structure

```
tools/api-usage-analyzer/
├── analyzer.mjs        # CLI entry point
├── lib/
│   ├── parser.mjs      # Parses API client service files
│   ├── searcher.mjs    # Searches for method call sites
│   └── reporter.mjs    # Generates JSON + Markdown reports
├── viewer/
│   └── index.html      # Interactive web viewer
└── README.md           # This file

reports/api-usage/      # Generated reports (gitignored output)
├── report.json
└── report.md
```

## Requirements

- Node.js ≥ 20 (no external npm dependencies)

## Usage

Run from the **monorepo root**:

```bash
# Analyze all clients against all frontend apps (default)
node tools/api-usage-analyzer/analyzer.mjs

# Analyze a specific API client only
node tools/api-usage-analyzer/analyzer.mjs \
  --client libs/api-clients/route-management

# Analyze against a specific app
node tools/api-usage-analyzer/analyzer.mjs \
  --app apps/frontend/management-portal

# Multiple clients and apps, Markdown only
node tools/api-usage-analyzer/analyzer.mjs \
  --client libs/api-clients/route-management \
  --client libs/api-clients/ticketing-management \
  --app apps/frontend/management-portal \
  --app apps/frontend/passenger-web \
  --format markdown

# Full options
node tools/api-usage-analyzer/analyzer.mjs --help
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--client <path>` | auto-discover from `libs/api-clients/` | API client dir (repeatable) |
| `--app <path>` | `apps/frontend/` | App dir to scan (repeatable) |
| `--output <path>` | `reports/api-usage/` | Report output directory |
| `--format <fmt>` | `all` | `json` \| `markdown` \| `all` |
| `--root <path>` | `process.cwd()` | Monorepo root |

## Output

### `report.json`

Machine-readable structured report. Schema:

```
{
  meta:    { generatedAt, tool, analyzedClients, analyzedApps }
  summary: { totalEndpoints, usedEndpoints, unusedEndpoints, usageRate,
             totalCallSites, commentedCallSites, perClient[] }
  clients: [
    {
      clientName, packageName,
      endpoints: [
        {
          serviceName, methodName, httpMethod, url, description,
          isUsed,
          callSiteCount, commentedCallSiteCount,
          usages:          [{ file, line, column, snippet, commented }]
          commentedUsages: [{ file, line, column, snippet, commented }]
        }
      ]
    }
  ]
}
```

### `report.md`

Human-readable Markdown with:
- Overall summary table
- Per-client breakdown
- ❌ Unused endpoints table
- ⚠️ Commented-out endpoints table
- ✅ Used endpoints table with call-site details

## Web Viewer

Open `tools/api-usage-analyzer/viewer/index.html` in a browser, then click
**Load Report JSON** and select `reports/api-usage/report.json`.

The viewer provides:
- Summary stats and usage rate bar
- Per-client tabs
- Filter by status (used / commented / unused) and HTTP method
- Full-text search across service name, method name, and URL
- Expandable endpoint cards showing all call site locations

> **Tip:** When served via a local HTTP server from the repo root, the viewer
> automatically loads `reports/api-usage/report.json` without requiring a
> manual file pick.

## How It Works

1. **Parser** — Scans `src/services/*.ts` files in each API client.  For each
   `public static` method it extracts the method name, HTTP verb, URL pattern,
   and JSDoc description using targeted regex on the well-structured generated
   code.

2. **Searcher** — Recursively walks every `.ts`, `.tsx`, `.js`, `.jsx` source
   file in the target app directories (skipping `node_modules`, `dist`,
   `.next`, etc.).  For each endpoint it searches for the pattern
   `ServiceName.methodName(`, distinguishing live calls from commented-out
   ones.

3. **Reporter** — Aggregates the results into structured JSON and Markdown
   files written to `reports/api-usage/`.

## Interpreting Results

| Symbol | Meaning | Recommended action |
|--------|---------|--------------------|
| ✅ Used | Endpoint has ≥ 1 live call site | Keep as-is |
| ⚠️ Commented | Only appears in commented-out code | Decide: restore or delete |
| ❌ Unused | No references found in scanned apps | Consider removing from client + backend |

> **Note:** "Unused" means the endpoint is not called in the _scanned_
> applications.  If you scope the scan to a single app, an endpoint used only
> in another app will appear unused.  Always analyze `--app` scope carefully.
