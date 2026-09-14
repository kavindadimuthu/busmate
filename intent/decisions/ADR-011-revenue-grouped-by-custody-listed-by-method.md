# ADR-011 · Revenue is grouped by custody and listed by payment method

**Date:** 2026-09-14 · **Status:** Accepted
**Type:** architecture

## Context

Until [ADR-010](ADR-010-payhere-for-conductor-card-payments.md), a fare issued by a conductor was
always paid in cash, so "issued on the bus" and "paid in cash" were the same fact. Every revenue
surface was built on that equivalence: the ticket contract carried only an issue method, and five
conductor-mobile screens split revenue into a hardcoded "Cash" and "QR/Digital" pair derived from
it. The moment card payments existed, a card fare was reported as cash — on the end-of-trip report,
which is where a conductor is held to account for the cash they hand over.

More payment methods are expected (wallets, LankaQR, other digital methods). A design that names
its buckets has to be edited on every screen for each one.

Two properties bear on the choice:

- **Payment methods are open-ended.** The list will grow by commercial decision.
- **Custody is closed.** Money is either in the conductor's hands or it settled to the operator's
  account. That does not change with new methods, and it is the distinction every stakeholder
  acts on: the conductor reconciles cash, the operator measures leakage-proof revenue — the `F-1`
  metric in [vision.md](../vision.md). It is also the line [context.md](../context.md) invariant 7
  draws: BusMate never holds fare money, so "settled" always means a PSP or bank holds it.

## Options considered

**Named buckets (cash / card / online).** Simplest to render. Every new method is a contract change
plus an edit to every screen. Rejected: it is the current defect, generalised.

**Payment methods as reference data (lookup table).** New methods become a data insert, not a code
change. Loses exhaustive type checking, adds a join to every revenue query, and is a large schema
change for three values. Rejected for now — see Consequences for when to revisit.

**Custody as an attribute of a code-level method catalogue, breakdowns as lists.** One enum
constant per method carrying its custody; APIs return a list of `{method, custody, amount, count}`;
clients iterate and group by custody. Chosen.

## Decision

1. **The method-to-custody mapping lives in exactly one place: the backend's `PaymentMethod` enum.**
   Clients receive custody on every ticket and every breakdown entry and never classify a method
   themselves. A second copy of the mapping is the thing that would drift when a method is added.

2. **Revenue breakdowns are lists, never named fields.** A method nobody anticipated appears on
   every surface without a contract change.

3. **APIs carry codes, not display labels.** BusMate is trilingual; the client owns presentation,
   in one module, with a neutral fallback for unrecognised codes.

4. **Money is never dropped for being unclassifiable.** An unknown code is reported with custody
   `UNKNOWN`, not omitted from a total. A missing icon is cosmetic; a missing rupee is a
   reconciliation dispute.

5. **The database constraint on stored payment methods stays.** Adding a method keeps costing one
   Flyway migration. That friction is intended: it prevents a mistyped code entering a fare ledger,
   and it puts a human review on what is a commercial decision rather than a refactor.

## Consequences

- Adding a payment method is: an enum constant with its custody, a migration widening the stored
  constraint, the provider integration itself, and optionally an icon. No revenue surface changes.
- Revisit reference data if methods start arriving in quantity, or need to vary per operator or
  region — at that point the migration per method stops being a useful checkpoint and becomes toil.
- Revenue figures must come from the backend, not from device-local state. A screen that sums an
  in-memory log cannot know custody and loses its data on restart.
