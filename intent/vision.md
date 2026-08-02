# Vision

> One page. **Rewritten in place** when it stops being true — never appended to, never grown.
> The reasoning behind every claim here lives in [strategy/](strategy/) and [decisions/](decisions/);
> this page is the part that must fit in one screen and in everyone's head.

---

## The constitutional sentence

> **BusMate is the authoritative record of every scheduled passenger trip in the country. Everything
> we build either produces that record, consumes it, or is paid for because of it.**

## Why the trip

The trip is the only unit where the regulator, the operator, the crew and the passenger all hold a
stake in the **same record** — the condition that makes an ecosystem rather than a product suite. A
journey is composed of trips; a fare attaches to a trip; a permit authorises a trip. The trip is the
join key for everything else. Rejected alternatives and their reasoning:
[ADR-001](decisions/ADR-001-atomic-unit-is-the-trip.md).

## The boundary test

> If a proposed thing does not **attach to the trip**, **own domain data**, **serve a participant**,
> **appear on a surface**, or **feed a value flow** — it is not part of BusMate.

Use this before writing an increment goal. It settles scope arguments faster than any roadmap.

## Anti-scope — binding

Revisited yearly, not when a customer asks.

| Excluded | Why |
|---|---|
| Ride-hailing / on-demand | Different atomic unit; a war already being fought |
| Freight and parcel logistics | Different spine, therefore a different company |
| Hardware manufacturing | Buy and integrate; never build |
| Becoming a licensed payment institution | Partner with a bank or PSP; never take custody of fare money |
| Government ERP (procurement, HR, payroll) | Adjacent buyer, unrelated spine, unbounded scope |

## Sequencing

**Go deep, then broad, then wide.** More of one operator's workflow (depth) before more roles
(breadth) before more routes and regions (reach). Chasing reach early looks like growth and produces
a thin product in many places that nobody depends on.

Phases and their exit gates: [strategy/03-strategy-and-roadmap.md](strategy/03-strategy-and-roadmap.md).
Nothing in the next phase starts until the previous gate is passed.

## Where we honestly are

**Phase `P-1` (Wedge), not commercially started. Zero paying customers, no live tenant, 0 of 14
strategy assumptions validated.** Everything in [strategy/](strategy/) is a reasoned hypothesis, not
a finding.

There is **no ecosystem today** — there is a product plan. An ecosystem begins the day a passenger's
value comes from an operator's participation rather than from our code. Calling it an ecosystem
before then leads to building for a network that does not exist.

## Amendment

This page changes only alongside a superseding decision record in [decisions/](decisions/). Amending
the constitutional sentence or the atomic unit means BusMate has become a different company — which
is permitted, but must be deliberate.
