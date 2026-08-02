# ADR-002 · Decompose the backend by data ownership, not by product

**Date:** 2026-08-02 · **Status:** Accepted
**Type:** architecture

## Context

BusMate ships several products to different participants (crew, operator, depot, passenger, regulator,
partners). The natural instinct is one backend per product. Nearly every domain, however, is used by
nearly every product — that density is the definition of the ecosystem, not a design flaw.

Concretely: when a conductor starts a trip, exactly one database row must change. If the crew backend and
the operator backend each own a copy, we write sync code between our own two services and they disagree
within months. If one owns it and the other calls it, we have one backend and one client pretending to be
a backend. There is no third possibility.

## Options considered

1. **One backend per product** — each product fully self-contained.
2. **Decompose by data ownership**, with a thin per-product experience layer composing over it.
3. **A single undifferentiated backend** with no internal boundaries.

## Decision

**Option 2.** Three layers:

- **Domain layer**, cut by data ownership. One owner per entity. Knows nothing about products.
- **Experience layer (BFF)**, cut by product. Composition, response shaping and that product's
  authorisation view only — **no business rules**.
- **Client layer**, cut by audience and device.

Business boundaries live in the client and experience layers; technical boundaries live in the domain
layer.

## Consequences

- Product independence becomes a **commercial and UX property**, not a technical one. Products share the
  database of record, identity, the event stream and all business rules.
- Packaging can change without re-architecting — splitting a console into free and paid tiers is a BFF and
  licensing change.
- Business rules must be policed out of BFFs and clients (`PR-8`); this requires ongoing discipline and is
  the most likely place for this decision to erode.
- Clients still split by audience and device: crew is mobile and offline-capable, operator and depot share
  one role-gated web app, passenger has its own public BFF with a different security posture.

## Revisit when

- A product's data genuinely stops overlapping with every other product's — which would indicate it
  belongs to a different atomic unit, and therefore a different company.
