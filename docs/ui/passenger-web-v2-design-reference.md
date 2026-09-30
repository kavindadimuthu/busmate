# Passenger-web v2 — design reference

Source: 12 Claude Design pages (`docs/ui/passenger-web-v2-design-source/`), exported by the product
owner from a Claude Design project. This is a **design reference, not a spec** — it shows visual
language and page composition, not what the backend can actually do. Read alongside
[intent/context.md](../../intent/context.md) for what the real passenger-web app must keep doing.

## Design tokens

**Fonts:** Plus Jakarta Sans (UI text, weights 400/500/600/700/800), JetBrains Mono (route/schedule
mono numerals, code-like labels).

**Color (light / dark pair, driven by a `t` token object per page):**

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f6f9ff` | `#0a1020` | page background |
| `ink` | `#0f1b3d` | `#e8eefc` | primary text |
| `mute` | `#5b6b8c` | `#93a3c4` | secondary text |
| `card` | `#ffffff` | `#111a30` | card surfaces |
| `line` | `#dfe7f7` | `#26365e` | borders |
| `soft` / `alt` / `tint` | pale blue variants | deep navy variants | field backgrounds, section alternation, icon chips |
| accent | `#2563eb` (blue-600) → `#1d4ed8` on hover/gradient | same | primary actions, links, focus |
| hero gradient | `linear-gradient(120deg,#1e3a8a,#2563eb 65%,#3b82f6)` | `linear-gradient(120deg,#0b1a4a,#1d3f9e 75%)` | hero sections |
| status | green `#16a34a` (available), red `#dc2626` (scarce/error), amber `#f59e0b` (rating stars) | | seat/availability indicators |

Theme toggle is a simple light/dark switch on every page (`{{ toggleTheme }}`), not present in the
current passenger-web app today.

**Shape & spacing:** 16–18px card radius, 10–12px control radius, 99px pill radius for tags/chips.
Cards: `1px solid {{ t.line }}` border, no heavy shadows except hero-overlapping search bars
(`box-shadow: 0 24px 60px -24px rgba(30,64,175,.4)`).

**Layout:** max-width 1200–1240px content column. Sticky header with blurred translucent background.
Responsive breakpoint at 760px collapses filter sidebars to static, nav to a horizontal scroll strip,
grids to single column.

## Page-by-page catalog

| Design page | Visual pattern | Maps to current app | Notes |
|---|---|---|---|
| `Landing` | Hero w/ photo + gradient overlay, overlapping search card, feature grid, stats band, route cards, "how it works" steps, testimonials, CTA band, footer | `HomePage.tsx` | Marketing content (testimonials, milestones) is illustrative copy, not real data |
| `Find Bus` | Hero strip, overlapping search bar, sidebar filters (price slider, bus type, departure time buckets, amenities, operator), sortable result cards | `FindMyBusPage.tsx` + `FilterSidebar` | **Built (INC-066).** The search result carries no price, rating, review count, seats left, amenities or bus class, so those card parts and the price/bus-type/amenity/operator filters are left out. Kept: time-of-day buckets, sort (earliest/fastest/shortest), road type, route, plus what the data does have: trust labels on times, "usually operated by", trip status. Search summary + Edit on phones. |
| `Route Details` | Route map placeholder, stops list, related schedules, other routes | `/routes/:id` (INC-074) | **Built.** Summary with trust label, stops in order with distance from the start, partial-list note, the other direction, and "Find a bus on this route". Left out, no backing: map (later, opt-in), related schedules, service hours, typical fares, buses per day. "Other routes" became "the other direction" (same route group). |
| `Trip Details` | Route & stops, route map, bus & amenities, policies, other departures on route | `/findmybus/detail` (INC-067): stop timeline, runs-on-date and exceptions, timetable source, bus and operator, other buses, report a problem, share. Left out, no backing: map (later, opt-in), seats left, and the fare box beyond the per-seat server quote (INC-073), ratings, policies, track. |
| `Booking` | 3-step header (seats → passenger details → payment), 10-row × 2+2 seat grid (A/B aisle C/D), per-seat passenger name/age form, live price summary | `/booking/seats`, `/booking/review` (INC-069) | **Built.** The bus's real seat plan and real availability (occupied-seats endpoint, INC-068), up to 5 seats, then review and reserve. Steps are Seats → Review → Pay. Left out, no backing: per-seat passenger details, ladies-only seats, a price breakdown; instead the server's fare quote (INC-073) shows per seat on the trip page and as a running total on the seat and review pages. |
| `Payment` | "Choose payment method" step, success state | `/booking/payment`, `/booking/success`, `/booking/payhere-return`, `/booking/payhere-cancel` (INC-070) | **Built.** PayHere logic reused as-is (order_id `TICKET-<id>`, settle-by-polling, same return/cancel addresses); pages restyled. No choose-a-method step: there is one way to pay. While the dummy gateway is on the page says no money is taken and the button says "Confirm booking". |
| `My Tickets` *(not a separate design page — covered by Profile's "My trips" tab)* | — | `/tickets`, `/tickets/:id` (INC-071) | **Built**, designed here in the same style. Trips grouped with their seats, upcoming then past; a boarding-pass ticket with the conductor-scannable QR (same payload as passenger-web); cancel only for incomplete bookings; never says "paid". |
| `Profile` | Tabs: overview/trips, saved routes, personal info, payment methods, notifications, security | `/profile` (INC-075) | **Built** (INC-075) and placed in an **Account** area (INC-077) whose tabs follow the person's standing: Profile, Tickets, then Contributions and Review for contributors and stewards. The Profile tab has account card, editable details (name, username, phone), change password, links to My tickets and Contribute, log out. **Dropped:** loyalty widget, saved payment methods (per user decision), saved routes and notification settings (nothing backs them). Photo, email change and verification wait. |
| `Auth` | Split panel, tabbed Log In / Sign Up, show/hide password, "Forgot password?", Google button | `LoginPage.tsx`, `SignupPage.tsx` | **Leave the Google button out for now.** The backend can verify Google/Facebook ID tokens but has no client ID configured and no frontend calls it; needs a Google OAuth client ID and sign-off on loading Google's script. A later increment, not dropped. "Forgot password?" is real (backend endpoints exist) but has no page anywhere yet: it comes in the increment after login. |
| `Community` | Leaderboard of contributors, ranked by points/badges | *(no direct equivalent)* | **Do not build the leaderboard/points as designed** — no scoring system exists. Real equivalent is the contribute/steward flow (see below) |
| `Contributor` | Gamified contributor profile: points, badges, contribution breakdown, activity feed | *(no direct equivalent)* | Same as above — restyle the **real** contributor screens instead: `ContributeProgrammePage`, `MyContributionsPage`, `ContributionDetailPage`, `ProposeStopPage`, `ProposeWorkingPage`, `ProposeWorkingCorrectionPage`, `StewardQueuePage`, `StewardReviewPage`. Phase 2, after core passenger flows. |
| `Routes` | All-routes grid/list with count header | `/routes` (INC-074) | **Built.** Count header, search (word starts), road-type filter, order by number or distance, state kept in the address. Left out, no backing: "most frequent" and "lowest fare" ordering, buses/day, fares, "updated daily". |
| `About` | Mission/principles/milestones/team/FAQ/CTA | *(new — no current equivalent page)* | Static content page; low risk, low priority |

## Known gaps between design and real capability (resolved)

Decisions already made with the product owner (2026-09-29), recorded here as the reconciliation
this reference exists to make legible — not to be treated as open questions:

- **Loyalty/points/tiers** ("Gold Traveller progress"): dropped. No backend exists; not being built
  as a side effect of a UI redesign.
- **Community leaderboard / contributor badges**: dropped as designed. The real contributor/steward
  workflow gets the new visual language instead, once core passenger flows are done.
- **Saved payment methods**: dropped. PayHere integration here is redirect-per-transaction; there is
  nothing to list.
- **Google login**: deferred, not dropped (see the `Auth` row). An earlier version of this file said no backend support existed; that was wrong, corrected 2026-09-30.

## What this reference is for

- A visual/tonal target when building each real screen in `passenger-web-v2`.
- A source of concrete component patterns (search widget, filter sidebar, result cards, seat grid,
  tabbed profile) to translate into the existing component library (Radix + shadcn-style
  `components/ui`), not to hand-copy as inline styles.
- Not a page inventory to build 1:1 — screens with no backend reality behind them are explicitly
  excluded (see above), and screens the design doesn't cover (My Tickets, contribute/steward detail
  screens) still need their own design pass using these tokens.
