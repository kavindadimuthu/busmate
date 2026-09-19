# ADR-019 · Contributor standing lives with the network, not in account roles

**Date:** 2026-09-19 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-017](ADR-017-community-contributors-produce-reference-data-before-p3.md) introduces a trust ladder:
anyone may report, accepted contributors may propose, stewards may review others' proposals within a
scope, and staff hold final authority. Something has to record who stands where.

user-service owns identity and permissions, but an account has exactly one `user_type`, and core-service
authorises from the `user_type` in the token. A contributor is still a passenger: they book tickets and
keep their passenger account. A steward's authority is scoped — to certain corridors, not the whole
network — and user-service's permissions are global. Standing also has to move with a contributor's
track record, and that record is the outcome of changesets, which core-service owns
([ADR-018](ADR-018-community-changes-are-reviewed-changesets.md)).

## Options considered

1. **A new `contributor` user type.** An account cannot be passenger and contributor at once; becoming a
   contributor would cost someone their passenger account or force a second one.
2. **Permission overrides in user-service.** They exist per user, but carry no scope, core-service does not
   read permissions from the token, and every proposal would need a cross-service call to learn what
   core-service could know itself.
3. **Standing held in a core-service community module, keyed by user id.** The account stays `passenger`;
   core-service records level, status and scope, and derives track record from the changesets it owns.

## Decision

**Option 3.** The same shape as the operator ↔ user link: user-service says who someone is, core-service
says what they may do to the network.

| Level | Who | May | Becomes it by |
|---|---|---|---|
| **Reporter** | Any signed-in passenger | Flag a record as wrong; confirm or deny a time | Having an account — no row needed |
| **Contributor** | Accepted applicant, current agreement accepted | Propose changesets; see their own history | Applying and being accepted by staff |
| **Steward** | Contributor appointed to a scope | Approve or reject others' changesets inside that scope | Staff appointment, informed by track record |
| **Staff** | `mot`, `admin` | Everything above, anywhere; accept, suspend, appoint, revert | Their account |

- **Promotion is always a human decision.** Track record informs it and is shown beside it; it never
  promotes anyone by itself. Suspension is immediate and needs no track record.
- **A steward's scope is a set of route groups** — corridors, matching how passengers and enthusiasts
  think about the network and the corridor-first strategy in
  [03 §4](../strategy/03-strategy-and-roadmap.md).
- **Declared affiliation** with any operator is part of the application and shown to every reviewer of that
  contributor's changesets.
- **Where the interfaces live.** Contributors and stewards are passengers, and the staff portal admits
  staff only, so their workspace is in `passenger-web`, and field capture — standing at a stop or reading
  a timetable board — is in `passenger-mobile`. Staff review, contributor management and reverts are in
  `new-react-portal`.

## Consequences

- No change to user types, tokens, or the gateway's staff-only portal gate. A contributor's name and
  contact still come from user-service over its API; core-service does not copy them.
- Core-service gains a community module (`com.busmate.routeschedule.community`) with its own tables.
- Every contributor or steward action is authorised in core-service by looking up standing for the caller,
  which the token alone cannot answer. That lookup must fail closed: no standing row means reporter rights
  only.
- If contributors ever need tools that only the staff portal can host, the portal's staff-only gate has to
  change — a security decision in its own right, not a side effect of this one.

## Revisit when

- Someone who is not a passenger — an operator's employee, an MOT officer — needs contributor rights under
  their own account.
- Scoping by route group proves wrong in practice, for example because stewards organise by district.
