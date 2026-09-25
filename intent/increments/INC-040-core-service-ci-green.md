---
id: INC-040
title: A create response tells the truth about when the record was created, and CI goes green
state: active
track: 1
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

`POST` responses in core-service carry the `createdAt`/`updatedAt` they claim to, and
`backend-ci.yml` passes on `main` for the first time.

## Why now

Backend CI has failed on every run since it first executed, on every branch and every merge to
`main`, always in the same job. Increments have been merged over a red pipeline throughout, which
is how a gate stops being a gate: nobody reads a signal that is always red, so the next real
regression arrives unnoticed.

Fixing it surfaced that it was two independent bugs, not one, because the first one had been
masking the second everywhere it was checked before now: locally, where the fix was written and
verified, a real secrets file happens to be present and hid the second one completely.

## Design

Two unrelated defects, found in sequence rather than both at once — the second was invisible until
the first was fixed and CI was re-run for real, because every prior local run had a real secrets
file sitting in the working tree that no CI run has ever had.

**First: a create response returning `createdAt`/`updatedAt` as null.** `BaseEntity`
stamps `createdAt`/`updatedAt` with Hibernate's `@CreationTimestamp`/`@UpdateTimestamp`,
which are applied immediately *before the INSERT statement executes* — that is, at flush. Every
create path in the service is `@Transactional` and maps the entity to its response DTO straight
after `save()`, while the flush is still pending, so it reads the fields before anything has written
them. The row gets its timestamps at commit; the response never sees them.

The fix is to stamp them where the rest of this codebase already stamps things:
`ProvenancedEntity` sets `provenance` in a JPA `@PrePersist` callback, which fires synchronously
inside `persist()` — and `provenance` is, correspondingly, the one audit-ish field that *is*
populated in the same create response. Moving `createdAt`/`updatedAt` to `@PrePersist`/`@PreUpdate`
puts them on that same working path.

- One change in `BaseEntity`, not `saveAndFlush` sprinkled through twelve services. Every create
  path in core-service has this shape, so a per-call-site fix would leave the API inconsistent
  (stops honest, buses still lying) and add a DB round-trip per create to paper over a mapping
  problem.
- The Hibernate annotations are removed rather than left alongside the callbacks. Keeping both
  means the value returned to the client and the value stored in the row are generated at two
  different moments — close enough to look right, different enough to be a puzzle later.
- One deliberate behavioural difference: the callback keeps an explicitly-set `createdAt` instead
  of overwriting it, where the Hibernate generator always won. The only write path that sets one
  by hand sets it to the current time anyway, so nothing changes today — but it means an importer
  can preserve a record's real original creation time rather than having it silently restamped,
  which is the behaviour worth having if bulk import ever carries one.

**Second: every test needing the full application context failing at startup**, not just the one
the first bug's assertion pointed at. core-service's media-storage configuration requires real S3
credentials, sourced in development from a secrets file that is deliberately never committed and
so is never present in CI. Every other backend service that has this same S3 dependency already
gives its test profile safe placeholder values for exactly this reason — user-service's own test
config says as much in so many words. core-service's test profile was simply never given the same
treatment, so its test context has been failing to start in CI from the day the workflow was
written; it was invisible locally only because a real secrets file happens to sit in the working
tree there. Fixed the same way the sibling service already does: safe non-real placeholder values
in the test profile, which the one test that needs real S3 behaviour already overrides for itself
against its own Testcontainers instance.

## Acceptance criteria

- [x] core-service's full Maven verify passes with no failing tests, including with no secrets
      file present in the working tree — the condition CI actually runs under, reproduced and
      checked directly rather than assumed.
- [x] A create response carries a non-null `createdAt`/`updatedAt`, and they match what a
      subsequent read of the same record returns.
- [ ] Backend CI is green on this branch's PR, including the services this does not touch.

## Out of scope

- The dormant JPA-auditing item (`@CreatedBy`/`@LastModifiedBy`). `createdBy`/`updatedBy` are set
  by hand in each service today and already reach the response correctly; making them automatic is
  the audit-trail work in the backlog, not this.
- The other three services' suites. They pass, and nothing here touches them.
- Whether every create endpoint *should* return an audit block at all — a contract question, not a
  reason to keep returning a field that is declared and null.

## Constraints

- R2 (`apps/backend/core-service/**`). `BaseEntity` is core-service-only — no other service has a
  copy — so the blast radius stops at this service, but it is every entity within it.
- A2, not the A3 that R2 allows for Testcontainers-covered changes: the suite covers the failing
  assertion well, but exactly one test asserts this field on exactly one entity, so the honest
  answer for the rest of the blast radius is still a human reading carefully.
- No schema change. The columns, their nullability and the DTO shape are all unchanged — this moves
  *when* a value is computed, not what is stored.

## Open questions

- Whether `updatedAt` should equal `createdAt` on insert or stay null until the first real update.
  This keeps today's behaviour (both set on insert), because that is what the stored row already
  looks like and what every existing read returns.

## Decisions

- None beyond the above; no ADR — this restores intended behaviour rather than choosing a new one.
