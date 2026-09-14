---
id: INC-010
title: Tickets categorised by sale stage — on the bus vs pre-booked
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A conductor sees tickets split by when they were sold — on the bus, or pre-booked — with how
many pre-booked passengers are still to board, and each ticket shows its payment method and
boarding status as separate badges. New sales channels (depot counter, agents) must not require
changing any ticket screen.

## Why now

The app split tickets into "Physical" and "Online". "Physical" is false — tickets are
digital-only — and "Online" names a channel, not a moment, so the first counter sale would fit
neither. After [INC-009](INC-009-payment-method-breakdown.md) made payment method visible, the
same word was still carrying three separate facts: when a ticket was sold, how it was paid, and
whether the passenger has boarded.

## Design

See [ADR-012](../decisions/ADR-012-tickets-grouped-by-sale-stage-listed-by-channel.md). In code:

**One classification, in the backend.** `SaleChannel` maps each channel to its stage. Channel
codes are the stored `issue_method` values (CONDUCTOR, ONLINE), so there is no mapping layer. Every
ticket carries `saleChannel` and `saleStage`; the trip summary carries `saleBreakdown`
(`[{stage, ticketCount, boardedCount, amount}]`, cancelled excluded).

**Presentation in one app module.** `lib/tickets/saleStages.ts` owns stage labels, icons, section
titles, the boarding badge rule, and the derived figures (awaiting boarding, the one-line summary).
Unrecognised stages render as "Other" rather than disappearing.

**Screens iterate stages instead of naming them.** The ticket log's two ~90-line duplicated
sections became one section rendered per stage.

**Badges are separate facts.** Payment method on every ticket; boarding status (Boarded / Awaiting
boarding / Cancelled) only where it adds information — an on-bus ticket is boarded when sold, so
it carries no boarding badge.

**No schema migration.**

## Acceptance criteria

- [x] Every ticket returned to the app carries `saleStage` and `saleChannel`. Verified live: the
      Sep 12 demo trip's conductor tickets are ON_BUS/CONDUCTOR, its bookings PRE_BOOKED/ONLINE.
- [x] The trip summary returns a stage breakdown with boarding counts, excluding cancelled tickets.
      Verified live on the Sep 12 trip: ON_BUS 2 tickets (2 boarded, Rs 240), PRE_BOOKED 1 (0
      boarded, Rs 120), 1 cancelled; covered by `TripSummaryTotalsTest`.
- [x] Every declared channel has a concrete stage, and every stored issue method is a known channel
      — covered by `SaleChannelTest`, so adding either without the other fails the build.
- [x] Ticket log: tiles and sections read "On bus" / "Pre-booked" (with boarded and awaiting counts);
      cards show payment and boarding badges; cancelled tickets are listed dimmed and excluded
      from the passenger and revenue tiles.
- [x] Journey tab: "Awaiting Boarding" replaces the mislabelled "Online Tickets" tile; the ticket
      breakdown is iterated by stage.
- [x] Seat map: stats read "Pre-booked" / "On bus"; passenger badges read e.g. "On bus · Card"; seat
      tap dialogs show how the ticket was sold.
- [x] Trip overview and end-of-trip report show one line: "On bus n · Pre-booked n (n boarded) ·
      Cancelled n".
- [x] Insights: "QR Validations" is now "Pre-booked Boarded" and counts only boarded passengers.
- [x] No conductor-mobile code references the old physical/online split.
- [x] ticketing-service: 10 tests pass across `PaymentMethodTest`, `SaleChannelTest`,
      `TripSummaryTotalsTest`. conductor-mobile type-checks with only the two pre-existing errors;
      lint problem counts are unchanged from the committed baseline in every changed file.
- [ ] **Owed on a device:** the ticket log, journey tab, seat map, trip overview, report and
      insights checked visually — in particular that the Sep 12 trip's pre-booked tile reads
      "0 boarded · 1 awaiting" and the cancelled ticket appears dimmed.

## Out of scope

- The staff portal. It still labels tickets "Cash (Conductor)" / "Online" from `issueMethod`, which
  also mislabels card fares as cash. It needs ADR-011 and ADR-012 adopted together; recorded in
  `context.md`.
- No-show (pre-booked, trip over, never boarded) — ticketing-service does not know when a trip
  ends. See ADR-012 consequences.
- Showing channels individually on screens. Only two exist and each maps to a different stage, so a
  channel list would repeat the stage split; it becomes worth showing once a second pre-booked
  channel exists.
- `TicketContext`'s in-memory ticket logs (still written by the ticketing tab, no longer read by any
  report).

## Constraints

- **R3, A2.** Changes the ticketing-service response contract.
- Contract changes are additive (`saleStage`, `saleChannel`, `saleBreakdown`). Existing fields keep
  their meaning. The ticketing API client was regenerated from the live spec.

## Adding a sale channel after this increment

1. Add a constant to `SaleChannel` with its stage (a counter or agent sale before departure is
   `PRE_BOOKED`).
2. Add the value to `Tickets.IssueMethod` and widen `tickets_issue_method_check` in a new Flyway
   migration. `SaleChannelTest` fails if either is added without the other.
3. Build the issuing flow.

No ticket screen changes. Adding a new **stage** is a product change and needs a new ADR.

## Open questions

- None blocking.

## Discovered during the work

**The journey tab's middle tile was mislabelled.** It displayed online-ticket count under a variable
named "validated tickets", next to an unused "pending" figure computed as 10 minus that count.
Replaced by pre-booked passengers awaiting boarding.

**"QR Validations" never counted validations.** It counted every online booking, boarded or not.

**The ticket log counted cancelled tickets as passengers and revenue**, the same defect INC-009
fixed in the trip summary, repeated in the screen's own client-side tiles.

## Decisions

- [ADR-012](../decisions/ADR-012-tickets-grouped-by-sale-stage-listed-by-channel.md)
