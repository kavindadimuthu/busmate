---
id: INC-013
title: PayHere checkout and the passenger-web booking flow
state: in-review
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A passenger can search a bus, pick a seat, pay, and see their ticket, entirely on
`passenger-web` — and the payment goes through PayHere's hosted checkout once real sandbox
credentials exist, without a UI change to get there.

## Why now

[INC-011](INC-011-server-priced-passenger-booking.md) and
[INC-012](INC-012-seat-hold-integrity.md) made the booking API safe to put real money behind.
`passenger-web` has no booking screens at all today, and the booking still pays through
`DummyPaymentGateway`.

## Design

See [ADR-014](../decisions/ADR-014-payhere-hosted-checkout-for-passenger-booking.md) for the
gateway shape. In short: `PayHerePaymentGateway` is built, unit-tested, and wired in behind
`payhere.checkout.enabled: false` — off by default, so `DummyPaymentGateway` stays the active
path until a human supplies real sandbox credentials and a public tunnel and flips the flag.

**The UI is built once and works both ways.** `BookingResponseDTO` carries `checkoutFields` -
present only when the real gateway is active. Its absence (today) means "confirm immediately",
its presence (later) means "submit this form to PayHere and wait". No UI change is needed when
the flag flips.

**Everything that does not need PayHere is built and tested for real, now**, against the running
local stack, the same way INC-011 and INC-012 were: search → detail → seat selection → review →
pay (dummy) → My Tickets → cancel.

## Acceptance criteria

- [x] A logged-in passenger can search, view a trip's detail, pick a seat, and book it from
      `passenger-web`, live-verified against the real local stack.
- [x] The seat map passenger-web shows matches what INC-012 actually enforces: an already-held
      seat cannot be picked; a freed seat can.
- [x] A booked ticket appears in "My Tickets", with the real fare, real seat, and real status.
- [x] A passenger can cancel their own unpaid booking from the UI; cannot see or act on another
      passenger's ticket (enforced server-side since INC-011, exercised here through the UI).
- [x] `PayHerePaymentGateway` unit tests cover: the checkout fields and hash it builds, and that
      `confirm()` reports whatever the (unchanged) webhook has recorded.
- [x] `payhere.checkout.enabled` defaults to `false`; flipping it is a one-line config change, not
      a code change.

## Out of scope

- Actually completing a real PayHere payment — blocked on sandbox credentials and a tunnel; see
  Open questions.
- passenger-mobile's own booking screens — a later increment, same backend.
- Refunds via PayHere's refund API.

## Constraints

- R3, A2 — fare money, even though the real gateway stays switched off in this increment.
- No change to `PaymentGateway`'s existing callers (`PaymentServiceIMPL`) beyond what the new
  `checkoutFields` field requires — the interface's shape, not its contract, grows.

## Open questions

- None blocking. Resolved 2026-09-18: real sandbox credentials, a stable Cloudflare Tunnel
  (`busmate.site`, a dedicated domain bought for this), and a full live payment were completed -
  see Discovered during the work.

## Decisions

- See [ADR-014](../decisions/ADR-014-payhere-hosted-checkout-for-passenger-booking.md).

## Discovered during the work

**PayHere assigns a distinct Merchant Secret per registered Domain/App, not one per account.**
The original design shared `PayHereProperties.merchantSecret` (the conductor mobile app's
secret, INC-008) with the new passenger-checkout path - wrong, discovered the moment a real
checkout was attempted ("Unauthorized payment request"). Fixed by giving
`PayHereCheckoutProperties` its own `merchantSecret`, and `PayHereHashService` now computes
against whichever secret the caller needs
(`generateCheckoutHash` for the conductor app, `generatePassengerCheckoutHash` for the browser
checkout) and verifies an incoming webhook against both, since one `notify_url` now serves paths
signed by either secret.

**PayHere's Domain/App field also rejects subdomains** - `api.busmate.site` was refused outright.
Registered the bare `busmate.site` instead.

**A checkout initiated from `localhost` is genuinely unauthorized by PayHere**, independent of
the hash - confirmed once the domain-only theory was tested for real. Fixed by also tunnelling
`passenger-web` itself through the same named tunnel (`busmate.site` -> :4000,
`api.busmate.site` -> :8080, one `cloudflared` config with two ingress rules), so the checkout is
genuinely initiated from the domain PayHere has on file.

**Once `passenger-web` was actually served from a public domain, two more real, general gaps
surfaced - neither specific to PayHere:**
- Modern browsers block a page on a public origin from calling a `localhost` address directly
  (Private Network Access). `passenger-web`'s API base has to be the public gateway domain
  whenever the page itself is public - true for any future deployment, not just this tunnel.
- `api-gateway`'s proxy forwarded the browser's original `Origin` header straight through to
  each internal service, and `user-service` has its *own*, separately-maintained CORS allowlist
  (deliberately narrower - "internal service, gateway owns public CORS") that the gateway's own
  `ALLOWED_ORIGINS` fix never reaches. This silently broke every legitimate public frontend
  origin, including the existing production Vercel deployment, not only the new tunnel domain -
  a real, general bug, not a PayHere-specific one. Fixed at the source: the gateway now strips
  `Origin` before proxying, since that hop is a trusted server-to-server call, not a
  browser-originated cross-origin request the internal service needs to re-validate.
- Vite's dev server serves dozens of individual unbundled module files; through a tunnel's added
  round-trip latency this made first-load painfully slow and occasionally 502'd under the
  concurrent request burst. Switched to testing against a production build (`vite preview`) for
  anything routed through the tunnel - also just a more honest test of real behaviour.

**Live-verified with a genuine, complete PayHere sandbox payment** (Playwright driving real
Chromium against the real running stack, a real card entered on PayHere's own hosted page): real
checkout initiation, real hash accepted, real card submitted, real `notify_url` webhook received
and its signature verified, real database update (`Online.status = SUCCESS`), and the
passenger-web return page correctly reaching "Payment confirmed" - the one thing that could not
be exercised until real infrastructure existed is now the one thing directly confirmed working.

**`PayHereReturnPage` relied on in-memory React state that does not survive PayHere's redirect.**
PayHere's return is a full top-level navigation, not a client-side route change, so
`BookingContext`'s state is gone by the time the page remounts - every real return silently
bounced straight to My Tickets with `order_id` sitting unused in the URL. Only caught by
completing a real redirect round trip; a mocked or client-side-only test would never have hit
it. Fixed by parsing the ticket id out of `order_id` itself (`TICKET-<id>`), which survives the
redirect because it is server state carried in the URL, not client state.

**`passenger-web` never sent an auth token to `ticketing-service` or `core-service` at all.**
`setup.ts` had a stale comment ("TOKEN resolvers for the other clients will be added when their
auth is implemented") — every booking call would have gone out unauthenticated and 401'd
immediately. Fixed by installing the same auto-refreshing resolver `installUserApiTokenResolver`
already used for the user client on the ticketing and route clients too.

**`ProtectedRoute` dropped the query string on a login redirect.** It passed only
`location.pathname` as the return address; `/booking/seats?tripId=...&busId=...` would have come
back as a bare `/booking/seats` with no trip context, silently breaking the flow for anyone not
already logged in when they hit "Book This Bus". Not caught earlier because `/profile`, the only
previously-protected route, never carried query parameters. Fixed to preserve
`location.pathname + location.search`.

**Ticket detail showed raw UUIDs for stops and the bus instead of names.** `ConductorLogTicketDTO`
only carries `startLocationId`/`endLocationId`/`busId`, not display names. Fixed with a
best-effort client-side resolve (`BusStopManagementService.getStopById`,
`BusManagementService.getBusById`) that degrades to the raw ID if a lookup fails, rather than
blocking the ticket from showing at all.

**Unrelated, found but not fixed — flagged for a human decision:** `POST /api/trips/generate`
(core-service) throws a 500 (`Cannot invoke "ChronoLocalDate.toEpochDay()" because "other" is
null`) for at least one real schedule in the local dev seed data. Worked around for testing by
inserting trip rows directly rather than through the endpoint. Out of scope for this increment -
not part of the passenger booking path - but worth a look, since it likely blocks generating new
demo trips for any future local testing too.

**Live-verified end to end** against a real local stack (Postgres, user-service, core-service,
ticketing-service, api-gateway, passenger-web) using a real headless-browser session (Playwright,
driving a real Chromium against the real dev server) with a real seeded passenger login: seat map
render, seat selection, booking, server-side pricing, payment completion (dummy gateway), My
Tickets, ticket detail with resolved names, the paid-ticket no-self-cancel rule, and cancelling a
real unpaid booking - 14/14 checks passed, twice, on fresh trips each time. All test data cleaned
up afterward; local databases back to their original seed counts.
