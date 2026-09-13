# ADR-010 · PayHere is the PSP for conductor-collected card payments

**Date:** 2026-09-13 · **Status:** Accepted
**Type:** architecture

## Context

Conductors currently collect fares in cash only. The product needs a real, working card-payment
demo for prospective bus-operator clients before the system is in production — [vision.md](../vision.md)'s
`F-1` metric (percentage of fares processed digitally) is the core wedge, and cash-only ticketing
doesn't demonstrate it.

Invariant 7 in [context.md](../context.md) is binding: BusMate never takes custody of fare money —
payments go through a partner PSP. Any option here has to keep money entirely inside a licensed
processor's hands; BusMate only ever holds a reference to what happened.

Two things ruled out most of the obvious answers before this decision was reachable at all:

**NFC tap-on-phone is not available yet.** PayHere's SoftPOS-equivalent doesn't exist; PAYable's TAP
product exists but every public integration path ties it to a specific bank partnership (Commercial
Bank), with no evidence of general developer/sandbox access. Getting it is a business-development
task (contacting PayHere/a bank), not an engineering one, and isn't ready today.

**International PSPs (Stripe, Adyen, SumUp, Viva) don't support Sri Lanka as a merchant country at
all.** Card acquiring for a merchant physically operating in Sri Lanka requires a bank-licensed local
acquirer under CBSL rules; none of the major global providers offer that here. Registering a foreign
entity to route around this would settle fares in a foreign currency, away from operators' actual
bank accounts, and risks looking like unlicensed domestic payment aggregation — rejected outright,
not just deprioritized.

## Options considered

**PayHere manual card entry (this decision).** Self-service sandbox signup (same day), a real
embeddable React Native SDK (`@payhere/payhere-mobilesdk-reactnative`) that opens PayHere's own
card-entry UI in-app, publicly disclosed fees, real LKR settlement. Card data never touches
BusMate's code — PayHere's own screen collects it.

**Wait for PAYable TAP.** True NFC tap-on-phone, no typing — better passenger experience and the
long-term goal. Blocked on a bank partnership BusMate doesn't have yet. Not rejected, just not
buildable today; this ADR doesn't preclude adding it later behind the same `paymentMethod`/
`transactionRef` contract (see Decision).

**Keep cash-only until TAP access lands.** Zero engineering risk, but leaves the demo with nothing
to show on the one metric (`F-1`) the whole go-to-market thesis depends on.

## Decision

**PayHere is the PSP for conductor-collected card payments, integrated via manual card entry in
PayHere's own in-app SDK screen, until NFC tap-on-phone access is available from a PSP.**

Three commitments follow:

1. **`merchant_secret` never leaves `ticketing-service`.** PayHere's checkout hash and notify_url
   signature both depend on it; conductor-mobile only ever receives a pre-computed hash from a new
   `ticketing-service` endpoint (`POST /api/v1/payments/payhere/hash`). Computing the hash in the
   app would ship the secret inside the APK.

2. **The conductor's app is the source of truth for issuing the ticket; the notify_url webhook is
   the source of truth for reconciling the money.** PayHere's mobile SDK reports success
   synchronously in-app, before any server-to-server confirmation is possible — the conductor is
   standing in front of the passenger and needs an immediate yes/no. The ticket is issued
   (boarding-valid) on that in-app success. The `notify_url` webhook (`POST
   /api/v1/payments/payhere/notify`, unauthenticated at the gateway, secured by PayHere's own
   md5sig instead) later corrects the payment *record* if PayHere's authoritative status disagrees
   — it never un-issues a ticket already shown to a passenger. This is a deliberate, accepted gap:
   see the increment's open questions for why it can't be closed yet.

3. **This does not replace [`PaymentGateway`](../../apps/backend/ticketing-service/src/main/java/com/busmate/ticketing_service/payment/PaymentGateway.java).**
   That interface models passenger self-service booking's redirect-then-webhook shape. A
   conductor tapping through an in-app SDK while standing next to the passenger is a different
   shape (synchronous, no redirect), so it's a separate, purpose-built path
   (`PayHereHashService`/`PayHereController`) rather than a forced fit into `initiate()`/
   `confirm()`. If PAYable TAP or another PSP is added later, it plugs in the same way — a
   `paymentMethod` value plus a `transactionRef` on the existing ticket DTO — not by extending
   `PaymentGateway`.

## Consequences

- Real money moves through a live, working path — the demo is genuine, not staged.
- The card-entry UX is a fallback, not the target: typing a 16-digit number on a moving bus is
  worse than a tap. This ADR is explicitly satisfied by, and expects to be superseded by, NFC
  access from PayHere or PAYable.
- Until this service is deployed somewhere internet-reachable, `notify_url` cannot actually be
  called by PayHere — see [INC-008](../increments/INC-008-conductor-payhere-card-payments.md)'s open
  questions for the accepted risk this creates.
