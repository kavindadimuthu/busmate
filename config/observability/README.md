# BusMate Observability (Phase 1 + 2 + 3)

Structured logging with correlation IDs (Phase 1), centralised log aggregation via the
Grafana + Loki stack (Phase 2), and metrics via Prometheus + Grafana (Phase 3). See
[`docs/plans/Logging-and-Monitoring-Implementation-Plan.md`](../../docs/plans/Logging-and-Monitoring-Implementation-Plan.md)
for the full roadmap.

## What's here

| Path | Purpose |
|---|---|
| `loki/loki-config.yml` | Single-binary Loki, filesystem storage, 14-day retention |
| `alloy/config.alloy` | Grafana Alloy — discovers `busmate*` containers via the Docker socket, parses JSON logs, ships to Loki |
| `prometheus/prometheus.yml` | Prometheus scrape config — the 4 app services + cAdvisor + node-exporter |
| `grafana/provisioning/` | Auto-provisioned Prometheus + Loki datasources and the dashboard provider |
| `grafana/dashboards/busmate-logs.json` | "BusMate — Logs" (volume-by-level, error rate, searchable log stream) |
| `grafana/dashboards/busmate-services.json` | "BusMate — Spring Services (RED + JVM)" (rate/errors/p95, heap, GC, threads, Hikari) |
| `grafana/dashboards/busmate-infra.json` | "BusMate — Gateway & Infrastructure" (gateway RED, Node event loop, container + host CPU/mem) |

## Ports

| Service | URL |
|---|---|
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 (targets: `/targets`) |
| Loki | http://localhost:3100 |
| Alloy UI | http://localhost:12345 |

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

## Notes / hardening

- Alloy runs as `root` to read `/var/run/docker.sock`; in a hardened deployment, drop root
  and add the host's `docker` group gid instead.
- Do not expose Grafana/Prometheus/Loki publicly — keep them on the private host/network and
  change the default Grafana password.
- To move off self-hosting later, point `alloy/config.alloy`'s `loki.write` and Prometheus'
  `remote_write` at Grafana Cloud (same APIs) — no application changes needed.
