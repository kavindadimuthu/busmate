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
| `loki/loki-config.yml` | Single-binary Loki, filesystem storage, 14-day retention |
| `alloy/config.alloy` | Grafana Alloy — discovers `busmate*` containers via the Docker socket, parses JSON logs, ships to Loki |
| `prometheus/prometheus.yml` | Prometheus scrape config — the 4 app services + cAdvisor + node-exporter |
| `tempo/tempo-config.yml` | Single-binary Tempo, filesystem storage, 3-day retention, OTLP receiver |
| `grafana/provisioning/datasources/` | Auto-provisioned Prometheus + Loki + Tempo datasources (with trace<->log linking) |
| `grafana/provisioning/dashboards/` | Dashboard provider config |
| `grafana/provisioning/alerting/` | Alert rules, contact point, and notification policy — all as code |
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

## Metrics scraping: dev vs. production

Prometheus reaches the app services via `host.docker.internal` because the **dev** stack
(`docker-compose.yml`) publishes every service port to the host. In **production**
(`docker-compose.production.yml`) only api-gateway is published, so instead attach
Prometheus to the app's Docker network and scrape by service name:

```yaml
# docker-compose.observability.yml (prod tweak)
networks:
  busmate_default:            # the app stack's default network (project name: busmate)
    external: true
services:
  prometheus:
    networks: [default, busmate_default]
```

and change the targets in `prometheus/prometheus.yml` from `host.docker.internal:<port>` to
`api-gateway:8080`, `core-service:9010`, `user-service:9020`, `ticketing-service:9030`.

## Alerting (Phase 4)

Six alert rules are provisioned as code in `grafana/provisioning/alerting/rules.yaml`
(view them live at http://localhost:3000/alerting/list): service down, gateway/Spring 5xx
rate, gateway p95 latency, JVM heap near capacity, host memory low, and an error-log spike.
See `RUNBOOK.md` for what each one means and how to respond.

They all route to a single **webhook contact point** (`busmate-webhook`,
`grafana/provisioning/alerting/contactpoints.yaml`) pointed at the `ALERT_WEBHOOK_URL`
env var. By default that's `http://localhost:9999/configure-me` — nothing listens there,
so alerts still fire/resolve correctly and are visible in Grafana's Alerting UI, but
outbound delivery will fail (harmlessly logged in `docker logs busmate-grafana`) until you
set a real URL.

**To wire up real delivery (Slack, Discord, or any webhook receiver):**

1. Get a webhook URL:
   - **Slack**: create an [incoming webhook](https://api.slack.com/messaging/webhooks) for a channel.
   - **Discord**: channel settings → Integrations → Webhooks → copy URL, then append `/slack`
     to the URL (Discord will accept Grafana's Slack-formatted payload that way).
2. Add it to `config/secrets/.env`:
   ```
   ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```
3. Recreate Grafana so it picks up the new env var:
   ```bash
   docker compose -f docker-compose.observability.yml up -d --force-recreate grafana
   ```
4. Confirm it under Grafana → Alerting → Contact points → `busmate-webhook` → **Test**.

For email instead, you'd need to configure Grafana's `[smtp]` section (not provisioned
here — no SMTP server was available at setup time) and change the contact point's
`type: webhook` to `type: email` in `contactpoints.yaml`.

**`noDataState` matters:** most rules are set to `noDataState: OK` — e.g. "zero ERROR log
lines" or "no gateway traffic in the window" is the *healthy* case, not an unknown/alerting
one. Only `busmate-service-down` uses `noDataState: Alerting`, since Prometheus's `up`
metric is always present for a configured target — if it's ever missing, something is
wrong with the scrape config itself.

**Editing rules:** change `rules.yaml` and recreate Grafana (same command as above) —
don't edit rules by hand in the UI, since a future recreate will reconcile back to disk
and silently drop manual changes.

## Uptime monitoring (Phase 4)

**Uptime Kuma** (http://localhost:3001) is included for simple black-box "is it up"
checks + a status page, complementary to Prometheus's `up` (which only tells you if
Prometheus itself can reach a target — Uptime Kuma checks from a slightly different angle
and gives you a public-friendly status page). The open-source edition has no
declarative/file-based config, so set it up once by hand:

1. Open http://localhost:3001 and create the admin account (first-run only).
2. Add a monitor for each service (**Add New Monitor** → type **HTTP(s)**):

   | Friendly name | URL | Heartbeat interval |
   |---|---|---|
   | api-gateway | `http://host.docker.internal:8080/health` | 30s |
   | core-service | `http://host.docker.internal:9010/actuator/health` | 30s |
   | user-service | `http://host.docker.internal:9020/actuator/health` | 30s |
   | ticketing-service | `http://host.docker.internal:9030/actuator/health` | 30s |

3. (Optional) **Settings → Notifications** to add the same Slack/Discord webhook as above,
   then attach it to each monitor.
4. (Optional) **Status Pages → New Status Page** to publish a public page showing all four.

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
| management-portal | `instrumentation-client.ts` (client), `instrumentation.ts` (server/edge) | `NEXT_PUBLIC_SENTRY_DSN` (client), `SENTRY_DSN` (server) |
| conductor-mobile | `src/lib/sentry.ts` (called from `src/app/_layout.tsx`) | `EXPO_PUBLIC_SENTRY_DSN` |
| passenger-mobile | `lib/sentry.ts` (called from `app/_layout.tsx`) | `EXPO_PUBLIC_SENTRY_DSN` |

**What's wired in each app:**
- Unhandled errors/rejections are captured automatically (Sentry's global handlers, set up
  by `Sentry.init()`).
- React render errors: hooked into the existing `ErrorBoundary` component's
  `componentDidCatch` (new-react-portal, management-portal) or Sentry's own root wrapper
  (`Sentry.wrap(RootLayout)` — conductor-mobile, passenger-mobile).
- **Correlation with backend logs**: every app patches its global `fetch` to read the
  `X-Request-Id` response header (the same one the API gateway generates/echoes for Phase 1)
  and attaches it as a `request_id` tag on the next Sentry event. Given a Sentry issue, pivot
  to the exact backend request with:
  ```logql
  {job="docker"} | json | requestId="<the request_id tag value>"
  ```
- Source maps: `@sentry/vite-plugin` (Vite apps), `withSentryConfig` (management-portal), and
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

**Dev vs. production networking:** exactly the same `host.docker.internal` pattern
already used for Prometheus/Uptime Kuma (see "Metrics scraping" above) — each app service
in `docker-compose.yml` has `OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:4318`
+ `extra_hosts: host.docker.internal:host-gateway`. In production, switch this to Tempo's
real service name on the shared network, same as the Prometheus scrape-target change.

**If Tempo isn't running:** every service's OTLP export just fails silently in the
background (visible only in that service's own debug-level agent/SDK logs) — no impact
on the app itself, so it's safe to run the app stack without the observability stack up.

## Notes / hardening

- Alloy runs as `root` to read `/var/run/docker.sock`; in a hardened deployment, drop root
  and add the host's `docker` group gid instead.
- Do not expose Grafana/Prometheus/Loki publicly — keep them on the private host/network and
  change the default Grafana password.
- To move off self-hosting later, point `alloy/config.alloy`'s `loki.write` and Prometheus'
  `remote_write` at Grafana Cloud (same APIs) — no application changes needed.
