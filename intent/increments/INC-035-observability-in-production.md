---
id: INC-035
title: The production VPS reports its own health, running an observability floor and nothing more
state: in-review
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

- [x] Prometheus on the VPS shows every deployed service as up, scraped by service name, with no
      permanently-down target.
- [x] All four provisioned dashboards render real data from the production host.
- [x] Grafana, Prometheus, Loki and Alloy are unreachable from the public internet, and Grafana
      refuses the default password.
- [x] Production logs are searchable in Loki with `service` and `level` parsed.
- [x] The observability stack's own containers do not appear in Loki.
- [x] Measured free memory with both stacks running still satisfies the app stack's declared limits.
- [x] Tracing is still disabled in production.

Verified twice against real containers in dev, not just config syntax — a second pass with more
disk headroom completed what the first left open, and found one more real bug in the process.

**First pass:** `prometheus.production.yml` scraped `core-service` and `ticketing-service` as `up`
by Compose service name alone over a real `busmate_default` network — the mechanism the VPS needs,
since `docker-compose.production.yml` publishes only api-gateway's port. After the Alloy regex fix,
fresh logs from the app stack shipped into Loki while none shipped from the observability stack's
own containers — checked by querying Loki directly for each. `api-gateway` and `user-service`
stayed unreachable only because something else on that machine held port 9020 outside Docker;
`uptime-kuma` didn't start because the disk had no room for one more image pull.

**Second pass**, after the disk was cleared: all seven Prometheus targets showed `up`, including
`api-gateway` and `user-service` — the port conflict was gone. `uptime-kuma` came up and answered
on its port. `docker compose config` (no `up`) refused to resolve at all without
`GRAFANA_ADMIN_PASSWORD` set, confirmed by unsetting it and reading the error — the strongest form
of "refuses the default password" the compose file can express, since there is no default to fall
back to. Grafana's own `/api/ds/query` endpoint (the same call every dashboard panel makes) returned
real `up` data from Prometheus and a real log stream from Loki — not just raw Prometheus/Loki APIs.

**The bug this pass found:** the reused Grafana volume (initialised months earlier, in a dev-only
session) still carried a Tempo datasource from the shared dev provisioning directory, because
Grafana's file provisioner does not delete a datasource just because it stops appearing in the
mounted directory — only `deleteDatasources:` tells it to. Fixed by adding that stanza to
`grafana/provisioning-production/datasources/datasources.yml`; recreating Grafana afterward left
exactly Prometheus and Loki. A fresh volume never has this problem, but the fix is correct
regardless of a volume's history, which is worth more than depending on every deploy being fresh.

Memory headroom is the one criterion the dev machine could not answer honestly, and it is now
answered for real: brought up on the production VPS itself (2026-09-23), all seven services showed
`up` in Prometheus against real production traffic — `up` for the first time ever, not a dry run.
`free -h` showed 5.1 GiB still available with both stacks running, well above the floor's ~1.3 GiB
estimate. Every UI is bound to `127.0.0.1` as designed (confirmed in `docker ps`'s port list — bare
`9100`/`8080` with no host mapping for node-exporter/cadvisor, `127.0.0.1:port->port` for the rest);
the app stack's eight containers stayed untouched at 42+ hours uptime throughout, and
`https://busmate.site` returned 200 before and after. Grafana logged in with the generated password
on a genuinely fresh volume — the `deleteDatasources` fix found in the second dev pass was
confirmed a correct no-op there: no Tempo ever appeared. And the one thing dev's non-prod Spring
profile couldn't show — real production logs are JSON, so `level` parses for real — is now
confirmed too: `level: DEBUG` on a live `core-service` line, queried straight out of Loki.

Deployed by reconciling the server first: it was still on the pre-INC-034 commit with the same
hand-applied MinIO patch and untracked `bootstrap-admin.sh` recorded as the server's drift in
INC-034 and in memory — `git diff` against the incoming `origin/main` showed it byte-identical to
what was already running, so `git checkout -- .` + `rm scripts/bootstrap-admin.sh` + `git pull` was
safe with no container restart required for that step. `GRAFANA_ADMIN_PASSWORD` was generated with
`openssl rand` and given to the owner directly (their choice, not written only to a file); the
Discord webhook already set in the owner's local `config/secrets/.env` was piped straight into the
server's over SSH stdin, never printed to any terminal output.

All seven acceptance criteria are met, against the real production host. `uptime-kuma` came up but
has no monitors configured yet — that, and wiring the alert webhook into Grafana's contact point,
are INC-036.

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
