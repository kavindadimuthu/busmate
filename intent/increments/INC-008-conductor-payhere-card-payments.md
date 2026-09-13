---
id: INC-008
title: Real card payments in conductor-mobile via PayHere
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A conductor can collect a real card payment from a passenger, in the app, and issue a valid
digital ticket for it — using PayHere's own in-app card-entry screen, with real (sandbox-first)
money movement, matching the same flow cash already supports.

## Why now

BusMate's whole go-to-market thesis is priced on percentage of fares processed digitally
([vision.md](../vision.md), `F-1`). A cash-only demo can't show a prospective bus-operator client
the thing the business actually depends on. NFC tap-on-phone (the better long-term UX) is blocked
on a PSP/bank partnership that doesn't exist yet — see [ADR-010](../decisions/ADR-010-payhere-for-conductor-card-payments.md)
for why this increment uses manual card entry as a real, working interim step instead of waiting.

## Design

**PayHere's mobile SDK is the source of truth for issuing the ticket; `notify_url` is the source
of truth for reconciling the money — and those two can disagree.** The conductor is standing next
to the passenger and needs an immediate yes/no, which only the in-app SDK callback can give. The
ticket is issued as boarding-valid the moment PayHere's popup reports success. If the later
`notify_url` webhook disagrees, the payment record is flagged for reconciliation — the ticket is
never retroactively invalidated, since the passenger may already have boarded on it.

**`merchant_secret` never leaves `ticketing-service`.** A new `POST /api/v1/payments/payhere/hash`
endpoint computes PayHere's checkout hash server-side from `config/secrets/.env`
(`TICKETING_PAYHERE_*`) and returns only the hash, `merchant_id`, and sandbox flag — conductor-mobile
never holds the secret.

**This is a new, separate path from [`PaymentGateway`](../../apps/backend/ticketing-service/src/main/java/com/busmate/ticketing_service/payment/PaymentGateway.java),
not an implementation of it.** That interface models passenger self-booking's redirect-then-confirm
shape; a conductor completing payment synchronously in-app while facing the passenger doesn't fit
it. See [ADR-010](../decisions/ADR-010-payhere-for-conductor-card-payments.md).

**No schema migration.** `Transactions.Method` has no `CARD` value and its column is a 0/1 ordinal
check constraint — adding one is a real schema change or a client that generates the value at
random once the check is exceeded. Instead the CARD branch reuses `Transactions.Method.ONLINE`
(meaning "detail lives in the online sub-table," which is true here) and records the actual method
precisely in `Online.Method.CARD`, which already existed and already allows it. `ticket.issueMethod`
is set to `CONDUCTOR` (not `ONLINE`) — this is also a fix: the pre-existing generic "not cash"
branch in `issueTicket()` was mislabeling any non-cash conductor payment as an `ONLINE` issue,
which would have corrupted the physical/online revenue split every trip-summary view depends on.

**`notify_url`'s webhook is unauthenticated at the gateway, on purpose.** PayHere's server calls it
directly and cannot present a BusMate JWT — its own `md5sig` (verified server-side) is the actual
authentication. It's registered before the broader authenticated `/hash` prefix in
`routes.config.ts`, the same ordering `/api/auth/login` uses ahead of `/api/auth`, since Express
would otherwise apply the broader prefix's auth middleware to it too.

**Customer fields PayHere requires (name/email/phone/address) don't exist for a walk-up bus
passenger paying by tap.** Generic placeholders are sent — PayHere doesn't validate their
authenticity for this flow, only the card matters. Revisit if PayHere's fraud rules ever reject
this.

## Acceptance criteria

- [x] A conductor can choose Cash or Card before issuing a ticket; Card opens PayHere's own
      card-entry screen.
- [x] A successful card payment issues a boarding-valid digital ticket, exactly like cash — same
      screens, same ticket contract, `paymentMethod: CARD` and a real PayHere `transactionRef`.
- [x] A declined or cancelled card payment issues no ticket, and tells the conductor why.
- [x] `ticketing-service` compiles clean (`./mvnw clean compile`), and the physical/online revenue
      split (`getTripSummary`) is unaffected — CARD tickets count as physical (`issueMethod:
      CONDUCTOR`), not online.
- [x] `merchant_secret` exists only in `config/secrets/.env` (gitignored) and
      `ticketing-service`'s config — never in conductor-mobile or any committed file.
- [x] conductor-mobile type-checks and lints with no new errors (`npx tsc --noEmit`, `npx expo
      lint`) — back to the same 2 pre-existing errors INC-007 already documented.
- [ ] **Not verifiable here — owed on a device:** an actual PayHere sandbox card payment,
      end-to-end, on a real or emulated Android device with the SDK's native module linked and
      running. This includes confirming the SDK works under this app's `newArchEnabled: true`
      config — the SDK's own docs (`react-native link ...`) predate RN autolinking and say nothing
      about New Architecture support.

## Out of scope

- NFC tap-on-phone (PAYable TAP or equivalent) — the target UX, blocked on PSP/bank access; this
  increment is the interim step, not the destination.
- Refunds and cancellations of a completed card payment.
- Per-operator settlement/payout — PayHere settles to one BusMate merchant account; splitting that
  to individual operators is a separate, later capability.
- Camera-based card-number scanning (OCR autofill) — a UX polish layer on top of PayHere's manual
  entry form, not required for the payment to work.
- Any change to the passenger self-booking flow (`bookTicket`/`confirmPayment`/`PaymentGateway`).

## Constraints

- **R3, A2.** Touches `ticketing-service` (fare money) — every line reviewed by a human before
  merge, regardless of how mechanical it looks.
- **New dependency approved:** `@payhere/payhere-mobilesdk-reactnative`. Ships no TypeScript
  declarations — a minimal ambient `.d.ts` was added in `src/types/`, typed only against the
  fields this app actually sends/reads.
- Sandbox PayHere credentials only (`TICKETING_PAYHERE_SANDBOX=true`) until a human reviews this
  and explicitly switches to live credentials.

## Open questions

- **`notify_url` cannot be exercised end-to-end.** `ticketing-service`/`api-gateway` are local-only
  right now, and PayHere's servers can't reach a localhost URL. The webhook code path
  (`PayHereController.notify`, `PaymentService.applyPayHereNotification`) is written and compiles,
  but is unverified against a real PayHere callback. Accepted for now on the explicit basis (agreed
  with the owner before this increment started) that the in-app SDK success callback drives the
  demo; closing this gap needs either a public deployment or a tunnel (e.g. ngrok) pointed at a
  running `ticketing-service`.
- **New Architecture compatibility with the PayHere SDK is unconfirmed** (see acceptance criteria).
  If the native build fails, the documented fallback is temporarily setting `newArchEnabled: false`
  in `app.json` for conductor-mobile — a human decision, not one to make silently.
- Whether PayHere's fraud/risk rules ever reject a real transaction over the placeholder customer
  fields (name/email/phone) — unknown until tried against a live sandbox transaction.

## Discovered during the work

**`main` is 116 commits stale (dated 2026-07-07) relative to the actual active development
lineage.** This increment's branch was initially created off `main` and was missing the entire
`payment`/`PaymentGateway`/booking feature area as a result — silently, since `main` still compiled
and looked plausible on its own. Recreated off `inc-007-conductor-mobile-profile-photo` instead.
Not this increment's problem to fix, but worth a human decision: either fast-forward `main`, or stop
treating it as the branch-from target until it's current.

**The pre-existing conductor-issue `else` branch mislabels any non-cash payment as `ONLINE`
issue method**, which this increment's CARD branch deliberately does not inherit (see Design). The
generic `else` branch itself is untouched and still has this behavior for whatever payment methods
might reach it — logged here, not fixed, since it's outside this increment's scope.

## Decisions

- See [ADR-010](../decisions/ADR-010-payhere-for-conductor-card-payments.md).
