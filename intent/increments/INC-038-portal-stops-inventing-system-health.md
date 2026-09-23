---
id: INC-038
title: The portal stops reporting system health it cannot know
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

No staff screen renders invented operational data. The operations pages either show something real or
say plainly that they are not wired yet, and point at the tool that does know.

## Why now

`/admin/monitoring`, `/admin/logs` and `/admin/settings` render roughly 2,600 lines of generated data
as though it were production telemetry: a health score, CPU and memory bars, an alert list with
acknowledge and resolve actions, an editable alert-rules table, a maintenance panel, a backup panel,
and a control offering to restart a service. Nothing behind any of it exists.

This is worse than an empty page. A health indicator that cannot turn red teaches an operator to trust
a screen with no connection to the system, and it is a second alerting UI competing with the seven
rules that are genuinely provisioned. [ADR-021](../decisions/ADR-021-operational-telemetry-lives-in-grafana.md)
decided these surfaces are not where operational telemetry belongs, which makes them deletable rather
than a backlog of work. INC-037 sharpens the point for one of them: a backup panel reporting nothing
becomes a specific liability the moment backups are real.

## Design

- The mock operations data and the components that exist only to render it are deleted, not stubbed.
- The routes stay and show an honest empty state naming Grafana as where this lives, per ADR-021.
- The maintenance and backup panels go with them. Neither has ever done anything, and a control that
  appears to schedule downtime but does not is a worse failure than its absence.
- The alert-rules editor and the restart control are removed outright rather than disabled. An action
  on infrastructure does not belong in the product, so there is nothing to keep.
- Admin users and the self-profile surfaces are untouched: those are real, and they share a directory
  with what is being removed.

## Acceptance criteria

- [x] No staff screen displays a value derived from `data/admin/systemMonitoring.ts`, `logs.ts` or
      `systemSettings.ts`, and those files no longer exist.
- [x] The three routes load without error and state what they do not yet show.
- [x] No screen anywhere offers to restart a service or to edit an alert rule.
- [ ] Admin users and self-profile behave exactly as before.
- [x] `context.md`'s claim that monitoring surfaces run on mock data is narrowed to what is still true
      of the product surfaces.

The three routes were checked in a real browser against the dev server with the BFF session
mocked, which exercises rendering but not authentication — so the admin users and self-profile
criterion is still owed, against a signed-in session on the running stack.

## Out of scope

- The real capability-health tiles and the endpoint feeding them, which need a permission that does
  not exist yet.
- A real audit trail. The current "security logs" are mock and go in this increment; what replaces them
  is a different piece of work touching personal data.
- A real maintenance mode.
- The timekeeper, analytics and revenue mock surfaces. Those overstate *product* capability, which is a
  known debt of its own and not what this increment is about.

## Constraints

- R1, but `policy.yaml` caps frontend autonomy at A2 because no frontend CI gate exists. The deletion
  is verified by a person running the portal, not by a test suite.
- The one way this breaks is deleting a shared component that a real page also imports. Every removal
  is checked against its importers rather than assumed to be isolated.

## Open questions

- `core-service/.gitignore` carries the same unanchored `logs` pattern. Nothing is being lost there
  today — its `logs/` is a real runtime output directory — but the landmine is identical, and it is a
  backend path, so it is left for whoever next has reason to touch that service.

## Decisions

- See ADR-021
