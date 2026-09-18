# ADR-013 · Passenger fares collect into one BusMate account and settle to operators periodically

**Date:** 2026-09-17 · **Status:** Accepted
**Type:** commercial

## Context

Passenger self-service booking needs a real PSP. [ADR-010](ADR-010-payhere-for-conductor-card-payments.md)
already chose PayHere for conductor-collected card payments and gives the reasons no other
processor is reachable for a Sri Lankan merchant; none of that analysis changes here, so the PSP
question is settled and this record is only about **whose account the passenger's money lands in**.

A passenger buying a seat online pays before boarding, for a trip run by a private operator. The
money has to reach that operator eventually. Two structures can do that, and they differ in whether
BusMate ever holds funds belonging to someone else.

[context.md](../context.md) invariant 7 and [vision.md](../vision.md)'s anti-scope row both say
BusMate never takes custody of fare money. That constraint exists because holding money on behalf
of other businesses is a regulated activity in Sri Lanka — a payment-institution licence question
under CBSL, not a product-design preference. It was written when the only digital fare was a
conductor card tap, where the question had not yet come up in this form.

Splitting a single PayHere payment across merchant accounts at the moment of capture is not
something PayHere offers. So the options are genuinely structural, not a matter of configuration.

## Options considered

**One BusMate merchant account, periodic settlement to operators (this decision).** One set of
credentials, one integration, one reconciliation path; an operator needs no PayHere account to be
bookable, which matters because the target operators are one-to-three-bus owners
([ADR-008](ADR-008-operator-first-go-to-market.md)). The cost is that between capture and payout
BusMate holds money it does not own — the thing invariant 7 rules out.

**A PayHere merchant account per operator.** Money never touches BusMate; each operator is paid
directly, and invariant 7 holds unchanged. But every operator must complete PayHere's merchant
onboarding before a single seat on their bus can be sold online, and BusMate would hold and rotate
per-operator credentials. It makes the demo depend on third parties who have not been signed yet.

**Defer passenger online booking until the licensing answer is known.** Zero regulatory exposure and
zero progress; the booking flow is the passenger-side half of the `F-1` metric the go-to-market
thesis is priced on.

## Decision

**Passenger fares collect into a single BusMate PayHere account, and operators are settled
periodically in a separate process — for sandbox and development only.**

Scope limits, binding:

1. **Sandbox credentials only** (`TICKETING_PAYHERE_SANDBOX=true`). No real passenger money moves
   under this record. Switching to live credentials is not covered here and needs the production
   question below answered first.
2. **Invariant 7 is not amended.** With sandbox money there is no custody to take, so the invariant
   is untouched rather than weakened. Doing this for real would change it, and that change needs
   its own superseding record — vision.md permits amendment only that way.
3. **The periodic operator settlement process is out of scope and does not exist.** Nothing in the
   code should imply otherwise: a paid booking records that a passenger paid, never that an
   operator was paid.

## Consequences

- The passenger booking flow can be built and demonstrated end to end now, against sandbox money.
- BusMate carries a liability it cannot yet discharge: money captured with no built process to pay
  it out. Harmless while sandbox-only, and the reason limit 3 above is explicit.
- Per-operator revenue attribution becomes load-bearing later — a settlement process needs to know
  what each operator is owed. Tickets carry `busId`/`tripId` but no operator reference today, so
  that attribution is a real piece of work, not a report.
- Going live requires either a licensing answer or a fallback to per-operator merchant accounts.
  Building the flow against `PaymentGateway` keeps that fallback open: it is a credentials-and-
  routing change, not a rewrite.

## Revisit when

- Anyone proposes switching this flow to live PayHere credentials — that is the trigger, and this
  record does not authorise it, or
- Legal advice on CBSL payment-institution rules arrives and says either that collect-then-settle is
  permissible at this scale or that it is not, or
- An operator asks to be paid directly, which makes per-operator merchant accounts the cheaper path
  anyway.
