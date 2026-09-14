---
id: INC-009
title: Revenue broken down by payment method, grouped by who holds the money
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

Everyone who reads a revenue figure sees how the money was paid, and — the part they act on —
whether it is cash a conductor must hand over or money that already settled to the operator.
Adding a payment method later (wallets, LankaQR) must not require changing any revenue screen.

## Why now

[INC-008](INC-008-conductor-payhere-card-payments.md) made card payments real, and every revenue
surface in conductor-mobile still reported them as cash. The worst case is the end-of-trip
report: a conductor who took a Rs 195 card payment was shown Rs 195 more "cash revenue" than they
hold — a shortfall dispute at hand-over. More payment methods are planned, so fixing this with a
third named bucket would repeat the defect on the next method.

## Design

See [ADR-011](../decisions/ADR-011-revenue-grouped-by-custody-listed-by-method.md) for the
decision. What it means in this code:

**One classification, in the backend.** `PaymentMethod` carries each method's custody (ON_HAND /
SETTLED). The ticket DTO and every breakdown entry carry that custody, so the app never keeps its
own method-to-custody mapping.

**Breakdowns are lists.** `TripSummaryDTO.paymentBreakdown` is `[{method, custody, amount,
ticketCount}]`, discovered from the tickets rather than enumerated. Cancelled fares excluded.
Ordered cash-first so rows don't reshuffle between refreshes.

**Presentation in one app module.** `lib/payments/paymentMethods.ts` owns labels, icons and colours,
with a neutral fallback that shows an unrecognised code instead of hiding it, and the derived
figures: cash on hand, settled revenue, digital share.

**Revenue from the backend, not device state.** Trip overview summed the seat map, which cannot
see conductor tickets (they have no seat); the end-of-trip report summed an in-memory log that
included card fares and was lost on restart. Both now read the trip summary endpoint.

**No schema migration.** Custody is derived from records that already exist.

## Acceptance criteria

- [x] The trip summary endpoint returns a per-method breakdown with custody. Verified live on the
      test trip: CASH Rs 50 ON_HAND (1 ticket), CARD Rs 345 SETTLED (2 tickets).
- [x] Every ticket returned to the app carries its custody alongside its payment method.
- [x] An unrecognised payment-method code is reported with custody UNKNOWN and still counted —
      covered by `PaymentMethodTest`.
- [x] Every declared payment method has a concrete custody — covered by `PaymentMethodTest`, so a
      method added without deciding who holds its money fails the build.
- [x] Trip overview, insights, the end-of-trip report, the ticket log and the seat map render the
      breakdown by iterating it; no screen names a payment method in its layout logic.
- [x] Trip overview and the end-of-trip report show "Cash to hand over" and "Collected digitally",
      computed from custody.
- [x] Conductor tickets without a seat number are included in trip overview revenue.
- [x] ticketing-service compiles; conductor-mobile type-checks with only the two pre-existing
      errors; lint shows no new warnings in changed files (two pre-existing ones removed).
- [ ] **Owed on a device:** the five screens checked visually on the test trip, including that the
      pie chart slices are distinguishable and that "Cash to hand over" reads Rs 50.

## Out of scope

- Operator and MOT portal revenue views — they read the same contract and can adopt the list when
  those screens are next touched.
- Payment methods as reference data instead of an enum; revisit per ADR-011's consequences.
- The journey tab's "Physical vs Online tickets" split. It is an issue-channel breakdown, honestly
  labelled, and answers a different question from payment method.
- Removing `TicketContext`'s in-memory cash ticket log; the report no longer reads it, but the
  ticketing tab still writes it.
- Localised labels. The presentation module is shaped for translation keys; wiring i18n is not
  this increment.

## Constraints

- **R3, A2.** Changes the ticketing-service response contract on a money path.
- The change to `TripSummaryDTO` and `ConductorLogTicketDTO` is additive. The ticketing API client
  was regenerated from the live spec, not hand-edited.
- The `online_method_check` constraint is deliberately untouched (ADR-011, decision 5).

## Adding a payment method after this increment

1. Add a constant to `PaymentMethod` with its custody. `PaymentMethodTest` fails if custody is left
   undecided.
2. Add the value to `Online.Method` and widen `online_method_check` in a new Flyway migration.
3. Integrate the provider.
4. Optionally add an icon and label in `lib/payments/paymentMethods.ts`.

No revenue screen, summary endpoint or chart changes.

## Open questions

- None blocking. Whether "Collected digitally" should also appear on the operator's dashboard is a
  product call for the portal work.

## Discovered during the work

**Trip overview could never count a conductor-issued ticket.** Its revenue was summed from the seat
map, and a ticket sold on the bus has no seat number, so every fare collected on board was missing
from the total — independent of the payment-method bug, and older than INC-008.

**The end-of-trip report ran on device memory.** It summed a context log that every issued ticket
was appended to, so card fares counted as cash, and the figures reset on app restart. The getter
behind it (`getCashTicketLogsForTrip`) also ignores its trip argument and returns every log.

**Seat-map "Cash" counted seats issued on the bus, not cash.** Renamed to what it measures
("On bus").

## Decisions

- [ADR-011](../decisions/ADR-011-revenue-grouped-by-custody-listed-by-method.md)
