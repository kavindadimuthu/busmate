---
id: INC-001
title: Triage docs/ down to the reference material that is actually true
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A3
---

## Goal

Anyone — human or agent — opening this repo finds exactly one methodology and one set of dev guides,
and can trust that what they read is still true. Today they find five competing methodologies and
~112,000 words, most of it describing a system that has since changed.

## Why now

HACO's foundation landed in `3a463bf2`, and `CLAUDE.md` claims to supersede the earlier agent guides
— but those guides are still sitting in `docs/` where anything that greps the repo will find them.
The repo is currently in a worse state than before adoption: five methodologies instead of four.
Half-finished is the one outcome not worth keeping.

## Acceptance criteria

- [x] No file under `docs/` describes a development methodology, agent operating model, or
      governance process. HACO is the only one, and it lives in `CLAUDE.md` + `intent/`.
- [x] Every still-actionable gap or unfinished phase from the deleted material is either a line in
      `intent/backlog.md` or was deliberately dropped as no longer worth doing.
- [x] Every architectural fact from the deleted material that is still true and not recoverable from
      the code is in `intent/context.md`.
- [x] `docs/README.md` exists and states what belongs in `docs/` versus `intent/`.
- [x] Zero broken relative links anywhere in `docs/` and `intent/` — verified by a script run, not
      by eye.
- [x] No script, workflow, or config file references a path that was deleted.
- [x] `docs/` total word count is under 35,000, down from ~101,000 (~112,000 before `strategy/`
      moved to `intent/` in the foundation commit). **Revised from 20,000**: that target assumed
      `docs/plans/` could be deleted, which it cannot — it is ~16,000 words pinned in place by 51
      code references.

## Out of scope

- Consolidating the 12 dev guides into ~5 — that is Phase 3 and its own increment. This increment
  keeps the guides where they are and only fixes references into them.
- Writing frontend CI (INC-002).
- Any change to `apps/`, `libs/`, or test code.

## Constraints

- Deletion, not archiving — decided with the owner. Git retains everything; a `docs/archive/` that
  nobody ever empties is the failure mode being avoided.
- `intent/policy.yaml` references `docs/guides/dev-seed-contract.md`, a path that turned out to be
  unreachable (see Discovered during the work). Corrected to `docs/dev-seed-contract.md`.
- Harvest before deleting. Once the delete commit lands, recovering a missed item means archaeology.

## Open questions

- ~~Does `docs/transit-workflow-evaluation/` hold domain knowledge that is genuinely unrecoverable
  elsewhere?~~ **Resolved.** Its README's verdict and four cross-cutting themes are durable and go to
  `context.md`; the eight stage docs are point-in-time snapshots and are deleted.

## Discovered during the work

**`docs/plans/` cannot be deleted.** It is referenced from **51 places across 45 files** — including
`application.yml` configs, Java test base classes, `libs/iot-schemas/schemas/envelope.v1.json`, and
**applied Flyway migration and seed SQL files**. Those migration comments are effectively immutable:
editing an applied `V*` file changes its checksum and `flyway validate` fails, which is a gate in
`backend-ci.yml`. So the referenced paths must stay exactly where they are.

Consequences, all of which narrow this increment rather than expanding it:

1. `docs/plans/` stays. It is relabelled as a historical design record rather than an active plan,
   and its remaining-work items are harvested to the backlog. Two of the four plans are fully
   complete; the record is what code comments point at for rationale.
2. `docs/ui/10-scalable-ui-development-approach.md` stays — referenced from
   `libs/ui/src/resource/index.ts`. Docs 00–09 are deleted.
3. Every root-level `docs/*.md` guide stays at its current path. Several are referenced from seed
   SQL, `emqx.conf`, `docker-compose.production.yml`, and `scripts/*.sh`.
4. **Phase 3 must be rescoped.** Moving guides into `docs/guides/` would strand these references.
   Phase 3 becomes "merge overlapping guide *content*, keep the referenced filenames in place."
   `intent/policy.yaml` is corrected here to point at the real path rather than the planned one.

Revised deletion set: five directories plus `docs/ui/00`–`09`, roughly 65,000 words rather than the
80,000 originally estimated.

## Decisions

- Supersedes `docs/system-capability-audit/` (a capture-and-backlog playbook, 1 of 10 sections ever
  completed) and `docs/system-model-and-documentation-sync-plan/` (14 documents, self-described as
  "no implementation is performed by this plan"). Neither was adopted. HACO replaces both.
- No ADR needed: this changes no architecture, only which documents exist.
