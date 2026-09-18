# ADR-014 · PayHere's hosted checkout page is the PaymentGateway for passenger self-booking

**Date:** 2026-09-18 · **Status:** Accepted
**Type:** architecture

## Context

[ADR-010](ADR-010-payhere-for-conductor-card-payments.md) chose PayHere for conductor-collected
card payments and deliberately kept that integration separate from
[`PaymentGateway`](../../apps/backend/ticketing-service/src/main/java/com/busmate/ticketing_service/payment/PaymentGateway.java),
because a conductor completing payment synchronously in-app is a different shape from passenger
self-booking. It also said `PaymentGateway` "models passenger self-service booking's
redirect-then-webhook shape" — this record is that implementation.

[INC-011](../increments/INC-011-server-priced-passenger-booking.md) and
[INC-012](../increments/INC-012-seat-hold-integrity.md) made booking honest about price, identity
and seat availability, still paying through `DummyPaymentGateway`. This record covers what
replaces it, and — because [ADR-013](ADR-013-passenger-fares-collect-centrally-settle-periodically.md)'s
sandbox-only money and this work starting before PayHere sandbox credentials exist — how the
switch happens safely.

## Options considered

**PayHere's hosted checkout page (`checkout.payhere.lk`), reached by an auto-submitted HTML
form.** The passenger is redirected off-site to enter card details on PayHere's own page — card
data never touches BusMate's code, same principle as ADR-010. Requires building the full field
set (`merchant_id`, `order_id`, `amount`, `currency`, `items`, `return_url`, `cancel_url`,
`notify_url`, customer details, `hash`) and posting it, not a simple redirect URL.

**PayHere's `payhere.js` popup checkout.** Keeps the passenger on BusMate's page in an embedded
iframe/popup instead of a full redirect. A third-party script loaded into passenger-web — more
convenient, but a new dependency on every page load rather than only during checkout, and no
clearer security benefit since it still posts to PayHere's own domain either way. Rejected for
being a bigger footprint for no real gain here.

**Extend the conductor path's `/payhere/hash` + in-app SDK approach to the web.** There is no
equivalent web SDK — that pattern is specific to PayHere's React Native mobile SDK opening a
native card-entry screen. Not applicable to a browser.

## Decision

**PayHere's hosted checkout page, via a `PayHerePaymentGateway` implementing `PaymentGateway`.**

1. **`PaymentGateway.PaymentInitiationResult` gains `checkoutFields` (a name→value map)** alongside
   the existing `redirectUrl`, which for this gateway is the checkout POST target
   (`sandbox.payhere.lk/pay/checkout` or `payhere.lk/pay/checkout`). `DummyPaymentGateway` leaves
   both null — no browser redirect happens in dummy mode, matching how it already behaves today.
   passenger-web submits an auto-generated form with `checkoutFields` as hidden inputs when both
   are present; when they are not, it falls back to the existing immediate-confirm flow.

2. **The `notify_url` webhook is unchanged and already generic.** `applyPayHereNotification`
   (INC-008) looks up an `Online` row by `transactionRef` and updates its status — it never assumed
   a conductor-issued ticket. A passenger booking's own `Online.transactionRef` (already set by
   `bookTicket` since INC-011) is picked up by the same handler with no code change.

3. **`PayHerePaymentGateway.confirm()` is a read, not an action.** There is nothing to "confirm" —
   PayHere's checkout completes on its own page, and only the webhook is authoritative. `confirm()`
   reads the same `Online` row's current status (set by whatever the webhook has recorded so far,
   or `PENDING` if nothing has arrived yet) rather than calling any PayHere API. This matches how
   `PaymentServiceIMPL.confirmPayment` already treats the dummy gateway's result — a status check,
   not a trust boundary.

4. **The real gateway is off by default, behind `payhere.checkout.enabled`.** Built and unit-tested
   without PayHere credentials, but cannot be live-verified until sandbox Merchant ID/Secret and a
   public tunnel exist (`notify_url` needs a reachable address, same accepted gap as ADR-010). The
   flag stays `false` — `DummyPaymentGateway` stays the active bean — until a human sets real
   sandbox credentials and confirms a live test.

## Consequences

- Building this now, gated off, lets the booking UI be built and tested end to end today against
  the dummy gateway's already-proven-correct behavior, and switches to the real one later by
  flipping one property — no UI change needed, since the DTO shape already accommodates both.
- `BookingResponseDTO` grows a nullable `checkoutFields` map. A generated client regenerated while
  the flag is off will show it as always null in practice until the flag flips — expected, not a
  bug.
- Same accepted risk as ADR-010: `notify_url` cannot be exercised end-to-end without a public
  tunnel. Until then, a real PayHere payment cannot actually be completed even once the flag is on.

## Revisit when

- Real sandbox credentials and a tunnel exist and a human is ready to flip `payhere.checkout.enabled`
  and run a live test — the trigger this record exists to gate.
- PayHere's popup (`payhere.js`) checkout is wanted instead of the full-page redirect, for a
  smoother passenger experience — a UI change, not a `PaymentGateway` shape change.
