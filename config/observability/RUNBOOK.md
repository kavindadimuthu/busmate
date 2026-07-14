# BusMate Alerting Runbook (Phase 4)

How to respond when a BusMate alert fires. Alerts appear in Grafana → **Alerting → Alert
rules** (http://localhost:3000/alerting/list) and, once a real webhook is configured (see
`README.md`), in Slack/Discord/email.

## Severity tiers

| Severity | Meaning | Response expectation |
|---|---|---|
| **critical** | Users are affected right now (a service is down, or a meaningful fraction of requests are failing) | Look at it immediately |
| **warning** | Heading toward a problem, not affecting users yet (latency creeping up, heap/host memory high, error logs spiking) | Look at it same day |

Every alert below should be actionable — if one fires repeatedly with no real action to
take, fix the threshold or delete it rather than letting the team learn to ignore it.

## Alert reference

### Service down (`busmate-service-down`) — critical
**Fires when:** Prometheus can't scrape a service (`api-gateway`, `core-service`,
`user-service`, or `ticketing-service`) for 2+ minutes.
**Check:**
```bash
docker ps --filter "name=busmate-"          # is the container even running?
docker logs busmate-<service>-1 --tail 100  # crash on startup? OOM-killed?
curl -s http://localhost:<port>/actuator/health   # (or /health for the gateway)
```
**Common causes:** container crashed/OOM-killed, bad config on last deploy, DB connection
exhausted (check `hikaricp_connections_active` on the Spring Services dashboard).

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
