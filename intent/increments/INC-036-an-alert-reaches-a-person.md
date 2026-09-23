---
id: INC-036
title: An alert reaches a person, and the disk is one of the things it warns about
state: shaped
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

- One real contact point, and routing split by severity so a warning cannot bury a critical.
- New rules: host disk low, at a threshold that leaves room to act rather than room to notice;
  Postgres unreachable; and a container in a restart loop, which today looks healthy to every existing
  rule between restarts.
- Postgres and MinIO join the service-down rule's job list. To a user, losing either is
  indistinguishable from an outage, so the rules should not distinguish them either.
- Each new rule gets its RUNBOOK section in the same change — the runbook's own stated rule — and the
  README's alert count is corrected to match the file, which it currently does not.
- Every rule is test-fired once, delivery included. A rule that has never fired is a hypothesis.

## Acceptance criteria

- [ ] A deliberately triggered critical alert arrives in the chosen channel, and so does its
      resolution.
- [ ] Stopping Postgres produces a critical alert that names Postgres.
- [ ] Crossing the disk threshold produces the disk alert.
- [ ] A container restarting repeatedly produces an alert while it is still restarting.
- [ ] Every rule in `rules.yaml` has a RUNBOOK section, and the README's count matches the file.
- [ ] Criticals and warnings arrive by different routes.

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

- Which channel. Telegram and Discord each need only an outbound POST. Email needs an SMTP provider —
  the VPS blocks outbound port 25 and has nothing on 587 yet, which is the same gap that leaves
  password-reset mail undelivered, so solving it here may solve two things or may drag an unrelated
  decision into this increment.

## Decisions

- See ADR-021
