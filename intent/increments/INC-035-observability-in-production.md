---
id: INC-035
title: The production VPS reports its own health, running an observability floor and nothing more
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

The production host's CPU, memory, disk, containers, services and logs are visible in Grafana running
on that host, scoped to the floor [ADR-021](../decisions/ADR-021-operational-telemetry-lives-in-grafana.md)
defines.

## Why now

Production has been serving traffic since 2026-09-21 and reports nothing about itself. The stack that
would report it exists but was written against a development laptop: its scrape targets resolve only
through `host.docker.internal`, its Grafana password defaults to `admin`, and every one of its six UIs
binds to every interface. Bringing it up unchanged on a public host would be worse than having
nothing. Each of those is a small fix, and none of them has been made because nobody has yet decided
how much of the stack production should run at all — which is what ADR-021 settles.

## Design

- `docker-compose.observability.production.yml` — a standalone file, not an overlay of the dev one.
  Compose concatenates array fields (`ports` among them) across `-f` files rather than replacing
  them, so an overlay could not actually remove the dev file's public port bindings; standalone is
  also the choice `docker-compose.production.yml` already made over `docker-compose.yml`, for the
  same reason. It joins the app stack's `busmate_default` network and scrapes by service name,
  instead of reaching for a host gateway that production does not publish ports to.
- Grafana's dev-shared datasource provisioning wires a Tempo datasource; since Tempo isn't part of
  this stack, that's mounted from a small `grafana/provisioning-production/datasources/` override
  instead of the dev directory, so Grafana never shows a datasource that always errors.
- Scrape targets become environment-specific. `telemetry-service` is deliberately not deployed
  (INC-032), so in production it is dropped rather than left as a permanently-down target that
  trains the reader to ignore the targets page.
- Retention is capped by size as well as by time, because the disk is shared with Postgres and MinIO.
  Loki drops to a shorter window in production than the development 14 days, and Prometheus gets a
  size limit alongside its time limit.
- Grafana takes a real password from `config/secrets/.env`, keeps sign-up and anonymous access off,
  and binds to the loopback interface. Prometheus, Loki and Alloy do the same. Nothing is published
  through Caddy.
- Alloy stops collecting the observability stack's own containers, which currently ship their logs
  into the Loki that serves them.
- Tracing stays off in production, per ADR-021, so Tempo is not deployed and `OTEL_SDK_DISABLED`
  stays as INC-032 set it.

## Acceptance criteria

- [ ] Prometheus on the VPS shows every deployed service as up, scraped by service name, with no
      permanently-down target.
- [ ] All four provisioned dashboards render real data from the production host.
- [ ] Grafana, Prometheus, Loki and Alloy are unreachable from the public internet, and Grafana
      refuses the default password.
- [ ] Production logs are searchable in Loki with `service` and `level` parsed.
- [x] The observability stack's own containers do not appear in Loki.
- [ ] Measured free memory with both stacks running still satisfies the app stack's declared limits.
- [x] Tracing is still disabled in production.

The files are built and the two riskiest, previously-unverified mechanisms were proved against real
containers in dev, not just config syntax: `prometheus.production.yml` scraped `core-service` and
`ticketing-service` as `up` by Compose service name alone, over a real `busmate_default` network
(the same mechanism the VPS needs, since `docker-compose.production.yml` publishes only
api-gateway's port); and after the Alloy regex fix, fresh logs from the app stack ship into Loki
while none ship from the observability stack's own containers — checked by querying Loki directly
for each, not by inspecting config.

`api-gateway` and `user-service` stayed unreachable in that run only because something already
listens on this dev machine's port 9020 outside Docker — unrelated to the scrape config, which is
otherwise identical for all four services. `uptime-kuma` was not started: this machine's disk had no
room left for one more image pull, so verifying it, the dashboards actually rendering, real memory
headroom, and Grafana's admin-password requirement from the failure side are still owed, against the
real VPS where none of those constraints apply.

## Out of scope

- Alert delivery and the missing alert rules — INC-036.
- Backups — INC-037.
- The portal's mock operations surfaces — INC-038.
- Configuring Sentry DSNs, and the public status page.
- Publishing Grafana through Caddy, or giving it single sign-on.

## Constraints

- R3: touches `docker-compose.production.yml` and `config/secrets/**`. Named reviewer required.
- The VPS has 7.8 GiB of memory and a 154 GB disk shared with Postgres and MinIO. A floor that cannot
  be shown to fit does not ship.
- Loopback plus an SSH tunnel only. Exposing an observability UI publicly is a separate decision, not
  a convenience taken here.

## Open questions

- Whether cAdvisor earns a permanent place on a 4-vCPU host, or whether node-exporter plus the
  container metrics Docker already exposes are enough. Worth measuring during this increment rather
  than assuming.

## Decisions

- See ADR-021
