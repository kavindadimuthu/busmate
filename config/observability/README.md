# BusMate Observability (Phase 1 + 2 + 3 + 4)

Structured logging with correlation IDs (Phase 1), centralised log aggregation via the
Grafana + Loki stack (Phase 2), metrics via Prometheus + Grafana (Phase 3), and alerting +
uptime monitoring (Phase 4). See
[`docs/plans/Logging-and-Monitoring-Implementation-Plan.md`](../../docs/plans/Logging-and-Monitoring-Implementation-Plan.md)
for the full roadmap and [`RUNBOOK.md`](RUNBOOK.md) for what to do when an alert fires.

## What's here

| Path | Purpose |
|---|---|
| `loki/loki-config.yml` | Single-binary Loki, filesystem storage, 14-day retention |
| `alloy/config.alloy` | Grafana Alloy — discovers `busmate*` containers via the Docker socket, parses JSON logs, ships to Loki |
| `prometheus/prometheus.yml` | Prometheus scrape config — the 4 app services + cAdvisor + node-exporter |
| `grafana/provisioning/datasources/` | Auto-provisioned Prometheus + Loki datasources |
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

## Notes / hardening

- Alloy runs as `root` to read `/var/run/docker.sock`; in a hardened deployment, drop root
  and add the host's `docker` group gid instead.
- Do not expose Grafana/Prometheus/Loki publicly — keep them on the private host/network and
  change the default Grafana password.
- To move off self-hosting later, point `alloy/config.alloy`'s `loki.write` and Prometheus'
  `remote_write` at Grafana Cloud (same APIs) — no application changes needed.
