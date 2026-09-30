# Passenger-web v2 — parity audit and merge plan

Written 2026-09-30 at the tip of `inc-084-parity-and-merge-plan`. Two questions: **what does the old passenger-web do that
v2 doesn't yet** (parity, ADR-029), and **in what order should the unmerged v2 work reach `main`**. Cutover itself
(routing real traffic to v2, retiring the old app) is a separate, human-approved decision (ADR-029); this only says
whether it is ready to be asked.

## 1. Parity audit

Compared route by route with `apps/frontend/passenger-web/src/App.tsx` and its pages.

| Old passenger-web | v2 | State |
|---|---|---|
| Home `/` | `/` landing | Built (INC-064) |
| Find My Bus `/findmybus`, trip `/findmybus/detail` | same paths | Built (INC-066, 067). **Route map on the trip page: not built** (see gaps) |
| Routes `/routes`, `/routes/:id` | same | Built (INC-074) |
| Log in, sign up | `/login`, `/signup` | Built (INC-065) |
| Profile `/profile` | `/profile` inside an Account area | Built (INC-075, 077) |
| Booking: seats, review, payment, success, PayHere return/cancel | same paths | Built (INC-069, 070). Old `PaymentProcessingPage` is v2's payment page |
| Tickets `/tickets`, `/tickets/:id` | same | Built (INC-071) |
| Contribute programme, apply, my contributions, detail | `/contribute…` | Built (INC-079) |
| Propose a stop, who runs a bus, correct a working | `/contribute/propose`, `/propose-working`, `/correct-working` | Built (INC-080) |
| Steward queue and review | `/contribute/review`, `/review/:id` | Built (INC-081) |
| Report a problem, trust labels, dark mode | in v2 | Built |
| 404 | plain 404 | Fixed in this increment: it used to say "coming to v2" for paths under pages that are now built |
| — (new in v2) | About, forgot/reset password, verify email, fare quote before booking, booking switch | New (INC-082, 083, 073, 072) |
| Google/Facebook login | none | Not in either app (deferred, see the design reference) |

**Every screen of the old app has a v2 equivalent.** What stands between here and cutover is not screens.

### Gaps that need a decision or work before cutover

1. ~~**Route map on the trip page.**~~ **Done (INC-085):** an opt-in "Show map" on route details and trip details.
   The line joins the stops; it isn't the road the bus takes (no Directions API).
2. **Booking behaves differently.** v2 booking is closed by default and production refuses to start with it open on
   dummy payments (ADR-031). The old app has no switch. At cutover passengers can find buses but not book, until real
   PayHere is enabled (waiting on the domain). Decide whether that is acceptable.
3. **v2 has never run anywhere but a laptop.** No real domain, HTTPS or production build served. Needs
   `VITE_API_GATEWAY_URL`, the Google Maps key allowed for the real domain, the domain added to the gateway's allowed
   origins, and the email-link URLs (`AUTH_*_URL`) pointed at it.
4. **Email is a sandbox.** Reset and verify emails reach a Mailtrap sandbox only. Real users get nothing until a
   sending provider and domain are set up.
5. **Browser flow tests still target the old app.** `pnpm flows` (INC-049) drives passenger-web; after cutover they
   need porting to v2 or they fail. Not checked line by line.
6. **Small assets.** v2 has no favicon or `robots.txt`; its title says "v2 preview" and it is `noindex`. Flip these at
   cutover.
7. **Rename or repoint.** The old app is referenced by `nx.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, the README
   and several docs, and runs on port 4000 (v2: 4001). Nothing under a deploy folder references it, so no production
   config needs repointing today.
8. **Not checked at all:** a screen-reader pass, dark mode page by page on the newest screens, and any real phone
   beyond the LAN check. The phone rules (320–1440, 40px controls) were checked in a browser for every increment.

**Verdict:** parity of features is reached; cutover is not ready. Items 1 and 2 need an owner decision; 3 to 5 need
real infrastructure (domain, provider, deploy); 6 to 8 are mechanical.

## 2. Merge plan

**Where things stand.** `origin/main` is `59dd48d3` (PR #20). The unmerged work is **24 commits in one straight line**
on top of it: INC-063 to INC-083 (the twenty branches sit on top of each other with no forks). INC-076 is a
separate docs-only branch. The old passenger-web and the operator/government portals are **not touched**; everything
is additive in `apps/frontend/passenger-web-v2`, except the backend and shared files below.

**Outside v2** (this is what needs careful review):
- ticketing-service (Track 2): occupied-seats endpoint (INC-068), booking switch (INC-072), fare quote (INC-073), with
  acceptance tests, ADR-030 to 032, regenerated client.
- api-gateway: three public routes and their route test.
- core-service (Track 2): the relaxed "apply without verified email" rule, dev only, production refuses it (INC-078, ADR-033).
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (v2 app, `qrcode.react`, `@react-google-maps/api`), `README.md`, `config/secrets/.env.example`.

**Recommended: three pull requests, merged in order, each a merge commit** (the repo's history uses merge commits and
the `Increment:` trailers must survive, so no squash).

| PR | Branch tip | Contains | Why here | What to look at |
|---|---|---|---|---|
| 1 | `inc-073-fare-quote` | INC-063 to 073: v2 shell, find a bus, trip, booking, tickets **and all ticketing changes** | v2 booking can't work without the endpoints, so they travel together | ADR-030/031/032 and the three acceptance tests first. Then the booking-switch guard (fail-closed, prod refuses open on dummy payments). v2 files can be skimmed. |
| 2 | `inc-077-account-hub` | INC-074 to 077: routes, profile, account area | Pure v2, no backend | Skim. Try `/routes`, `/profile`. |
| 3 | `inc-083-passenger-web-v2-password-email` | INC-078 to 083 (+084 if merged): core rule, contribute, propose, steward review, About, password/verify pages | Contribute needs the INC-078 rule | ADR-033 and `ApplicantAccountRule` first (the only Track 2 piece). Try the seeded steward and contributor accounts. |

Steps: open PR 1 against `main`; PR 2 against `inc-073-fare-quote`; PR 3 against `inc-077-account-hub`. Merge 1, then
retarget 2 to `main` and merge, then 3. Do not delete a branch before the next PR's base is changed.

**Owner review queue (Track 2, your sign-off):** INC-068, INC-072, INC-073, INC-078. ADR-030 to 033 are still
*Proposed* and become *Accepted* when you approve.

**Checks already run at the tip:** v2 unit tests 178/178, type-check, lint and build clean; browser checks per increment.
Also run on this whole stack for this plan: ticketing-service 54/54, core-service 237/237, api-gateway 14/14 (its auth test needs port 9020 free, so stop a running user-service first).

**Merge risk is low** because nothing outside v2 changes behaviour for existing users: the old app and the portals are
untouched, and the three new ticketing endpoints are additive (the switch only affects v2's calls to the online booking
path; confirm this reading of ADR-031 when you review it).

## 3. Suggested order after merging

1. Decide gap 1 (route map) and gap 2 (booking at cutover).
2. Deploy v2 to a staging address (gap 3); set up the email provider and domain (gap 4).
3. Port the flow tests (gap 5), then do the mechanical items (6 to 8).
4. Ask for the cutover decision.

## 4. Cutover (INC-086)

Done on the owner's decision: the production image builds and serves `passenger-web-v2` at busmate.site, and the old
`passenger-web` is retired but kept (`apps/frontend/passenger-web/RETIRED.md`). Production had no real users and no
network data at the time, so the new-address trial step was skipped. Still open from section 1: real email, the flow
tests, and loading real network data.
