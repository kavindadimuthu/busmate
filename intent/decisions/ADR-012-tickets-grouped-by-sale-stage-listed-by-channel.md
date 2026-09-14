# ADR-012 · Tickets are grouped by sale stage and listed by sale channel

**Date:** 2026-09-14 · **Status:** Accepted
**Type:** architecture

## Context

Conductor-mobile split tickets into "Physical" and "Online", taken straight from the stored
`issue_method` (CONDUCTOR / ONLINE). Both labels had stopped describing anything true:

- **"Physical" is false.** Tickets are digital-only; nothing is printed.
- **"Online" names a sales channel, not a moment.** A ticket sold at a depot counter before
  departure would be neither, though it behaves exactly like an online booking.
- **One word was carrying three facts**: when the ticket was sold, how it was paid
  ([ADR-011](ADR-011-revenue-grouped-by-custody-listed-by-method.md)), and whether the passenger
  has boarded.

The distinction people act on is timing. A ticket sold on the bus is boarded when it is sold. A
pre-booked ticket waits — boarded, still awaiting boarding, or cancelled — and "pre-booked, still
awaiting boarding" is the number a conductor works from. More channels are expected (counter,
agents) and every one of them is pre-booked.

## Options considered

**Rename the labels only.** "On bus" / "Online". Cheap, but keeps the channel as the category, so
the first counter sale needs a new category on every screen.

**Categorise by channel.** A bucket per channel. Accurate, but grows with every commercial deal,
and puts counter and online in different buckets though a conductor handles them identically.

**Group by sale stage, list by channel.** The same shape as ADR-011: a closed axis screens group
by, an open list carried underneath. Chosen.

## Decision

1. **Sale stage — `ON_BUS` or `PRE_BOOKED` — is the category every ticket screen groups by.** It is
   closed on purpose: stages differ in boarding lifecycle, which is why they are worth separating.
   A new stage is a product change and needs a new ADR.

2. **Sale channel is open-ended and classified in one place**, the backend's `SaleChannel`, with its
   stage. Channel codes are the stored `issue_method` values, so there is no mapping layer.

3. **Clients receive stage and channel on every ticket**, and a stage breakdown with boarding counts
   on every trip summary. They never map a channel to a stage themselves.

4. **Stage, payment method and boarding status are separate badges.** A card reads "On bus · Card",
   or "Pre-booked · Online · Awaiting boarding". An on-bus ticket carries no boarding badge,
   because it is boarded when sold.

5. **Unrecognised channels are reported as stage `UNKNOWN` and still shown**, never dropped — the
   same rule as ADR-011 for money.

## Consequences

- Adding a counter or agent channel is a `SaleChannel` constant, a migration widening
  `tickets_issue_method_check`, and the issuing flow. No ticket screen changes.
- "No-show" (pre-booked, trip over, never boarded) is not expressible yet: ticketing-service does
  not know when a trip ends. It becomes possible once trip completion reaches it.
- The staff portal still uses the old split and should adopt this alongside ADR-011.
