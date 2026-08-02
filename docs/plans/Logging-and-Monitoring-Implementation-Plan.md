# Logging & Monitoring (Observability) Implementation Plan

**Scope:** System/application observability for the BusMate platform — structured logging,
metrics, tracing, error tracking, alerting, and uptime — across dev and production.

> This is about **operating the software** — not *transit* monitoring (vehicle AVL/tracking), which
> is a product capability tracked in [`intent/backlog.md`](../../intent/backlog.md).

**Status:** All 6 phases implemented & verified (2026-07-14/15).
**Target deployment model:** Docker Compose, self-hosted, small team.

> **Implementation status**
> - **Phase 1 (structured logs + correlation IDs) — DONE.** Gateway on `pino`/`pino-http`
>   (JSON, `X-Request-Id` gen+reuse+redaction, verified at runtime); all 3 Spring services on
>   `logstash-logback-encoder` with a profile-aware `logback-spring.xml` + `RequestIdFilter`
>   (MDC `requestId`); user-service stamps `requestId` on Kafka producer records.
> - **Phase 2 (Loki aggregation) — DONE.** `docker-compose.observability.yml` + `config/observability/`
>   (Loki 3.4, Alloy, Grafana). Verified: Alloy ships `busmate-*` container logs to Loki; Grafana
>   auto-provisions the datasource + "BusMate — Logs" dashboard.
> - **Phase 3 (Prometheus metrics) — DONE.** Actuator+Micrometer `/actuator/prometheus` on all 3
>   Spring services; `prom-client` `/metrics` on the gateway; Prometheus + cAdvisor + node-exporter
>   added; 2 metrics dashboards. Verified: Prometheus scrapes gateway + core-service (`up=1`) and
>   metrics are queryable.
> - **Phase 4 (alerting + uptime) — DONE.** 6 alert rules provisioned as code (service down,
>   gateway/Spring 5xx rate, gateway p95 latency, JVM heap, host memory, error-log spike) routed
>   through a generic webhook contact point (delivery destination left for the user to configure —
>   see README); Uptime Kuma added for black-box `/health` checks. Verified on a **real** incident:
>   all 4 app containers went down mid-session, Prometheus correctly showed `up=0`, all 4
>   "Service down" alerts fired, and all 4 auto-resolved once the containers came back and were
>   re-scraped — the full fire→resolve loop confirmed on genuine (not synthetic) downtime.
> - **Phase 5 (frontend/mobile error tracking) — DONE.** Sentry SDKs installed + initialized in
>   all 5 frontend apps (new-react-portal, passenger-web, management-portal, conductor-mobile,
>   passenger-mobile), disabled by default (no DSN → SDK loads but drops everything) since no
>   Sentry account/hosting decision had been made — user chose "wire code now, configure DSN
>   later". Each app: global-error capture, existing `ErrorBoundary`/root-wrapper hooked to
>   `Sentry.captureException`, source-map upload plugins wired but gated on `SENTRY_AUTH_TOKEN`,
>   and a fetch patch that tags every Sentry event with the backend's `X-Request-Id` response
>   header for cross-referencing a Sentry issue to the exact Loki log line. Verified: all 5 apps
>   build/typecheck clean (found and fixed one real pre-existing-pattern bug: RN's `global.fetch`
>   type needed an `as typeof fetch` cast that the DOM `fetch` type didn't).
> - **Phase 6 (distributed tracing) — DONE.** Grafana Tempo added to the observability stack;
>   all 3 Spring services instrumented via the OpenTelemetry Java agent (zero code, added to
>   each Dockerfile); the gateway via `@opentelemetry/sdk-node` + auto-instrumentations
>   (`src/tracing.ts`, must load first — see file comment for why no `--require` flag is
>   needed with this codebase's CommonJS setup). `trace_id`/`span_id` injected into every
>   service's structured logs (Java agent -> SLF4J MDC; gateway -> pino `mixin`), and Grafana's
>   Loki/Tempo datasources are cross-linked so a log line jumps to its trace and vice versa.
>   Deliberately skipped Tempo's metrics-generator (service-graph metrics) as out of scope for
>   the stated goal. **Verified on a real request, not synthetic**: `GET /api/health` through
>   the gateway produced one Tempo trace with `core-service`'s span correctly parented under
>   the gateway's outbound call (proving W3C traceparent propagation across the network hop),
>   and a separately triggered real error produced a log line with both `req:` and `trace:`
>   IDs, where the `trace:` ID resolved to a real trace in Tempo.
> - See [`config/observability/README.md`](../../config/observability/README.md) to run it and
>   [`config/observability/RUNBOOK.md`](../../config/observability/RUNBOOK.md) for what to do when
>   an alert fires.

---

## 1. Current state (verified)

| Component | Logging today | Metrics | Notes |
|---|---|---|---|
| **api-gateway** (Node/Express, `:8080`) | `morgan('combined')` → stdout, plain text | none | Public entry point; sees every request |
| **core-service** (Spring Boot, `:9010`) | `spring-boot-starter-actuator` present; `logback-spring.xml` with CONSOLE + rolling **file** appender (`logs/…log`) in plain text | actuator on, but **no `/prometheus`, no management config** | File appender writes inside the container → lost on restart, not aggregated |
| **user-service** (Spring Boot, `:9020`) | Spring default → stdout, plain text | **no actuator** | |
| **ticketing-service** (Spring Boot, `:9030`) | Spring default → stdout, plain text | **no actuator** | |
| Kafka events (inter-service) | none | none | No event correlation |
| Databases | Supabase Postgres (prod), local PG (dev) | Supabase dashboard only | |
| Frontends (React portals, Expo apps) | none | none | No crash/error reporting |
| **Aggregation / dashboards / tracing / alerting / uptime** | **none** | | Green-field |

**Key problems to solve:**
1. Logs are unstructured and scattered across container stdout + a lost-on-restart file.
2. No way to trace one request across gateway → service → Kafka → service.
3. No metrics, so no latency/error-rate/saturation visibility.
4. No alerting — failures are discovered by users, not the team.
5. No frontend/mobile error visibility at all.

---

## 2. Goals & guiding principles

- **One correlation ID per request**, propagated gateway → every service → Kafka → logs.
- **Structured JSON logs** everywhere, shipped to one searchable place.
- **The four golden signals** per service: latency, traffic, errors, saturation.
- **Self-hosted first, one pane of glass** — everything viewable in Grafana; avoid per-tool SaaS sprawl. Keep an escape hatch to SaaS (Grafana Cloud / Sentry SaaS) if hosting becomes a burden.
- **Cheap to run, cheap to maintain** — this is a small team; prefer the lowest-moving-parts option that meets the need. Don't deploy Kafka-for-logs or a 5-node Elasticsearch.
- **Dev/prod parity** — same instrumentation code; environment only changes destinations, sampling, and log level.
- **No PII / secrets in telemetry** — enforce redaction at the logging layer, not by convention.

---

## 3. Recommended toolchain

Standardize on the **Grafana "LGTM" stack** — one UI, all self-hostable via Compose, and it grows to Grafana Cloud without re-instrumenting.

| Concern | Tool | Why this over alternatives |
|---|---|---|
| **Log aggregation** | **Grafana Loki** + **Promtail/Alloy** collector | Indexes labels, not full text → a fraction of Elasticsearch's RAM/disk. Ideal for a Compose host. (ELK is the alternative if you need heavy full-text search — overkill here.) |
| **Metrics** | **Prometheus** scraping Micrometer (`/actuator/prometheus`) + `prom-client` (gateway) + **cAdvisor** (containers) + **node_exporter** (host) | De-facto standard, first-class Spring Boot + Node support. |
| **Dashboards** | **Grafana** | Single UI over Loki + Prometheus + Tempo. |
| **Tracing** (Phase 3) | **OpenTelemetry SDK** → **Grafana Tempo** | Vendor-neutral instrumentation; Tempo is the cheap trace store in the same stack. |
| **Error tracking** | **Sentry** (self-host OSS or free SaaS tier) | Best-in-class stack-trace grouping, release tracking, source maps for React/Expo. Covers what logs can't for frontends. |
| **Alerting** | **Grafana Alerting** (built-in) → email + Slack/Discord webhook | No separate Alertmanager needed to start. |
| **Uptime / blackbox** | **Uptime Kuma** (or Prometheus **blackbox_exporter**) hitting each `/health` | Dead-simple external "is it up" checks + status page. |

**Collector note:** run **Grafana Alloy** (the successor to Promtail + the OTel collector) as the single agent for both logs and traces if you want fewer containers; otherwise Promtail (logs) is fine to start.

**If you later outgrow self-hosting:** the same instrumentation ships to **Grafana Cloud** (free tier: 50 GB logs / 10k metrics) and **Sentry SaaS** with only endpoint/token changes — no code rewrite. This is the main reason to pick this stack now.

---

## 4. Target architecture

```
                         ┌─────────────────────────────────────────────┐
  React portals ───┐     │                  Grafana                     │
  Expo mobile  ────┼──►  │   Dashboards · Explore · Alerting            │
      │ (Sentry)   │     └───────┬───────────────┬──────────────┬──────┘
      ▼            │             │ query         │ query        │ query
  ┌────────┐       │        ┌────▼────┐     ┌────▼─────┐   ┌────▼────┐
  │ Sentry │       │        │  Loki   │     │Prometheus│   │  Tempo  │
  └────────┘       │        └────▲────┘     └────▲─────┘   └────▲────┘
                   │             │ push          │ scrape       │ OTLP
                   │        ┌────┴──────────┐    │              │
   HTTP  ──────────┴──►  api-gateway (:8080) ────┤              │
   X-Request-Id generated here, propagated down  │              │
                          │  │  │                 │              │
              ┌───────────┘  │  └───────────┐     │ /actuator/prometheus
              ▼              ▼               ▼     │              │
        core-service    user-service   ticketing-service ────────┘
         (:9010)          (:9020)         (:9030)   (OTel spans)
              │  JSON logs+MDC(requestId)  │
              └──────────► stdout ─────► Alloy/Promtail ──► Loki
        cAdvisor + node_exporter ─────────────────────► Prometheus
```

Everything runs as extra services in a dedicated `docker-compose.observability.yml`, joined to the
same Docker network as the app stack.

---

## 5. Cross-cutting conventions (define once, apply everywhere)

### 5.1 Correlation ID
- api-gateway generates `X-Request-Id` (UUID) on ingress if absent, adds it to every proxied
  request header, and includes it in its own logs.
- Each Spring service reads `X-Request-Id` into the **SLF4J MDC** via a servlet `Filter`, so every
  log line for that request carries it automatically. Put it back on the response.
- When producing Kafka events, copy `requestId` into a message header; consumers restore it to MDC.
- Result: search Loki by `requestId` and see the whole request's journey across all services.

### 5.2 Structured JSON logs
- **Spring:** add `logstash-logback-encoder`; swap the plain-text pattern for `LogstashEncoder`.
  Standard fields: `timestamp, level, service, traceId/requestId, logger, thread, message, stack_trace`.
- **Node:** replace `morgan` with **pino** (`pino-http`) → JSON to stdout, with `requestId`.
- **Ship stdout, not files.** Remove core-service's rolling **file** appender in containers (keep
  a file appender only for bare-metal/local dev if wanted). Containers log to stdout; Alloy/Promtail
  tails the Docker log driver → Loki.

### 5.3 Log levels (consistent across services)
`ERROR` needs a human · `WARN` recoverable/degraded · `INFO` business milestones (login, ticket
issued, trip started) · `DEBUG` dev only. Prod runs at `INFO`; make level overridable per-logger at
runtime via actuator `/loggers` (Spring) and an env var (gateway).

### 5.4 PII & secrets redaction (mandatory)
- Never log JWTs, passwords, API keys, full card/payment data, or full personal profiles.
- Enforce with a logback masking converter / pino `redact` paths (e.g. `req.headers.authorization`,
  `*.password`, `*.token`) — redaction at the framework layer, not developer discipline.

### 5.5 Health endpoints (uptime + orchestration)
- Every service exposes a real health endpoint: Spring `/actuator/health` (with liveness/readiness
  groups), gateway `/health`. Wire these into the existing Docker `healthcheck` blocks and Uptime Kuma.

---

## 6. Phased implementation plan

Each phase is independently shippable and leaves the system better than before.

### Phase 0 — Foundations & conventions (0.5 day)
- Write the logging convention (levels, JSON fields, `X-Request-Id`, redaction) into
  `docs/observability-conventions.md`.
- Add `docker-compose.observability.yml` skeleton + a `config/observability/` dir for
  Prometheus/Loki/Grafana/Alloy configs.
- **Deliverable:** agreed conventions + empty stack that boots.

### Phase 1 — Structured logging + correlation IDs (2–3 days) ⭐ highest ROI
1. **api-gateway:** replace `morgan` with `pino-http`; generate/propagate `X-Request-Id`; redact
   auth headers. (Touch: `src/index.ts`, `src/middleware/requestLogger.middleware.ts`.)
2. **All 3 Spring services:** add `logstash-logback-encoder`; add a shared `logback-spring.xml`
   (JSON to stdout in `prod`/`docker` profile, pretty console in `dev`); add an MDC filter that
   reads `X-Request-Id`. Fix core-service's file-appender-in-container issue.
3. Propagate `requestId` into Kafka producer/consumer headers.
- **Deliverable:** every log line is JSON with a `requestId`, on stdout. *No aggregator yet — still a
  strict improvement locally via `docker compose logs`.*

### Phase 2 — Log aggregation (Loki) (1–2 days)
- Add **Loki** + **Alloy/Promtail** + **Grafana** to `docker-compose.observability.yml`.
- Promtail scrapes the Docker log driver; parse JSON; promote `service`, `level`, `requestId` to
  labels (keep label cardinality low — do **not** label by userId/URL).
- Build a "Logs" dashboard and saved Explore queries (by service, by level=ERROR, by requestId).
- **Deliverable:** one searchable log UI across all services; trace a request end-to-end by ID.

### Phase 3 — Metrics (Prometheus + Grafana) (2–3 days)
1. **Spring services:** add actuator to user-service + ticketing-service (core already has it);
   add `micrometer-registry-prometheus`; expose `/actuator/prometheus`; set
   `management.endpoints.web.exposure.include`, common tags (`application`), and enable
   `http.server.requests` percentiles.
2. **api-gateway:** add `prom-client`, expose `/metrics` (request count/latency/in-flight by route).
3. Add **Prometheus** (scrape all four + cAdvisor + node_exporter), **cAdvisor**, **node_exporter**.
4. Grafana dashboards: per-service RED (Rate/Errors/Duration), JVM (heap/GC/threads), Node event
   loop, container CPU/mem, Postgres connection pool (HikariCP metrics come free).
- **Deliverable:** the four golden signals per service, visualized.

### Phase 4 — Alerting + uptime (1–2 days)
- **Uptime Kuma** pinging every `/health` + the public gateway; status page.
- Grafana alert rules → Slack/Discord/email:
  - Service down / health failing (from Uptime Kuma or `up == 0`).
  - HTTP 5xx rate > threshold (per service, over 5 min).
  - p95 latency > threshold.
  - JVM heap > 85%, container mem > 90%, DB pool exhaustion.
  - Kafka consumer lag / DLQ growth (ties into the outbox retry work already in the codebase).
  - Log-based: spike in `level=ERROR`.
- Define **severity tiers** (page vs. notify) and a couple of on-call runbooks.
- **Deliverable:** the team learns about failures before users do.

### Phase 5 — Frontend & mobile error tracking (1–2 days)
- **Sentry** in each React portal (Vite plugin + source map upload in CI) and Expo apps
  (`sentry-expo`). Capture unhandled errors, breadcrumbs, release/version, and — critically —
  propagate the same `X-Request-Id` so a frontend error links to backend logs.
- Optionally the Sentry Java/Spring + Node SDKs for backend exception grouping (complements Loki).
- **Deliverable:** client-side crashes are visible and correlated to backend traces.

### Phase 6 — Distributed tracing (optional, 2–3 days)
- Add the **OpenTelemetry** Java agent (zero-code) to Spring services and OTel SDK to the gateway;
  export to **Tempo**. Trace context propagation replaces/augments the manual `X-Request-Id`.
- **Deliverable:** flame-graph view of a request across services + DB calls. Do this once metrics
  point at a latency problem you can't localize.

**Suggested order of value:** Phase 1 → 2 → 3 → 4 give ~90% of the benefit. Do them first; 5 and 6
follow as needs arise.

---

## 7. Dev vs. production differences

| Aspect | Dev | Production |
|---|---|---|
| Log format | Pretty console (human) | JSON (machine) |
| Log level | `DEBUG` per-package as needed | `INFO`, error-only alerts |
| Observability stack | Optional; `docker compose -f docker-compose.observability.yml up` on demand | Always on, `restart: unless-stopped` |
| Sampling (traces) | 100% | 5–20% (cost) |
| Retention | Hours | Logs 14–30d, metrics 15–90d, traces 3–7d |
| Secrets | local | Grafana/Sentry creds in `config/secrets/.env` (existing pattern) |

Wire the observability stack behind the same `SPRING_PROFILES_ACTIVE` / `NODE_ENV` you already use,
so instrumentation code is identical and only destinations change.

---

## 8. Maintainability & best practices

- **Retention & disk caps:** set Loki/Prometheus/Tempo retention + size limits from day one; an
  unbounded log volume is the #1 way self-hosted observability falls over.
- **Label discipline:** low-cardinality labels only (service, level, env) — never userId, URL,
  requestId as a *label* (those are searchable fields, not labels). High cardinality kills Loki/Prom.
- **Dashboards & alerts as code:** commit Grafana dashboards (JSON) and alert rules to
  `config/observability/` so they're versioned and reproducible, not click-configured.
- **Instrument at boundaries, not everywhere:** HTTP in/out, DB, Kafka, external calls. Avoid noisy
  per-loop logging.
- **Alert hygiene:** every alert must be actionable and have an owner + runbook link; delete alerts
  that cry wolf. Alert fatigue defeats the whole system.
- **Cost review:** monthly glance at log/metric volume and top talkers; add sampling/drop rules for
  chatty low-value logs (health-check access logs, etc.).
- **Onboarding:** the conventions doc + a "how to find why X failed" runbook keep it usable as the
  team grows.
- **Security:** put Grafana/Prometheus/Loki behind auth + the private network; never expose them
  publicly. Scrub PII (Section 5.4) and periodically audit for leaks.

---

## 9. Effort & footprint summary

| Phase | Effort | New containers | Value |
|---|---|---|---|
| 1 — Structured logs + correlation | 2–3 d | 0 | ⭐⭐⭐ |
| 2 — Loki aggregation | 1–2 d | 3 (Loki, Promtail/Alloy, Grafana) | ⭐⭐⭐ |
| 3 — Prometheus metrics | 2–3 d | 3 (Prometheus, cAdvisor, node_exporter) | ⭐⭐⭐ |
| 4 — Alerting + uptime | 1–2 d | 1 (Uptime Kuma) | ⭐⭐⭐ |
| 5 — Sentry (FE/mobile) | 1–2 d | 0–1 (SaaS or self-host) | ⭐⭐ |
| 6 — Tracing (Tempo + OTel) | 2–3 d | 1 (Tempo) | ⭐⭐ |

**Total core (1–4): ~1–1.5 weeks.** Resource footprint for the full self-hosted stack is modest
(~1.5–2 GB RAM) — fits a single production host alongside the app.

---

## 10. First concrete steps (if approved)

1. Add `logstash-logback-encoder` + a shared `logback-spring.xml` to all three Spring services;
   add the MDC `X-Request-Id` servlet filter (start with core-service as the template).
2. Swap gateway `morgan` → `pino-http` with request-ID generation + auth redaction.
3. Land `docker-compose.observability.yml` (Loki + Promtail + Grafana) and confirm logs flow.
4. Add actuator + micrometer-prometheus to user-service & ticketing-service; stand up Prometheus.
5. Import baseline Grafana dashboards (Spring Boot / Micrometer 4701, JVM 4321, cAdvisor 14282,
   Node) and wire the first four alerts.
