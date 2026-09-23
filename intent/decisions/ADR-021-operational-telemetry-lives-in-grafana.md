# ADR-021 · Operational telemetry lives in Grafana; the portal shows capability health only

**Date:** 2026-09-23 · **Status:** Accepted
**Type:** architecture

## Context

The observability stack was built in six phases in July 2026 against a development laptop. Production
arrived two months later ([ADR-020](ADR-020-self-hosted-postgres-on-one-vps.md), INC-032..INC-034).
The two have never met: `docker-compose.production.yml` includes none of it and sets
`OTEL_SDK_DISABLED=true` on every Spring service, so the live platform reports nothing about itself.

Meanwhile the staff portal carries roughly 2,600 lines of generated data under `data/admin/` that
renders as operational telemetry — a health score, CPU and memory bars, an alert list with
acknowledge and resolve actions, an editable alert-rules table, and a control offering to restart a
service. None of it is connected to anything. It is a second monitoring system, and it competes with
the seven alert rules that are genuinely provisioned as code.

So two questions have gone unanswered since the stack was written, and the clutter is the symptom of
both: **how much of this does production actually run**, and **which surface is a person meant to
look at**.

The constraints that decide it: one VPS with 4 vCPU, 7.8 GiB of memory and a 154 GB disk shared with
Postgres and MinIO; the app stack measured at about 2.2 GB; no revenue, no paying customer, and one
person operating it.

## Options considered

1. **Deploy all of it and make the portal's monitoring real.** The most work of any option, ends with
   two full monitoring systems to keep in step, and puts PromQL inside a React application.
2. **Portal only** — proxy metrics into the portal and do not run Grafana in production. One surface,
   but it rebuilds a mature tool badly, and it gives up ad-hoc querying, which is the thing that is
   actually needed during an incident rather than before one.
3. **Grafana only** — delete the portal's operations pages and stop there. Cheapest and honest, but
   it leaves staff with no in-product answer to "is BusMate working right now", which is a question
   an MOT officer or an operator will reasonably ask without wanting an SSH key.
4. **Split by audience.** Chosen.

## Decision

**Grafana is the operator's tool.** Host, container, service and log telemetry live there, and it is
the only place alert rules are defined. It is not published on the public internet: it binds to the
loopback interface and is reached through an SSH tunnel.

**The staff portal shows capability health only.** A small set of named platform capabilities — ticket
validation, trip generation, sign-in, media upload — each reduced to healthy, degraded or unknown,
read from one narrow server-side endpoint. The portal never holds a PromQL query, never renders a
resource graph, and offers no control that acts on infrastructure. Expressing health as capabilities
rather than components is deliberate: a component name answers a question only the operator is
asking.

**Production runs a floor, not the whole stack.** Host and container metrics, Prometheus, Loki,
Grafana, and alert delivery to a channel a person reads. Distributed tracing stays a development
tool: the OpenTelemetry wiring stays in the code and stays disabled in production until traffic makes
a latency question unanswerable without it.

**Uptime Kuma is kept for one thing** — the public status page, which Prometheus cannot produce.
Per-service checks are Prometheus's job, because that is where the rules and the runbook already are.

**"No data" is a third state everywhere,** and it is never rendered as healthy. A monitoring surface
that cannot distinguish "fine" from "not asked" is the failure this decision exists to prevent.

## Consequences

The portal's mock operations surfaces are deleted rather than implemented. Roughly 2,600 lines go,
along with the alert-rules editor and the restart control — an infrastructure action does not belong
in the product at all, so it is removed outright rather than disabled.

The operator signs in twice, to the portal and to Grafana. Accepted: the alternative is
reimplementing Grafana inside a React application.

With tracing off in production, a live latency mystery is diagnosed from metrics and logs and
reproduced in development to trace. That is a real cost and it rises with load; it is the right trade
at near-zero traffic and it is reversible by removing one environment variable.

The status page becomes the only public statement BusMate makes about its own availability, so it
must not be wired to a check that flaps.

Retention is capped by size as well as by time. The disk is shared with Postgres and MinIO, and
filling it does not degrade monitoring — it takes the database down. Monitoring that kills the thing
it monitors is worse than no monitoring.

The capability endpoint needs a permission to gate it, and no permission in the catalogue means
anything about operations. That gap is now visible and belongs to a later increment rather than being
smuggled into this one.

## Revisit when

A second host or a managed provider enters the picture; or sustained traffic makes a latency question
unanswerable without traces; or a support function exists that needs telemetry without an SSH key.
