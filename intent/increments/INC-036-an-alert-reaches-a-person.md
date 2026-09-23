---
id: INC-036
title: An alert reaches a person, and the disk is one of the things it warns about
state: active
track: 1
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Every critical condition BusMate defines is delivered to somewhere a person reads within minutes, and
the rule set covers the failure most likely to take this particular host down.

## Why now

Seven alert rules evaluate correctly and notify nobody: the single contact point posts to a localhost
address nothing listens on. An alert that reaches no one is a dashboard panel with extra steps, and the
one real incident it caught — four containers down — was noticed by a person who happened to be
looking.

Separately, the rule set was written for a laptop and has no disk alert. On this host the single most
likely failure is a 154 GB disk shared between Postgres, MinIO, Prometheus and Loki filling up, which
does not degrade the platform gracefully — it stops the database. Losing Postgres or MinIO is also
invisible to the current rules, which watch only the four application services.

## Design

- One real contact point (Discord, native `type: discord` rather than the generic webhook type —
  a real Discord embed, not plain Slack-shaped JSON), and routing split by severity in
  `policies.yaml` so a warning cannot bury a critical, even sharing the one channel: a critical
  groups within 10s and repeats every 30 minutes while still firing; a warning groups over a
  full minute and repeats only every 6 hours.
- New rules: host disk low (critical — a full disk stops Postgres, not just degrades something),
  a container restart loop (critical, no `for` delay), and Postgres/MinIO folded into the
  existing service-down rule rather than a separate one, via `blackbox-exporter` probing them
  (`tcp_connect` and `http_2xx` respectively) since neither exposes its own metrics endpoint.
  `busmate-service-down`'s query becomes `up{job=~"..."} or probe_success`, and its annotation
  switched from `{{ $labels.job }}` to `{{ $labels.instance }}` — the one label both branches
  carry meaningfully.
- Each new rule gets its RUNBOOK section in the same change, and the README's alert count is
  corrected (6 stated, 7 actually provisioned even before this increment — finding #8 in the
  INC-035 audit; 9 now).
- Every rule is test-fired once against a real condition, not just checked for valid syntax.

## Acceptance criteria

- [ ] A deliberately triggered critical alert arrives in the chosen channel, and so does its
      resolution. *(Needs the real production webhook — deliberately not tested against the
      owner's actual Discord channel from a local dry run. Verify on deploy.)*
- [x] Stopping Postgres produces a critical alert that names Postgres.
- [x] Crossing the disk threshold produces the disk alert.
- [x] A container restarting repeatedly produces an alert while it is still restarting.
- [x] Every rule in `rules.yaml` has a RUNBOOK section, and the README's count matches the file.
- [x] Criticals and warnings arrive by different routes.

Verified against real containers in dev, not config syntax — and two of the three new mechanisms
turned out not to work as first written, which only real testing would have caught:

- **Stopping Postgres**: the combined `up{...} or probe_success` query correctly produced
  `Service down | postgres:5432 | active` in Grafana's own alertmanager API — proving the union
  query preserves per-series identity across two different metric names, not just one branch.
- **Disk threshold**: fired for real, unplanned — this dev machine's disk is genuinely at ~5%
  free, well under the 15% threshold, so `busmate-host-disk-low` was already firing before any
  deliberate test. A better proof than a synthetic one.
- **Restart loop, attempt 1 (failed):** `changes(container_start_time_seconds[10m])` never fired
  against a real crash-looping container, at any restart count. Root cause, found by inspecting
  raw samples: Docker's restart policy re-execs the process inside the *same* container/cgroup,
  so that metric's value never actually changes on restart — the premise the rule was built on
  was wrong. (A closer look also found cAdvisor tags this metric with a churning
  `container_label_restartcount` label that fragments the series on every restart, a real
  second bug, but fixing only that one — the label — left the rule still not firing, because the
  underlying value genuinely never moves.)
- **Restart loop, attempt 2 (works):** switched to counting how many *distinct*
  `container_label_restartcount` values appear over the 10-minute window — that label does track
  Docker's live restart count, just isn't directly thresholdable since it's a label, not a value.
  Also lowered cAdvisor's scrape interval to 5s (from the global 15s): a crash-looping container
  spends most of its time in Docker's own restart backoff, not actually running, so cAdvisor —
  which only has live stats while a container *is* running — needs to sample often enough to
  catch it. Confirmed firing against a container simulating realistic JVM startup-then-crash
  timing (~15s per cycle, not a millisecond `exit 1`, which is not representative of any real
  BusMate failure mode and was rightly caught by nothing).
- **Routing split**: confirmed via Grafana's own provisioning API — two distinct routes, correct
  `group_wait`/`repeat_interval` per severity, both resolving to the one real receiver.

A third real Grafana provisioning inconsistency, on top of INC-035's Tempo-datasource finding:
`deleteContactPoints` keys on `uid`, not `name` — `name: busmate-webhook` silently did nothing
(no error, "finished to provision alerting" logged as normal) while the stale generic-webhook
contact point from before this increment's Discord switch stayed put. Grafana's own provisioning
resources are not consistent with each other on this; don't assume one from the other.

## Out of scope

- Escalation beyond one channel, and any on-call rota.
- The public status page.
- Sentry, which reports a different class of failure and is its own decision.
- Alerting on business conditions (no trips generated, outbox backlog) — valuable, and it needs
  metrics that do not exist yet.

## Constraints

- R3: the delivery destination is a secret, set in `config/secrets/**` on the server.
- The channel must not add a runtime dependency to the stack. An outbound HTTPS POST is acceptable; a
  broker or an agent is not.
- Alert hygiene, per the runbook: a rule that fires with no action to take is retuned or deleted, not
  tolerated. That applies to the rules added here on their first false positive.

## Open questions

- ~~Which channel.~~ Decided: Discord. `ALERT_WEBHOOK_URL` is already set in the owner's local
  `config/secrets/.env`; it still needs copying to the production server's separate secrets file
  (never committed, generated fresh on the VPS) before this can go live there.
- Whether `blackbox-exporter`'s ~32Mi and the disk-comparable memory cost of the faster cAdvisor
  scrape are worth a second look once real traffic exists — negligible against the VPS's measured
  5.1 GiB headroom (INC-035) today, not worth gating this increment on.

## Decisions

- See ADR-021
