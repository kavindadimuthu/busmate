# BusMate Alerting Runbook (Phase 4, extended in INC-036)

How to respond when a BusMate alert fires. Alerts appear in Grafana → **Alerting → Alert
rules** (http://localhost:3000/alerting/list, tunnelled — see README.md) and in whichever
Discord channel `ALERT_WEBHOOK_URL` points at (`config/secrets/.env`, production only).

## Severity tiers

| Severity | Meaning | Response expectation |
|---|---|---|
| **critical** | Users are affected right now (a service is down, or a meaningful fraction of requests are failing) | Look at it immediately |
| **warning** | Heading toward a problem, not affecting users yet (latency creeping up, heap/host memory high, error logs spiking) | Look at it same day |

Every alert below should be actionable — if one fires repeatedly with no real action to
take, fix the threshold or delete it rather than letting the team learn to ignore it.

## Alert reference

### Service down (`busmate-service-down`) — critical
**Fires when:** Prometheus can't reach a target for 2+ minutes — `api-gateway`, `core-service`,
`user-service`, `ticketing-service` (scraped directly), or **Postgres / MinIO** (probed through
`blackbox-exporter`, INC-036, since neither exposes its own metrics endpoint).
**Check:**
```bash
docker ps --filter "name=busmate-"          # is the container even running?
docker logs busmate-<service>-1 --tail 100  # crash on startup? OOM-killed?
curl -s http://localhost:<port>/actuator/health   # (or /health for the gateway)
```
**Common causes:** container crashed/OOM-killed, bad config on last deploy, DB connection
exhausted (check `hikaricp_connections_active` on the Spring Services dashboard). If it's
Postgres or MinIO: `docker inspect --format '{{json .State.Health}}' busmate-postgres-1` (or
`-minio-1`) — their own healthcheck almost always agrees with the probe, so this is rarely a
false alarm.

### Container restart loop (`busmate-container-restart-loop`) — critical
**Fires immediately** (no wait) **when:** any `busmate-*` container has restarted more than
twice in the last 10 minutes — closes the gap where a container crash-looping faster than
Service Down's 2-minute window looks healthy in between crashes.
**Check:** `docker logs <name> --tail 100` — almost always a crash on startup (bad config from
the last deploy, a migration that failed, a port already bound). `docker ps` will also show a
climbing restart count while it's still happening.
**Common causes:** the same last-deploy causes as Service Down, but severe enough that the
container can't even stay up long enough to be scraped as "down" for 2 full minutes.

### Gateway / Spring services: high 5xx rate — critical
**Fires when:** more than 5% of requests to the gateway (`busmate-gateway-5xx-rate`) or any
Spring service (`busmate-spring-5xx-rate`) return a 5xx for 5+ minutes.
**Check:** Grafana → BusMate — Logs dashboard, set `$level = ERROR`, and read the actual
stack traces. The "Top endpoints by rate" panel on the Spring Services dashboard tells you
*which* endpoint is failing.
**Common causes:** a downstream dependency (Postgres, another service, Supabase) is down or
slow; a bad deploy; a bug triggered by a specific request shape.

### Gateway: high p95 latency (`busmate-gateway-p95-latency`) — warning
**Fires when:** the gateway's p95 response time exceeds 1s for 5+ minutes.
**Check:** Is one specific downstream service slow (check its own p95 on the Spring
Services dashboard) or is it the gateway itself (Node event-loop lag panel on the
Gateway & Infrastructure dashboard — a busy event loop delays every request)?

### JVM heap near capacity (`busmate-jvm-heap-high`) — warning
**Fires when:** a Spring service's heap usage exceeds 85% of its max for 5+ minutes.
**Check:** the JVM panels (heap, GC pause rate, live threads) on the Spring Services
dashboard for the named `job`. Sustained high heap risks long GC pauses or an eventual
OOM kill (which would then also trip Service Down).
**Common causes:** a memory leak, a genuinely larger workload than the container's memory
limit anticipates, or a slow GC config for the container's actual heap size.

### Host: memory running low (`busmate-host-memory-low`) — warning
**Fires when:** available host memory drops below 15% of total for 5+ minutes.
**Check:** the "Containers — memory" panel on the Gateway & Infrastructure dashboard to see
which container is the largest consumer.

### Host: disk running low (`busmate-host-disk-low`) — critical
**Fires when:** free space on `/` drops below 15% of total for 5+ minutes. **Critical, not
warning** — a full disk doesn't degrade the platform, it stops Postgres outright, and the disk
is shared between Postgres, MinIO, Prometheus and Loki.
**Check:**
```bash
docker system df               # images/containers/volumes, roughly
du -sh /opt/busmate/*           # the app's own volumes and repo checkout
```
Prometheus and Loki are retention-capped (`docker-compose.observability.production.yml`), so
they shouldn't be the cause under normal growth — if one of them is unexpectedly large, that
cap isn't working and is worth its own look, not just a one-off cleanup.
**Common causes:** Postgres or MinIO data growing faster than expected, Docker's own image/layer
cache never pruned, or — if it happened suddenly — a runaway log volume from something looping.

### Error log spike (`busmate-error-log-spike`) — warning
**Fires when:** more than 10 ERROR-level log lines are emitted (across all services)
in a 5-minute window.
**Check:** BusMate — Logs dashboard, `$level = ERROR`, read the messages. This is
deliberately a blunt trip-wire (not tied to one service) — the log stream tells you which
service and what's actually failing.

## Alert hygiene

- If an alert fires and there was nothing to do, that's a signal the threshold is wrong —
  fix or delete it. Don't let noisy alerts teach the team to ignore Slack/Discord.
- Rules are provisioned as code in
  `config/observability/grafana/provisioning/alerting/rules.yaml` — edit there, not by hand
  in the Grafana UI (manual UI edits get reset on the next `docker compose up`/restart if
  the provisioning files haven't changed to match, since Grafana reconciles from disk).
- New alert → add a section to this runbook in the same change.

## Routing (INC-036)

One real channel exists today, so "routing by severity" means different *behaviour* through
that one channel, not a different destination (`policies.yaml`): a critical groups within 10s
and repeats every 30 minutes while still firing; a warning waits a full minute to group and
repeats only every 6 hours. If a critical alert and a warning fire close together, they land as
two separate messages rather than one grouped notification that buries the critical under the
warning's text. Revisit this whole scheme once a second contact point exists — a paging service
for criticals, this channel for everything else, is the obvious next shape.
