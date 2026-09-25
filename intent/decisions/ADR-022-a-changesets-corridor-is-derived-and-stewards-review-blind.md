# ADR-022 · A changeset's corridor is derived from what it touches, and stewards review without the proposer's identity

**Date:** 2026-09-25 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-019](ADR-019-contributor-standing-lives-with-the-network.md) decided that a steward's authority is a
set of route groups, and that promotion is a human decision informed by track record. It did not say how a
*changeset* is placed in a corridor. A stop is not owned by a route group: it is served by routes, which
belong to groups, and a brand-new stop is served by nothing yet. Building steward review needs an answer,
plus three smaller ones ADR-019 left open: what a steward sees of the proposer, what suspension does to
stewardship, and what "informed by track record" means in practice.

## Options considered

1. **Store a corridor on the changeset when it is proposed.** Cheap to query, but goes stale the day a route
   is re-grouped, and needs a backfill for the stop proposals already decided.
2. **Derive it when read.** Always current; costs a lookup per proposal, which at pilot volume (5–10
   contributors) is nothing.
3. **Let any steward review anything** — rejected in ADR-019's own reasoning: expertise is local.

## Decision

**Option 2.** A changeset is inside a steward's scope when:

- **UPDATE:** the target stop is served by at least one route whose group is in the steward's scope.
- **CREATE:** the proposer's *declared* corridors (from their application) overlap the steward's scope.

A changeset that matches no steward — a stop on no route, a proposer who declared no corridor — is
**staff-only**. That is deliberate: ambiguity resolves to more scrutiny, never less.

Further, and all of them fail-closed:

- **Stewards see proposals without the proposer's identity.** The proposer's user id is withheld from a
  steward's view; declared affiliation and approved/rejected/reverted counts stay, because those are what
  a reviewer needs. Staff still see everything. A steward can never decide their own proposal (unchanged).
- **Staff appoint and revoke stewards; nothing promotes anyone by itself.** The portal lists *promotion
  candidates* — active contributors whose record clears configured thresholds (approved count, approval
  rate, time as a contributor, no reverted approvals) — and a human decides. Thresholds are configuration,
  not law: they tune how many people staff are shown, not who may be appointed.
- **Suspension ends stewardship.** Suspending a contributor resets their level and clears their scope;
  reinstating returns a plain contributor. Standing is read on every request, so this takes effect at once.
- **Revert stays staff-only.** A steward can approve and reject; undoing an approval is a staff decision.
- **Approving into official data is unchanged.** A steward's approval passes the same staleness and
  precedence checks staff approval does — it can never overwrite a higher tier.

## Consequences

- The passenger-facing token still says `passenger`; stewardship is checked in core-service on every
  review request, and a passenger with no steward standing gets the same refusal as before.
- Review authorisation now depends on a query per proposal. Fine at pilot scale; if a queue ever runs to
  thousands, store the corridor and revisit.
- A contributor who declared no corridors can only be reviewed by staff. Applicants are therefore nudged to
  name at least one.

## Revisit when

- A steward's scope needs to be finer than a route group (a district, or a single route).
- Queue volume makes the derived lookup slow.
- Blind review proves to hurt more than it helps — for example, stewards cannot tell that two proposals
  came from one person.
