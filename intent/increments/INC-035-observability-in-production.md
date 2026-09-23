---
id: INC-035
title: The production VPS reports its own health, running an observability floor and nothing more
state: shaped
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

- A production overlay for `docker-compose.observability.yml` joins the app stack's network and
  scrapes by service name, instead of reaching for a host gateway that production does not publish
  ports to.
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
- [ ] The observability stack's own containers do not appear in Loki.
- [ ] Measured free memory with both stacks running still satisfies the app stack's declared limits.
- [ ] Tracing is still disabled in production.

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
