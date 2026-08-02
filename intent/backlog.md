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
- ✅ **Generic `/start|complete|cancel|delete` trip endpoints are ungated** — security-relevant.
- ✅ **Unguarded deletes** — deleting a stop used by routes, or a route used by schedules, fails on a
  database FK as a 500 instead of a 409 with context.
- ✅ **A cancelled trip is indistinguishable from "no trip yet" and renders as available.** The trip
  join omits `cancelled`, so the row silently falls back to the schedule and shows as a normal
  scheduled service. Worst for near-term searches — exactly when passengers trust the result most.
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
- **Three-tier data-quality columns** (`*_unverified`, `*_calculated`) are modelled but never
  written. Either build the verification queue or drop the columns.
- **Timekeeper portal runs entirely on mock data** (`data/timekeeper/trips.ts`). A real timekeeper
  API recording boarding/departure/delay per stop closes several gaps at once.
- **Analytics and revenue screens are all mock** even though real tickets and trips sit in the
  databases, unqueried.
- **Geo queries** — nearest-stop search for passenger-mobile; lat/long is already stored.
- **Route geometry** — polylines for map rendering and derived distances.
- **Route versioning / effective-dating** — route edits currently mutate history.
- **Relocate the AI Studio Gemini proxy** from a Next.js API route to the api-gateway BFF module; the
  Vite portal split removes the server it currently runs on.

## Known debt (from [context.md](context.md))

- Complete self-hosted auth Phases 6–7, including decommissioning the dead `SupabaseAuthClient`.
- **Rate limiting and account lockout are unenforced** — the columns exist on `auth_credentials` but
  nothing writes them, and `/forgot-password` is unthrottled. Security-relevant, R3.
- **Decide unauthenticated `401` vs `403`.** `StopControllerIntegrationTest` expects 401; the service
  returns 403 uniformly for anonymous callers. A test is failing on purpose pending this decision —
  check the api-gateway's expectations first.
- **Decide on JPA auditing.** `createdBy`/`updatedBy` are asserted by a test but never populated (no
  `@EnableJpaAuditing`/`AuditorAware`). Implement it or fix the test.
- **Decide on the removed `schema.sql` auto-calc triggers** (`route_stop` distance, `schedule_stop`
  time). Re-add as a versioned migration or drop the idea; currently dormant.
- Align `user-service` package layout with the other Spring services.
- Mobile apps consume `libs/api-clients` instead of duplicating generated client copies.
- Replace the payment stub with a real PSP integration, never taking custody of funds.
- **Fix the dangling `Unified-Operator-Lifecycle-Management-Plan.md` references** — five frontend
  files cite a plan document that does not exist in `docs/plans/`.

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

- Validate strategy assumptions `A-01`..`A-14` —
  [strategy/06-assumption-log.md](strategy/06-assumption-log.md). 0 of 14 done, and this is where the
  company is actually built rather than in the code.
