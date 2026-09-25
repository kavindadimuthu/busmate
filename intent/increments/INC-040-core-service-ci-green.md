---
id: INC-040
title: A create response tells the truth about when the record was created, and CI goes green
state: in-review
track: 1
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

`backend-ci.yml` passes on `main` for the first time, and the same gates can be run locally before
pushing. Along the way, `POST` responses in core-service carry the `createdAt`/`updatedAt` they claim
to.

## Why now

Backend CI has failed on every run since it first executed, on every branch and every merge to
`main`, always in the same job. Increments have been merged over a red pipeline throughout, which
is how a gate stops being a gate: nobody reads a signal that is always red, so the next real
regression arrives unnoticed.

Fixing it surfaced that it was several independent problems, not one — each only visible once the
one before it was fixed and pushed for a real CI run. Two of them had been hiding behind the local
environment (a secrets file, a warm Docker image cache), which is why "it passes on my machine" was
true the whole time.

## Design

Several unrelated problems, found in sequence rather than all at once — each was invisible until
the one before it was fixed and CI was re-run for real.

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

**Third: a Testcontainers MinIO image pull reliably timing out on the runner.** With the first two
fixed, the one core-service test class that starts its own MinIO container (separate from the
Postgres one every test shares) failed on two separate, independent CI runs with the same
exception: Testcontainers gives an image pull two minutes before giving up, and pulling
`quay.io/minio/minio` from this runner consistently took longer than that. Not a one-off — checked
by re-running the identical CI job a second time and getting the identical failure before treating
it as a real problem rather than registry flakiness worth ignoring. First attempt: pull the image
in its own CI step ahead of the test run, so it hits that step's own far longer default timeout
instead of Testcontainers' two minutes.

**Fourth: the pre-pull failing outright, on every retry, with `unauthorized`.** Not throttling:
the same anonymous pull is denied from a non-CI machine too. MinIO's own `quay.io/minio/minio`
image no longer serves anonymous pulls, and the old Docker Hub `minio/minio` is gone. Every local
run had passed only because the image was already in the local Docker cache — the cache hid the
failure exactly as the secrets file hid the second problem. It also broke user-service, which has
two MinIO test classes and had been assumed unaffected. Fixed by pointing the three MinIO test
classes at `bitnamilegacy/minio` from Docker Hub (still real MinIO, pinned to a release), and
verified with the quay image removed from the local cache so the run matches the runner.

**Fifth, not a defect: a way to run the gates locally.** Every cause above cost a push and a wait on
GitHub's runners to discover. `make ci-local` (`scripts/ci-local.sh`) runs the workflow's two gates —
Flyway migrate + validate, and each service's `mvn verify` — against throwaway containers, narrowable
to one gate or service. `backend-ci.yml` stays the source of truth and the script mirrors it. It is
honest about its limit: it cannot reproduce a runner's network or a cold cache on its own, and two of
the four causes above passed locally, so a green local run is necessary, not sufficient.

## Acceptance criteria

- [x] core-service's full Maven verify passes with no failing tests, including with no secrets
      file present in the working tree — the condition CI actually runs under, reproduced and
      checked directly rather than assumed.
- [x] A create response carries a non-null `createdAt`/`updatedAt`, and they match what a
      subsequent read of the same record returns.
- [x] Backend CI is green on this branch's PR, including the services this does not touch — all
      eight jobs, on a real GitHub Actions run.
- [x] The stale claims that CI had never run are corrected where they lived (`context.md`,
      `policy.yaml`, the workflow's own header), and now point at `make ci-local`.

## Out of scope

- The dormant JPA-auditing item (`@CreatedBy`/`@LastModifiedBy`). `createdBy`/`updatedBy` are set
  by hand in each service today and already reach the response correctly; making them automatic is
  the audit-trail work in the backlog, not this.
- Production and dev compose, which still pin `quay.io/minio/minio` — see Open questions.
- Whether every create endpoint *should* return an audit block at all — a contract question, not a
  reason to keep returning a field that is declared and null.

## Constraints

- Spans two risk classes, so the increment takes the higher one (R3): `apps/backend/**` test code
  is R2, and the CI pre-pull step touches `.github/workflows/**`, which policy.yaml classes as R3
  on its own — a workflow change affects what every future PR's gate actually checks, not just this
  one.
- A2 throughout. R2 alone would allow A3 for a Testcontainers-covered change, but exactly one test
  asserts the first bug's field on exactly one entity, and `.github/workflows/**` caps at A2
  regardless — the honest answer for both is a human reading carefully.
- No schema change. The columns, their nullability and the DTO shape are all unchanged — the first
  fix moves *when* a value is computed, not what is stored.
- The CI change is additive only: one pre-pull step, for the two services with MinIO tests, of the
  exact image those tests request. Nothing about what gets tested changes.
- `scripts/ci-local.sh` and its `Makefile` target are developer tooling, not a gate: nothing depends
  on them, and CI never calls them.

## Open questions

- Whether `updatedAt` should equal `createdAt` on insert or stay null until the first real update.
  This keeps today's behaviour (both set on insert), because that is what the stored row already
  looks like and what every existing read returns.
- `docker-compose.yml` and `docker-compose.production.yml` still pin the quay.io MinIO image, which
  can no longer be pulled anonymously. A host that already has it cached keeps working; a fresh
  bring-up will not. Which MinIO image the real stack should run is a production decision, not made
  here.
- `bitnamilegacy` is a frozen archive, fine for tests but not something to depend on for years.

## Decisions

- None beyond the above; no ADR — this restores intended behaviour rather than choosing a new one.
