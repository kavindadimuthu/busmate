# BusMate Observability (Phase 1 + 2 + 3 + 4 + 5 + 6)

Structured logging with correlation IDs (Phase 1), centralised log aggregation via the
Grafana + Loki stack (Phase 2), metrics via Prometheus + Grafana (Phase 3), alerting +
uptime monitoring (Phase 4), frontend/mobile error tracking via Sentry (Phase 5), and
distributed tracing via OpenTelemetry + Tempo (Phase 6). See
[`docs/plans/Logging-and-Monitoring-Implementation-Plan.md`](../../docs/plans/Logging-and-Monitoring-Implementation-Plan.md)
for the full roadmap and [`RUNBOOK.md`](RUNBOOK.md) for what to do when an alert fires.

## What's here

| Path | Purpose |
|---|---|
| `loki/loki-config.yml` | Single-binary Loki, filesystem storage, 14-day retention (dev) |
| `loki/loki-config.production.yml` | Same, 7-day retention — the disk is shared with Postgres and MinIO in production |
| `alloy/config.alloy` | Grafana Alloy — discovers the app stack's containers (Compose project `busmate` exactly) via the Docker socket, parses JSON logs, ships to Loki |
| `prometheus/prometheus.yml` | Prometheus scrape config (dev) — the 4 app services by `host.docker.internal` + cAdvisor + node-exporter |
| `prometheus/prometheus.production.yml` | Same, by Compose service name over `busmate_default`, no `telemetry-service` (not deployed — INC-032) |
| `blackbox/blackbox.yml` | Probe modules for Postgres/MinIO (production only — INC-036); neither has its own `/metrics` |
| `tempo/tempo-config.yml` | Single-binary Tempo, filesystem storage, 3-day retention, OTLP receiver (dev only — ADR-021) |
| `grafana/provisioning/datasources/` | Auto-provisioned Prometheus + Loki + Tempo datasources (dev; with trace<->log linking) |
| `grafana/provisioning-production/datasources/` | Same, minus Tempo (production — INC-035) |
| `grafana/provisioning/dashboards/` | Dashboard provider config |
| `grafana/provisioning/alerting/` | Alert rules, contact point, and severity-split notification policy — all as code |
| `grafana/dashboards/busmate-logs.json` | "BusMate — Logs" (volume-by-level, error rate, searchable log stream) |
| `grafana/dashboards/busmate-services.json` | "BusMate — Spring Services (RED + JVM)" (rate/errors/p95, heap, GC, threads, Hikari) |
| `grafana/dashboards/busmate-infra.json` | "BusMate — Gateway & Infrastructure" (gateway RED, Node event loop, container + host CPU/mem) |
| `RUNBOOK.md` | What each alert means and how to respond |

## Ports

| Service | URL |
|---|---|
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 (targets: `/targets`) |
| Loki | http://localhost:3100 |
| Tempo | http://localhost:3200 (query API; browse traces via Grafana, not directly) |
| Alloy UI | http://localhost:12345 |
| Uptime Kuma | http://localhost:3001 |

## Metrics endpoints scraped

| Service | Path |
|---|---|
| api-gateway | `:8080/metrics` (prom-client — RED + Node runtime) |
| core / user / ticketing | `:9010|9020|9030/actuator/prometheus` (Micrometer — RED + JVM + Hikari) |

## Running it

```bash
# 1. Start the app stack (services log JSON in the prod/e2e profiles):
docker compose up -d --build

# 2. Start the observability stack alongside it:
docker compose -f docker-compose.observability.yml up -d

# 3. Open Grafana → Dashboards → BusMate → "BusMate — Logs"
open http://localhost:3000        # login: admin / admin (override GRAFANA_ADMIN_PASSWORD)
```

Alloy collects logs through the Docker API (not the network), so the two Compose stacks
don't need a shared network — it picks up any container whose Compose project starts with
`busmate`.

## Correlation IDs

Every request carries an `X-Request-Id`:

- the **api-gateway** generates one (or reuses an inbound one), echoes it on the response,
  and forwards it downstream;
- each **Spring service** picks it up into the SLF4J MDC (`RequestIdFilter`), so every log
  line for that request includes `requestId`;
- **Kafka** producers stamp it as a message header (`KafkaCorrelation`) for the async hop.

To trace one request end-to-end in Grafana Explore:

```logql
{job="docker"} | json | requestId = "<the-id>"
```

`requestId` is kept as a searchable field, **not** a Loki label, to avoid cardinality blow-up.

## Log format by environment

| Environment | Format | Parsed labels |
|---|---|---|
| Spring `prod` / `e2e`, gateway `NODE_ENV=production` | JSON (one line/event) | `service`, `level` |
| Spring `dev`, gateway dev | Pretty-printed text | none (lines still appear, unlabeled) |

## Running it in production (INC-035, INC-036, INC-037, ADR-021)

Production is a **separate, standalone compose file** —
[`docker-compose.observability.production.yml`](../../docker-compose.observability.production.yml)
at the repo root, not a tweak of the dev one described above. The differences, and why:

- **No Tempo.** Tracing stays a development tool (ADR-021); the production Spring services
  already run with `OTEL_SDK_DISABLED=true`.
- **Prometheus reaches the app services by Compose service name**, not `host.docker.internal`:
  production (`docker-compose.production.yml`) publishes only api-gateway's port to the host,
  so Prometheus instead joins the app stack's `busmate_default` network and scrapes
  `api-gateway:8080`, `core-service:9010`, `user-service:9020`, `ticketing-service:9030` —
  see [`prometheus/prometheus.production.yml`](prometheus/prometheus.production.yml).
  `telemetry-service` is not scraped; production doesn't deploy it (INC-032). Postgres and
  MinIO — neither has a `/metrics` endpoint — are probed via `blackbox-exporter` instead (see
  "Probing Postgres and MinIO" below).
- **Retention is capped by size as well as time.** The disk is shared with Postgres and MinIO,
  and filling it takes the database down, not just the dashboards. Prometheus gets
  `--storage.tsdb.retention.size=3GB` alongside its time limit; Loki's window drops from dev's
  14 days to 7 (`loki/loki-config.production.yml`).
- **Every UI binds to `127.0.0.1` only.** Reach one over an SSH tunnel, e.g.
  `ssh -L 3000:localhost:3000 -p 22022 deploy@<host>` for Grafana — never publish one through
  Caddy.
- **Grafana requires real secrets.** `GRAFANA_ADMIN_PASSWORD` and `ALERT_WEBHOOK_URL` must be
  set in `config/secrets/.env` — there is no `admin`/`admin` fallback and no silently-undelivered
  alert default in production, unlike the dev file.
- **`node-exporter` reads a backup-status textfile.** `./backup-metrics/backup.prom` (INC-037,
  `scripts/backup/README.md`), written by the host's own `busmate-backup.service` — the backup
  job itself is a systemd timer, not part of this compose file at all.

Bring it up alongside the app stack, from the repo root:

```bash
docker compose --env-file config/secrets/.env \
  -f docker-compose.observability.production.yml up -d
```

## Alerting (Phase 4, extended in INC-036 and INC-037)

Ten alert rules are provisioned as code in `grafana/provisioning/alerting/rules.yaml` (view
them live under Alerting → Alert rules): service down (now covering Postgres and MinIO too, via
`blackbox-exporter` — neither exposes its own metrics endpoint), a container restart loop,
gateway/Spring 5xx rate, gateway p95 latency, JVM heap near capacity, host memory low, host disk
low, a stale backup (INC-037 — see `scripts/backup/README.md`), and an error-log spike. See
`RUNBOOK.md` for what each one means and how to respond.

They all route to one **Discord contact point** (`busmate-discord`,
`grafana/provisioning/alerting/contactpoints.yaml`) pointed at the `ALERT_WEBHOOK_URL` env var,
with severity-split routing in `policies.yaml` — a critical groups and repeats far more
aggressively than a warning, even sharing the one channel (see `RUNBOOK.md`'s "Routing"
section). By default `ALERT_WEBHOOK_URL` is `http://localhost:9999/configure-me` — nothing
listens there, so alerts still fire/resolve correctly and are visible in Grafana's Alerting UI,
but outbound delivery will fail (harmlessly logged in `docker logs busmate-grafana`) until you
set a real URL.

**To wire up real delivery:**

1. **Discord**: channel settings → Integrations → Webhooks → **Copy Webhook URL**. Use it
   exactly as copied — do **not** append `/slack`; that suffix is only for the generic
   `type: webhook` contact point, not this one.
2. Add it to `config/secrets/.env`:
   ```
   ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```
3. Recreate Grafana so it picks up the new env var:
   ```bash
   # dev
   docker compose -f docker-compose.observability.yml up -d --force-recreate grafana
   # production
   docker compose --env-file config/secrets/.env \
     -f docker-compose.observability.production.yml up -d --force-recreate grafana
   ```
4. Confirm it under Grafana → Alerting → Contact points → `busmate-discord` → **Test**.

For Slack instead, change the contact point's `type: discord` to `type: slack` and its
`settings.url` to a Slack incoming-webhook URL (`contactpoints.yaml`). For email, configure
Grafana's `[smtp]` section (not provisioned here — no SMTP server was available at setup time)
and use `type: email`.

**`noDataState` matters:** most rules are set to `noDataState: OK` — e.g. "zero ERROR log
lines" or "no gateway traffic in the window" is the *healthy* case, not an unknown/alerting
one. `busmate-service-down` and `busmate-container-restart-loop` use `noDataState: Alerting`,
since their underlying metrics (`up`, `probe_success`, `container_start_time_seconds`) are
always present for a configured target — if one is ever missing, something is wrong with the
scrape config itself, which is itself worth flagging.

**Editing rules:** change `rules.yaml` and recreate Grafana (same command as above) —
don't edit rules by hand in the UI, since a future recreate will reconcile back to disk
and silently drop manual changes.

## Probing Postgres and MinIO (INC-036)

Neither exposes a `/metrics` endpoint, so **blackbox-exporter** (production only —
`docker-compose.observability.production.yml`) asks from the outside instead: a bare TCP
connect for Postgres, an HTTP check against MinIO's own liveness endpoint. Prometheus scrapes
*it*, not them directly — see the `blackbox-postgres`/`blackbox-minio` jobs in
`prometheus/prometheus.production.yml`, and `blackbox/blackbox.yml` for the two probe module
definitions. `busmate-service-down` reads the resulting `probe_success` metric the same way it
reads `up` for the app services.

## Uptime monitoring (Phase 4)

**Uptime Kuma** (http://localhost:3001, tunnelled in production — see "Running it in
production" above) is included for one thing (ADR-021): a public status page, checking the
platform the way a real visitor would rather than reaching for internal service names — it
deliberately does **not** join `busmate_default` in production, unlike Prometheus and
blackbox-exporter, which need to. Per-service internal health is Prometheus's job
(`busmate-service-down`), not Uptime Kuma's; adding it here would duplicate that rule with a
tool that has no alerting rules of its own to route through severity-split policy. The
open-source edition has no declarative/file-based config, so set it up once by hand:

1. Open http://localhost:3001 (dev) or the tunnelled equivalent (production) and create the
   admin account (first-run only).
2. Add a monitor for each public endpoint (**Add New Monitor** → type **HTTP(s)**):

   | Environment | Friendly name | URL | Heartbeat interval |
   |---|---|---|---|
   | dev | api-gateway | `http://host.docker.internal:8080/health` | 30s |
   | dev | core-service | `http://host.docker.internal:9010/actuator/health` | 30s |
   | dev | user-service | `http://host.docker.internal:9020/actuator/health` | 30s |
   | dev | ticketing-service | `http://host.docker.internal:9030/actuator/health` | 30s |
   | production | passenger-web | `https://busmate.site/` | 60s |
   | production | api-gateway | `https://api.busmate.site/health` | 60s |
   | production | staff portal | `https://portal.busmate.site/` | 60s |

   Dev checks each service directly (host.docker.internal, since dev publishes every port);
   production checks the three public hostnames through Caddy, exactly what a visitor sees.
3. (Optional) **Settings → Notifications** to add the same Discord webhook as above, then
   attach it to each monitor.
4. (Optional) **Status Pages → New Status Page** to publish a public page showing the three
   production monitors — this is the "public status page" ADR-021 keeps Uptime Kuma for.

## Frontend & mobile error tracking (Phase 5)

Sentry SDKs are installed and initialized in all five frontend apps, but **disabled by
default** — each `Sentry.init()` runs with `dsn: undefined` when no DSN env var is set, so
the SDK loads and every `Sentry.captureException`/error-boundary call site still works
without throwing, it just drops events instead of sending them. Nothing will show up in
Sentry until you complete the one-time setup below.

| App | Init file | DSN env var |
|---|---|---|
| new-react-portal | `src/lib/sentry.ts` (called from `main.tsx`) | `VITE_SENTRY_DSN` |
| passenger-web | `src/lib/sentry.ts` (called from `main.tsx`) | `VITE_SENTRY_DSN` |
| conductor-mobile | `src/lib/sentry.ts` (called from `src/app/_layout.tsx`) | `EXPO_PUBLIC_SENTRY_DSN` |
| passenger-mobile | `lib/sentry.ts` (called from `app/_layout.tsx`) | `EXPO_PUBLIC_SENTRY_DSN` |

**What's wired in each app:**
- Unhandled errors/rejections are captured automatically (Sentry's global handlers, set up
  by `Sentry.init()`).
- React render errors: hooked into the existing `ErrorBoundary` component's
  `componentDidCatch` (new-react-portal) or Sentry's own root wrapper
  (`Sentry.wrap(RootLayout)` — conductor-mobile, passenger-mobile).
- **Correlation with backend logs**: every app patches its global `fetch` to read the
  `X-Request-Id` response header (the same one the API gateway generates/echoes for Phase 1)
  and attaches it as a `request_id` tag on the next Sentry event. Given a Sentry issue, pivot
  to the exact backend request with:
  ```logql
  {job="docker"} | json | requestId="<the request_id tag value>"
  ```
- Source maps: `@sentry/vite-plugin` (Vite apps) and
  `getSentryExpoConfig` in each Expo app's `metro.config.js` are all wired to upload source
  maps on build, but **disabled** (`disable`/`disableSentryWebpackConfig: true`) until you set
  `SENTRY_AUTH_TOKEN` — builds succeed normally either way, just without de-minified stack
  traces until then.

### One-time setup once you have a Sentry project

1. Sign up free at [sentry.io](https://sentry.io) (or use an existing org) and create one
   project per app (or one shared project — your call).
2. Copy each project's DSN into `config/secrets/.env` (or the app's local `.env` for
   frontend-only dev) using the env var names in the table above.
3. For source-map upload, also set (once, shared across apps): `SENTRY_ORG`,
   `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` (create one at
   sentry.io → Settings → Auth Tokens, scope `project:releases`).
4. If you skipped `pnpm approve-builds` during install, run it now so `@sentry/cli`'s
   postinstall can download its binary (required for source-map upload, not for the SDKs
   themselves):
   ```bash
   pnpm approve-builds
   ```
5. Rebuild. Trigger a test error (e.g. throw in a component) and confirm it appears in
   Sentry with a `request_id` tag matching a Loki entry.

## Distributed tracing (Phase 6)

Every backend service exports OpenTelemetry traces to **Tempo**, giving a flame-graph
view of one request as it crosses the gateway and into whichever Spring service(s) it
touches — verified live: a real `GET /api/health` request through the gateway produced a
single Tempo trace with `core-service`'s span correctly parented under the gateway's
outbound HTTP call, proving W3C trace-context propagation works across the network hop
with zero manual header plumbing.

**How each service is instrumented:**

| Service | Mechanism | Notes |
|---|---|---|
| core/user/ticketing-service | OpenTelemetry **Java agent** (`-javaagent`, in each Dockerfile) | Zero code changes — auto-instruments Spring MVC, JDBC, HikariCP, Kafka, outbound HTTP |
| api-gateway | `@opentelemetry/sdk-node` + `auto-instrumentations-node`, `src/tracing.ts` | Must be the *first* thing `index.ts` imports — see the comment in `tracing.ts` for why no `--require` CLI flag is needed |

**Trace <-> log correlation:** the OTel Java agent injects `trace_id`/`span_id` into
SLF4J's MDC automatically; the gateway's pino logger does the same via a `mixin` reading
the active span. Both land in Loki under the same field names, so:
- **From a log line** (in Grafana Explore, Loki): click the auto-detected "TraceID" link
  next to any line containing `trace_id` to jump straight into that trace in Tempo.
- **From a trace** (in Grafana Explore, Tempo): click "Logs for this span" on any span to
  jump to the matching Loki lines (`{job="docker"} | json | trace_id="<id>"`).
- Verified directly: triggering a real error produced a log line reading
  `[req:trace6-verify-999 trace:c356c09d931405e08d55c164035f0467]`, and that exact
  `trace_id` resolved to a real, browsable trace in Tempo.

**What's NOT wired (deliberately, to stay in scope):** Tempo's metrics-generator
(service-graph / span-metrics -> Prometheus) is not enabled — it's a real feature but
adds a second write path into Prometheus for a benefit beyond this phase's actual goal
(trace visualization + trace-to-log correlation). Revisit if service-graph dashboards
become worth the added complexity.

**Retention:** Tempo keeps 3 days of traces (`block_retention: 72h` in
`tempo/tempo-config.yml`) — traces are large and short-lived compared to logs/metrics;
raise it if you need longer trace history and have the disk for it.

**Dev only (ADR-021):** each app service in `docker-compose.yml` has
`OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318` + `extra_hosts:
host.docker.internal:host-gateway`, and that's as far as tracing goes. Tempo is not part of
`docker-compose.observability.production.yml`, and `docker-compose.production.yml` sets
`OTEL_SDK_DISABLED=true` on every Spring service — tracing stays a development tool until
sustained traffic makes a latency question unanswerable without it.

**If Tempo isn't running:** every service's OTLP export just fails silently in the
background (visible only in that service's own debug-level agent/SDK logs) — no impact
on the app itself, so it's safe to run the app stack without the observability stack up.

## Notes / hardening

- Alloy runs as `root` to read `/var/run/docker.sock`; in a hardened deployment, drop root
  and add the host's `docker` group gid instead.
- The dev stack (this file's default) is unauthenticated by default and binds to every
  interface — fine on a laptop, never on a reachable host. Production
  (`docker-compose.observability.production.yml`) enforces the opposite: every UI on
  `127.0.0.1` only, and Grafana refuses to start without a real `GRAFANA_ADMIN_PASSWORD`.
- To move off self-hosting later, point `alloy/config.alloy`'s `loki.write` and Prometheus'
  `remote_write` at Grafana Cloud (same APIs) — no application changes needed.
