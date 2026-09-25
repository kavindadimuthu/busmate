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
`main`, always in the same job and on the same single assertion. Increments have been merged over a
red pipeline throughout, which is how a gate stops being a gate: nobody reads a signal that is
always red, so the next real regression arrives unnoticed.

The assertion is not wrong. Creating a stop returns `createdAt` as null while the row it just
created demonstrably has a creation time — reading the same stop back a moment later returns it
populated. Any client that shows "created" straight after creating something gets nothing.

## Design

`BaseEntity` stamps `createdAt`/`updatedAt` with Hibernate's `@CreationTimestamp`/`@UpdateTimestamp`,
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

## Acceptance criteria

- [x] core-service's full Maven verify passes locally, with no failing tests.
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
