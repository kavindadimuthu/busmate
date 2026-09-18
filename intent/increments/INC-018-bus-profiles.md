---
id: INC-018
title: Operators register and keep their buses' profiles, seat layouts, photos and documents
state: active
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

An operator registers a bus and keeps its profile current — registration details, service class,
facilities, a seat layout they design, day-to-day availability, photos and scanned documents —
and retires it when it leaves the fleet. MOT sees every bus the same way and can suspend one.

## Why now

Operator fleet screens were read-only and bus registration was MOT-only. Seat layout drives the
conductor seat map, passenger booking and ticket seat numbers, but nothing let anyone design one.
Owner decision 2026-09-18: add the AWS S3 SDK to core-service for bus media (ADR-009); media
scope = photo gallery and documents.

## Design

- **Registration status and availability are separate** (design R3). `status` is whether the bus
  may run at all (MOT suspends; the operator retires). `availability` is a dated window
  (`UNDER_MAINTENANCE` / `OFF_ROAD`, from–until) the operator sets day to day.
- **The seat layout is the capacity.** The server validates the shape every consumer reads (rows of
  left/right seat ids, an optional back row, blocked seats that exist) and that the number of seats
  equals capacity. The editor numbers seats front to back, left to right — the ticket seat numbers.
- **Media lives in object storage, owned by the bus.** Keys are derived by the server
  (`buses/{busId}/photos|documents/{mediaId}`). Photos are re-encoded (EXIF stripped); documents
  are PDFs (stored as uploaded) or images (re-encoded), always served as sandboxed attachments.
  One cover photo per bus, enforced by a partial unique index.
- **Retiring ends the bus's permit links** and freezes its profile; history is kept.

## Acceptance criteria

- [ ] An operator registers a bus with a custom seat layout, facilities and service class; a
      layout whose seat count differs from capacity, repeats a seat, or blocks a non-existent seat
      is refused.
- [ ] An operator cannot register or edit a bus for another operator, or read its media.
- [ ] Marking a bus under maintenance for a window makes it unavailable on those days only.
- [ ] Retiring a bus ends its permit links and further edits are refused.
- [ ] Only MOT suspends and reinstates a bus.
- [ ] Photos: the first is the cover, the cover can be moved, deleting it promotes the next.
- [ ] Documents: PDF or image, typed, with an optional expiry; served as a sandboxed attachment;
      non-image photos and untyped documents are refused.
- [ ] Tests named INC-018 cover the above against real Postgres and a real MinIO.

## Out of scope

- Checking that a seat-layout change leaves no upcoming booking on a removed seat (needs a
  ticketing lookup; the edit form warns instead).
- Showing bus photos to passengers.
