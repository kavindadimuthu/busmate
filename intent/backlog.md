# Backlog

Candidate outcomes, not tasks. One line each. A line graduates to
[`increments/`](increments/) when someone shapes it — goal, acceptance criteria, scope — and owns it.

**Rules.** One file, never a directory. No status column (a shaped item has an increment file; a
started one has a branch — that is Evidence, and restating it here would be duplicated truth). Delete
lines that stop being worth doing rather than marking them abandoned.

> Items harvested from the superseded planning docs are marked `[harvested]`. That harvest completes
> in Phase 2 of the HACO adoption; this list is not yet exhaustive.

---

## Platform / evidence

- **Frontend CI gate** — lint, unit test and Playwright e2e on PRs. Blocks raising frontend autonomy
  above A2 (see the override in [policy.yaml](policy.yaml)). Highest leverage item here.
- **Verify `backend-ci.yml` actually runs on GitHub Actions.** It is committed but has never
  executed; the Flyway image tag and runner Java version are unverified.
- **Staleness sweeper** (HACO §14 step 2) — scheduled job flagging intent artifacts a diff may have
  invalidated. Advisory only, never blocking. Not before one increment has run end to end.
- **Policy check in CI** (HACO §14 step 4) — fail when a PR's declared autonomy exceeds what
  `policy.yaml` permits for the paths it touches. This is what makes the autonomy dial real.

## Known debt (from [context.md](context.md))

- Decommission `SupabaseAuthClient` dead code — self-hosted auth Phase 7. `[harvested]`
- Complete self-hosted auth Phases 6–7. `[harvested]`
- Align `user-service` package layout with the other Spring services.
- Mobile apps consume `libs/api-clients` instead of duplicating generated client copies.
- Replace the payment stub with a real PSP integration (never taking custody of funds).

## Product

- Passenger live ETAs — currently absent; monitoring and analytics surfaces run on mock data.
- Real AVL / live tracking pipeline beyond the IoT pilot. `[harvested]`

## Strategy

- Validate strategy assumptions `A-01`..`A-14` —
  [strategy/06-assumption-log.md](strategy/06-assumption-log.md). 0 of 14 done, and this is where the
  company is actually built rather than in the code.
