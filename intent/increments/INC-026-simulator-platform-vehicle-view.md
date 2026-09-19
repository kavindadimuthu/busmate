---
id: INC-026
title: The simulator console shows what the platform holds about the bus's health, beside what the bus reports
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A person watching the simulator can see, for the bus it is driving, the vehicle health and active
alerts the platform currently holds, compared with the bus's own state — so a snapshot that has not
arrived, an alert that was raised but never stored, or one that should have been cleared and was not,
is visible instead of assumed.

## Why now

The console already puts the bus's position next to what the platform's live stream says. For vehicle
health the simulator sends the data (INC-025) but can only show that the platform *accepted* it, not
what the platform *holds*. INC-024 added the read path that makes that possible, and it is the only
way to see the whole loop — bus, ingest, storage, read, isolation — working from one screen.

## Design

- **Reads through the same door a portal would.** The simulator server signs in as a staff account and
  polls `GET /api/vehicles/{busId}/state` through the gateway. It does not read the database, and it
  gets exactly what INC-024's isolation lets a staff caller see. There is no vehicle stream, so this
  polls, every couple of seconds.
- **Comparison is a pure function.** Bus state and platform state go in, a verdict comes out: how old
  the platform's copy is, which alerts the bus holds that the platform lacks, and which the platform
  holds that the bus has cleared. Kept apart from the UI so it is tested directly.
- **Honest about lag.** The platform receives at most a snapshot every couple of seconds, so at fast
  playback its copy is far behind the model by design. The console says how old the platform's copy is
  and compares alerts, rather than flagging every reading difference as a fault.
- **Survives an expired session.** A rejected token triggers a fresh sign-in once; a bus with no state
  yet is "waiting", not an error; an unreachable platform is shown and retried.
- **Off when the live stream is off.** Both need the staff sign-in, so `--no-stream` disables both.

## Acceptance criteria

- [x] While the simulator runs, the console shows the platform's snapshot of the bus — fuel, coolant,
      odometer, tyre pressures — with how old it is, updating as the bus drives.
- [x] After a fault is injected, the alert appears in the platform's list within a few seconds and the
      console shows the bus and platform agreeing; after the fault is cleared, the alert leaves the
      platform's list and the console shows them agreeing again.
- [x] An alert the bus holds that the platform does not (not sent yet, or lost) is shown as missing
      from the platform, and one the platform still holds that the bus cleared is shown as stale.
- [x] A bus that has not reported yet shows "waiting", and an unreachable or refusing platform is
      shown with its reason; neither breaks the console.
- [x] An expired staff session is renewed without restarting the simulator.
- [x] Switching bus or route moves the view to the new bus.
- [x] Tests named INC-026 cover the comparison and the polling's session handling.

## Out of scope

- Reading vehicle health as an operator account: the simulator watches as staff, which sees every bus.
- A push stream for vehicle health, and any portal screen.
- History, charts, or thresholds.

## Constraints

- No new dependencies.
- Dev tool against a local stack only, as INC-022; the staff credentials are the dev-seed MOT account.

## Open questions

- None.

## Decisions

- See INC-024 for the read path and INC-025 for what the bus sends.
