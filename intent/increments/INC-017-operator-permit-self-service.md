---
id: INC-017
title: Operators keep their own permit records; MOT can suspend them
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

An operator records, edits and withdraws the passenger service permits their company holds, and
links their own buses to them, without asking anyone. MOT sees every permit and can suspend,
reinstate or withdraw one with a reason the operator sees.

## Why now

Permits are what trips are assigned to, but the operator's permit screens were mock data and only
MOT could create a permit. Permits are issued outside BusMate; the system only needs an accurate
copy of the ones that exist ([design](../../docs/operator-portal-business-processes.md) §3).

## Design

- **An operator-recorded permit is in force immediately** (owner decision 2026-09-18 — no MOT
  verification step). Permit numbers stay unique system-wide; a clash is a conflict to resolve with
  MOT, never an overwrite.
- **Suspend and withdraw carry a reason.** Stored statuses are the shared enum: `inactive` =
  suspended by MOT, `cancelled` = withdrawn. Expiry is derived from the date, never stored.
- **Bus links are self-service within the permit's cap** (design R4). The bus must be the
  operator's own, active, and of the service class the permit type requires. Ending a link closes
  it today (history survives); a link that has not started yet is simply removed.
- **A permit with trips or links on record is withdrawn, never deleted.**
- Every versioned table gets `version NOT NULL DEFAULT 0`: seeded rows had NULL versions, which made
  every seeded record un-updatable through JPA.

## Acceptance criteria

- [ ] An operator records a permit and it is active at once; a permit number already recorded for
      another operator is refused.
- [ ] An operator's permit list shows only their permits, filtered and paged by the server.
- [ ] An operator cannot read or change another operator's permit.
- [ ] Linking refuses another operator's bus, a bus of the wrong class, and a bus beyond the cap.
- [ ] Withdrawing ends the permit's links and records the reason.
- [ ] MOT suspends a permit (it then authorises no new links), and reinstates it; an operator
      cannot suspend.
- [ ] A permit with trips on record cannot be deleted.
- [ ] Tests named INC-017 cover the above against real Postgres.

## Out of scope

- Uploading a permit scan (not requested).
- Moving a permit from one operator to another (MOT edits the permit directly).
