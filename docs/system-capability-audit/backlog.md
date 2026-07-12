# Global Backlog — roll-up

> **Thin roll-up, not a copy.** Per-section backlogs (`sections/S{n}-*/backlog.md`) are the working
> lists. This page holds only (1) **cross-cutting** items whose work spans multiple sections
> (`X-` IDs) and (2) the **current escalated top item per section**. See
> [README.md](README.md) §8.

## Cross-cutting items (span multiple sections)

| ID | Title | Sections | Impact | Effort | Bucket | Owner | Status | Subsumes |
|---|---|---|:-:|:-:|:-:|:-:|---|---|
| X-01 | **Per-stop actual-time capture** (`trip_stop_event`) — closes the planning feedback loop; unlocks real ETAs, OTP, analytics | S3, S6, S7, S8 | 5 | 4 | P2 | Human | Open | I-S3-08 (+ future S6/S7/S8 items) |
| X-02 | **Notification service** — assignment/cancellation/reassignment alerts; none exists today | S3, S1, S5, S9 | 3 | 4 | P2 | AI+Human | Open | I-S3-12 (+ future items) |

> Add cross-cutting items here as later section captures reveal shared dependencies. Each should
> link back to the per-section `I-*` items it subsumes so closing it updates all of them.

## Escalated top item per section

| Section | Top item | Bucket | Status |
|---------|----------|:-:|---|
| S3 Operations & Trips | [I-S3-01 Calendar/exception-aware trip generation](sections/S3-operations-trips/backlog.md) | **P0** | Open |
| S1, S2, S4–S10 | _(not captured yet)_ | — | — |

## Program view — P0 count by section

| Section | P0s open | Notes |
|---------|:-:|---|
| S3 | 5 | I-S3-01/05/03/02/04 — all code-confirmed |
| others | — | pending capture |

## Done log (program-level)

_(cross-cutting items land here when closed; per-section completions live in each section's backlog)_
