---
id: INC-019
title: An operator manages only their own conductors, keeps their documents, and pairs one with a usual bus
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

An operator creates, edits and lists only their own conductor accounts, keeps a conductor's
scanned documents (NIC, licences, clearances), gives a conductor a profile photo, and can name the
bus a conductor usually works — a convenience that pre-fills trip assignment, never the record
itself. MOT and admin keep platform-wide reach.

## Why now

user-service granted operators `user.conductor:*` at scope `any`, so any operator could read, edit
or delete any other operator's conductor accounts — flagged as a known gap in the backlog and in
the design doc (§5). Trip assignment already trusts the portal to only offer an operator's own
conductors (core-service comment on `assign-conductor`); this closes that gap at the source.

## Design

- **Scope, not a new permission.** `OperatorScope` narrows the existing `user.conductor:*` (scope
  `any`) to conductors whose profile's `assign_operator_id` is the caller's own core-service
  Operator, resolved via a new internal endpoint (`GET /internal/operators/by-user/{userId}`,
  cached 5 minutes since the link almost never changes) — never by reading core-service's tables.
  Admin and MOT accounts are untouched (`operatorScopeOf` returns empty for them).
- **The link is set by the server, not accepted from the client** — an operator cannot create a
  conductor for another operator, and cannot move a conductor between operators after the fact
  (`isOperatorLinkChange` refuses that patch for everyone but an admin).
- **Conductor documents** are a new user-service resource (`user_documents` table, S3 object
  storage — same DocumentSanitizer/MediaStorageService pattern as INC-018's bus documents),
  visible under the same read-access rule as the rest of the profile (conductor, their operator,
  MOT/admin) but writable only by a manager, never the conductor themselves.
- **Usual bus is a suggestion only** (design R5): `Bus.defaultConductorId` on core-service, set
  through a new endpoint that checks the conductor (over `ConductorDirectory`, an internal HTTP
  client to user-service) is active and works for the bus's own operator. It has no effect on trip
  assignment logic; the portal reads it only to pre-fill a picker.
- **Conductor accounts can now get a profile photo** in the portal (the upload endpoint already
  existed since INC-005; only the operator-facing UI to use it for someone else's account was
  missing).

## Acceptance criteria

- [ ] An operator's conductor list contains only their own conductors, filtered by the database.
- [ ] An operator cannot read, edit, suspend, delete, or download a document for another
      operator's conductor, or list any user type but conductor.
- [ ] A conductor created by an operator is always linked to that operator's own Operator id,
      regardless of what the request body said; creating any other user type is refused.
- [ ] Nobody but an admin can change which operator a conductor is linked to.
- [ ] A conductor's own account cannot manage its own documents (their operator does).
- [ ] Setting a bus's usual conductor is refused for an inactive account or one that works for a
      different operator; unset is always allowed.
- [ ] Tests named INC-019 cover the above against real Postgres and a real MinIO/S3.

## Out of scope

- Driver accounts (no driver identity exists yet, per context.md).
- Any change to who a trip's actual assigned conductor is, or to conductor-mobile.
