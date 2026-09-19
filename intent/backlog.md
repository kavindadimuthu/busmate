# Backlog

Candidate outcomes, not tasks. One line each. A line graduates to
[`increments/`](increments/) when someone shapes it — goal, acceptance criteria, scope — and owns it.

**Rules.** One file, never a directory. No status column: a shaped item has an increment file, a
started one has a branch, and both are Evidence — restating them here would be duplicated truth.
Delete lines that stop being worth doing rather than marking them abandoned.

> Harvested in INC-001 from the capability audit, the domain evaluations, and the four plan
> documents before those were deleted. Items marked ✅ were confirmed against the source code by
> whoever wrote the original evaluation; the rest are design-level observations.

---

## Correctness bugs — code-confirmed, fix first

- ✅ **Trip generation ignores `ScheduleCalendar` and `ScheduleException`** — creates trips on
  non-service days and skips `ADDED` days, so passenger search and trip data disagree.
  `TripServiceImpl.generateTripsForSchedule`. Highest impact, low effort — the natural first fix.
- ✅ **NPE generating trips for an open-ended schedule** (null `effectiveEndDate`, no `toDate`), same
  method.
- ✅ **Trip status has no state-machine guards** — `completed → cancelled` is allowed, `PATCH /status`
  permits arbitrary jumps, and trips can be generated from non-`ACTIVE` schedules.
- ✅ **`cancelTrip` overwrites `Trip.notes`** with the cancellation reason, destroying existing notes.
- ✅ **Unguarded deletes** — deleting a stop used by routes, or a route used by schedules, fails on a
  database FK as a 500 instead of a 409 with context.
- ✅ **A cancelled trip is indistinguishable from "no trip yet" and renders as available.** The trip
  join omits `cancelled`, so the row silently falls back to the schedule and shows as a normal
  scheduled service. Worst for near-term searches — exactly when passengers trust the result most.
- **`user.{type}:read` carries no ownership scoping** — any operator can read any conductor's record,
  including one employed by a different company. Surfaced while checking photo access in INC-003 and
  deliberately left alone there: the gap is in the permission engine, not in media, and tightening it
  means adding ownership to permission checks generally. The longer surfaces are built on the current
  loose behaviour, the harder it gets to change.
- **No double-booking validation** — the same bus or conductor can be assigned to overlapping trips;
  overlapping schedules on a route are not detected.
- **Deleting a trip that has tickets is unguarded** — needs a guard or soft delete. Crosses into
  ticketing.

## Platform / evidence

- **Frontend CI gate** — lint, unit test and Playwright e2e on PRs. Blocks raising frontend autonomy
  above A2 (see the override in [policy.yaml](policy.yaml)). Highest leverage item here.
- **Verify `backend-ci.yml` actually runs on GitHub Actions.** Committed but never executed; the
  `redgate/flyway:11` image tag and the runner Java 17 version are both unconfirmed.
- **Baseline the production/Supabase databases at `V001`** so migrations apply on deploy. Touches
  live databases — deliberate, per service, with a backup. `always_human`.
- **Back up and restore the media object store.** Named as a consequence in
  [ADR-009](decisions/ADR-009-self-hosted-s3-compatible-media-storage.md): "back up Postgres" stopped
  being a sufficient story the moment bytes started living outside it, and a restore that recovers
  rows but not objects yields profiles pointing at nothing.
- **Nothing deletes media when its owner is deleted.** Removing a user leaves their stored object
  behind — observed directly while cleaning up INC-003's test accounts. Harmless at seven objects,
  a slow leak and a personal-data retention problem at scale.
- **Row-level security in core-service, user-service and ticketing-service** — after the telemetry
  pilot (INC-024) proves the two-role mechanism. Each service needs an owner and a runtime role, a
  tenant-context hook, and its existing application-level scoping kept as defence in depth. Do
  core-service first: it owns operators, buses and permits.
- **Cross-tenant isolation suite in CI across every service** ([ADR-005](decisions/ADR-005-tenant-isolation-via-database-rls.md)
  requires it) — grows with each service that adopts row-level security.
- **Staleness sweeper** (HACO §14 step 2) — scheduled job flagging intent artifacts a diff may have
  invalidated. Advisory only, never blocking.
- **Policy check in CI** (HACO §14 step 4) — fail when a PR's declared autonomy exceeds what
  `policy.yaml` permits for the paths it touches. This is what makes the autonomy dial real.

## Structural gaps — the feedback loop

The single biggest structural weakness: stages that produce data (monitoring, analysis) feed the
stages that need it (network design, timetabling, scheduling). Nothing captures actuals, so nothing
downstream informs anything upstream. The `ScheduleStop.*Unverified/*Calculated` columns and the
unused `boarding`/`departed`/`delayed` trip statuses show the loop was modelled but never built.

- **Per-stop actual-time capture** (a `trip_stop_event` table fed by the timekeeper and conductor
  apps). Prerequisite for real ETAs, on-time performance, and analytics. The keystone item.
- **Real on-time performance**, blocked by the above.
- **Live vehicle tracking / AVL.** Conductor-mobile is already on the bus and authenticated, and
  already depends on `expo-location`; a periodic position ping plus SSE fan-out is the cheapest v1.
- **Passenger ETAs** — the payoff feature, combining per-stop actuals with live tracking.
- **Rolling trip generation job** ("keep 14 days materialised for every `ACTIVE` schedule") replacing
  manual date-range generation. Also the natural fix for open-ended schedules.
- **Notification service** — trip cancelled, conductor assigned, bus reassigned currently notify
  nobody. Spans operations, identity, ticketing and frontend.

## Product gaps

- **Replace the `hasTripData` boolean with a lifecycle status spectrum** — `PLANNED` → `SCHEDULED` →
  `ASSIGNED` → `LIVE` → `COMPLETED`, plus `CANCELLED`. One change that lets passenger UIs distinguish
  "bus confirmed closer to the date" from "should have been assigned by now", and resolves the
  cancelled-trip bug above.
- **PSP validity is not checked at read time** — a trip can reference a permit already expired by the
  trip date, and nothing surfaces it. An expired-permit trip is arguably not a valid advertised
  service.
- **Driver entity** — a `driverId` column with queries exists, but no entity, assignment endpoint, or
  UI.
- **`*_calculated` data-quality columns** are modelled but never written — build the calculation or
  drop them. The `*_unverified` tier is now claimed by community timetable proposals
  ([ADR-018](decisions/ADR-018-community-changes-are-reviewed-changesets.md)).
- **Timekeeper portal runs entirely on mock data** (`data/timekeeper/trips.ts`). A real timekeeper
  API recording boarding/departure/delay per stop closes several gaps at once.
- **Analytics and revenue screens are all mock** even though real tickets and trips sit in the
  databases, unqueried.
- **Geo queries** — nearest-stop search for passenger-mobile; lat/long is already stored.
- **Route geometry** — polylines for map rendering and derived distances.
- **Route versioning / effective-dating** — route edits currently mutate history.
- **Relocate the AI Studio Gemini proxy** from a Next.js API route to the api-gateway BFF module; the
  Vite portal split removes the server it currently runs on.

## Community contribution — the rest of the programme

Direction in [ADR-017](decisions/ADR-017-community-contributors-produce-reference-data-before-p3.md),
[ADR-018](decisions/ADR-018-community-changes-are-reviewed-changesets.md) and
[ADR-019](decisions/ADR-019-contributor-standing-lives-with-the-network.md). The first slice (provenance,
passenger labels, applying, proposing and reviewing stops) is shaped as INC-027..INC-031. The lines below
are in build order. **Shape nothing past the pilot gate until the pilot has tested `A-15` and `A-16`** —
its results will reshape them.

- **Pilot gate (not code).** 5–10 invited enthusiasts on one corridor, running on INC-027..031 for 90 days:
  count who is still active at day 30 and day 90, and ride-check a sample of approved stops. Decides
  whether anything below gets built.
- **Evidence photos on proposals.** Attach photos (stop, signboard, timetable board) through the existing
  media storage; visible only to reviewers; the contributor affirms that no faces or number plates are
  identifiable, and the reviewer can remove a photo before approving. passenger-web upload plus portal
  review gallery.
- **Route proposals.** Propose a new route or correct a route's ordered stop list: a passenger-web editor
  (pick stops in order on a map, reorder, drag to insert) and a portal review showing the stop-sequence
  diff on a map. Reuses the changeset table.
- **Timetable proposals.** Propose departure times per stop, days of operation and the date observed,
  written on approval to `schedule_stop.*_unverified` — never the authoritative columns (ADR-018): a
  passenger-web grid editor seeded from the current schedule, and a portal review with a time diff.
- **Field capture in passenger-mobile.** For a contributor standing at the stop: propose a stop at the
  current position with a photo, photograph a timetable board to attach to a timetable proposal, and see
  *My contributions*. Uses the app's existing `expo-location` and `expo-camera`.
- **Stewards.** Staff appoint a contributor as steward for chosen route groups; stewards review others'
  proposals inside that scope in a passenger-web review queue (the portal's review page rebuilt from
  shared `libs/ui` parts). Never their own; staff can overrule and revert.
- **Track record, suspension with revert-all.** Per-contributor approved, rejected and reverted counts
  shown wherever standing is decided; suspending a contributor can revert every change they made that has
  not been edited since, with one confirmation. The defence against a deliberate bad actor.
- **Passenger reports (`SRC-5`).** Any signed-in passenger can flag a stop, route or time as wrong ("this
  bus no longer runs", "stop moved") or confirm or deny a time from route detail, on web and mobile. Staff
  and stewards see reports grouped by record; this also starts measuring `A-10`.
- **Confidence decay and re-verification work.** Effective confidence computed at read time (ADR-018);
  records below the threshold, and records with several independent reports against them, become
  re-verification tasks; a staff view of coverage and staleness by corridor.
- **Contributor task queue.** "Needs checking on my corridors / near me" in passenger-web and
  passenger-mobile: claim a task, finish it with a proposal or a confirmation, release it. This is what
  keeps the programme going after the first collection.
- **Recognition.** A public contributor profile (display name, corridors, approved count), "observed by …"
  credit on public route and stop pages for contributors who opt in, and a per-corridor leaderboard. No
  money.
- **Community spreadsheet import.** Enthusiast groups keep route and timetable spreadsheets: a contributor
  uploads one, and each row becomes a changeset through the existing unified-import parser, reviewed like
  any other.
- **Contributor notifications.** Email when a proposal is decided or a task is waiting. Blocked by the
  notification-service backlog item.
- **Observed fares.** Contributors report the fare actually charged between two stops. Fares live in
  ticketing-service (R3 as a whole) — a separate decision, not a changeset type in core-service.

## Media — what the photo work deliberately left undone

The storage foundation ([ADR-009](decisions/ADR-009-self-hosted-s3-compatible-media-storage.md)) and
profile photos are built and in use; everything below reuses them rather than starting over.

- **Vehicle images.** The largest remaining piece and the only one that is not mostly reuse: buses
  have no image anywhere, so it needs storage keys for a bus rather than a person, a schema change,
  rules for who may upload (the owning operator) and who may view, and screens in both the operator
  and MOT portals. Unlike a profile photo, a bus's key cannot be derived from the viewer, so the
  access check has to be designed rather than inherited.
- **Company logos for operators.** MOT's operator rows and detail page currently borrow the linked
  contact person's photo, labelled as such; a logo would replace it and is what those screens
  actually want.
- **Profile photos in passenger-web and passenger-mobile.** Both show initials only. The smallest
  remaining item: the portal's approach ports directly to passenger-web, and conductor-mobile's to
  passenger-mobile.
- **No way to remove a photo once set.** Every surface can add or replace, none can clear. Wanted
  before real users, and cheap.
- **Cropping or rotating before upload.** A phone photo is stored as taken, so a portrait shot can
  sit oddly in a circular avatar.
- **Photos are re-fetched on every app launch on mobile.** The cache lives for the session only;
  keeping them on disk would also make the app usable offline.

## Known debt (from [context.md](context.md))

- Complete self-hosted auth Phases 6–7, including decommissioning the dead `SupabaseAuthClient`.
- **Rate limiting and account lockout are unenforced** — the columns exist on `auth_credentials` but
  nothing writes them, and `/forgot-password` is unthrottled. Security-relevant, R3.
- **The development seed creates no `user_identities` rows.** Every seeded demo account has a user,
  credential and profile but no identity, so seeded accounts and registered ones are not the same
  shape — anything reading identities behaves differently against demo data than against a real
  signup. Found while fixing INC-004; password login is unaffected, which is why it went unnoticed.
- **Decide unauthenticated `401` vs `403`.** `StopControllerIntegrationTest` expects 401; the service
  returns 403 uniformly for anonymous callers. A test is failing on purpose pending this decision —
  check the api-gateway's expectations first.
- **`user-service` enforces its own browser-origin allowlist behind the gateway**, hardcoded in
  `CorsConfig`, while the `cors:` block in its `application.yml` is read by nothing. A browser origin
  the gateway accepts but this list lacks fails as a bodyless `403` that looks exactly like a
  permission denial. Found in INC-005 when the portal came up on port 5174 because another instance
  held 5173; the same class of bug hit port 4000 before. Browsers never reach this service directly
  (invariant 1), so the likely fix is to stop enforcing CORS here, not to extend the list. Pinning the
  portal's dev port would also stop a second instance drifting onto an unlisted one.
- **`UserResponseWithSync` in the portal's admin users layer is now redundant.** It widens the
  generated `UserResponse` with `operatorSyncStatus` to avoid regenerating the client; INC-005
  regenerated it and the field is now generated.
- **The portal fetches a fresh access token for every concurrent API call.** `fetchAccessToken`
  caches the token once it has one but does not share a fetch already in flight, so a burst of
  parallel calls each asks the BFF for its own. Measured in INC-006: opening the admin users list
  sends 49 gateway requests — 24 of them token fetches, 22 user-list and count calls, 1 photo — about
  half the gateway's 100-per-minute per-client limit on a single page view. Photos are not the
  pressure on that limit; this is. Sharing the in-flight fetch is small; the per-type counts (three
  list calls for each of six user types) are the other half of the cost.
- **Decide on JPA auditing.** `createdBy`/`updatedBy` are asserted by a test but never populated (no
  `@EnableJpaAuditing`/`AuditorAware`). Implement it or fix the test.
- **Decide on the removed `schema.sql` auto-calc triggers** (`route_stop` distance, `schedule_stop`
  time). Re-add as a versioned migration or drop the idea; currently dormant.
- Align `user-service` package layout with the other Spring services.
- Mobile apps consume `libs/api-clients` instead of duplicating generated client copies.
- Replace the payment stub with a real PSP integration, never taking custody of funds.
- **Fix the dangling `Unified-Operator-Lifecycle-Management-Plan.md` references** — five frontend
  files cite a plan document that does not exist in `docs/plans/`.
- **conductor-mobile's committed `.env` names a gateway address that no longer exists**
  (`10.221.96.234`; this machine is now `192.168.8.181`), so the app cannot reach the backend from a
  device on this network. Found in INC-007. A LAN address committed to the repository goes stale
  every time the network changes — worth replacing with something that does not, or documenting that
  it must be set per machine.

## Documentation

- **Phase 3 of the HACO adoption** — merge the overlapping dev guides (4 run/quickstart guides, 3
  seed-credential files). Note the constraint found in INC-001: filenames referenced from migrations
  and config must keep their current paths.
- **Verify the surviving guides against the running system.** INC-001 found
  `operator-conductor-seed-credentials.md` still describing the demo logins as "real Supabase Auth
  accounts", which stopped being true when self-hosted auth reached Phase 5. Others are likely stale
  the same way. Each guide needs someone to actually run it and correct what has drifted — do this as
  part of Phase 3, not by reading.

## Strategy

- Validate strategy assumptions `A-01`..`A-16` —
  [strategy/06-assumption-log.md](strategy/06-assumption-log.md). 0 of 16 done, and this is where the
  company is actually built rather than in the code.
