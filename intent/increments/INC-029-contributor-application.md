---
id: INC-029
title: A bus enthusiast can apply to become a contributor, and staff can accept, decline or suspend them
state: shaped
track: 2
risk: R3
owner: kavinda
autonomy: A2
---

## Goal

A signed-in passenger on passenger-web can read what contributing means, apply — saying why, which
corridors they know, and any link to a bus operator — and accept the contributor agreement. Staff see
applications in the portal and accept, decline (with a reason the applicant sees) or later suspend. The
applicant always knows where they stand.

## Why now

The trust ladder in [ADR-019](../decisions/ADR-019-contributor-standing-lives-with-the-network.md) starts
here: nobody can propose a change (INC-030) until someone has been accepted, and the pilot in ADR-017
needs a way to bring in its first invited enthusiasts under an agreement that licenses their data to
BusMate.

## Design

- **Community module in core-service** (`community/{controller,service,repository,entity,dto}`). A
  `contributor` row per applicant, keyed by user id: status (`APPLIED`, `ACTIVE`, `DECLINED`,
  `SUSPENDED`), level (`CONTRIBUTOR`, `STEWARD` reserved for later), motivation, home district, corridors of
  interest (route-group ids), declared affiliation (none / works for an operator / owns buses / other,
  plus detail), agreement version and acceptance time, and the last decision's author, time and reason.
- **Standing lookup fails closed.** Other code asks "what may this user do?"; no row, or any status other
  than `ACTIVE`, means reporter rights only.
- **Agreement is versioned.** The current version's text is served by the API. When the version changes,
  an active contributor must accept again before their next proposal.
- **Who may apply:** passenger accounts with a verified email. Staff accounts review; they do not apply.
- **Gateway** routes `/api/community/**` to core-service.
- **passenger-web**: a "Contribute" entry in the header and on the profile page, leading to a programme
  page (what contributors do, what they get, what the agreement says) with the application form and
  agreement acceptance, and afterwards a status page (under review / you're a contributor / declined, with
  the reason / suspended, with the reason).
- **Portal**: MOT and admin get "Community → Contributors", with Applications, Active and Suspended tabs. A
  detail drawer shows the application, the declared affiliation prominently, and the account's name and
  email from user-service. Actions are accept, decline (reason required), suspend (reason required) and
  reinstate.

## Acceptance criteria

- [ ] A passenger with a verified email can apply and accept the agreement; one with an unverified email
      is told why they cannot yet.
- [ ] A staff account cannot apply.
- [ ] Staff see every application with its declared affiliation, and can accept or decline it; a decline
      requires a reason.
- [ ] The applicant sees their current status and, when declined or suspended, the reason.
- [ ] Suspending an active contributor takes effect on their next request, not on next login.
- [ ] A contributor who has not accepted the current agreement version is treated as not active.
- [ ] Tests named INC-029 cover the status transitions, the fail-closed lookup, and agreement re-acceptance
      against real Postgres.

## Out of scope

- Proposing anything (INC-030). Stewards (level exists; appointing them is later).
- Email notification of decisions — the in-app status page is the channel until a notification service
  exists.
- Identity checks stronger than a verified email.

## Constraints

- **The agreement text is a legal document written by a human.** Until the owner provides it, the served
  text is a draft visibly marked as such, and no real (non-test) contributor is accepted under it.
- Motivation and affiliation are personal data: never logged (invariant 8), and removed with the account
  under PDPA erasure.
- New tables via Flyway only; regenerate the core-service client. Named reviewer required.
- The portal's staff-only gate is unchanged; contributors never use the portal.

## Open questions

- Open applications from anyone, or invitation-only during the pilot? Invitation-only is safer and needs
  no extra build: staff simply decline uninvited applications.

## Decisions

- See ADR-017, ADR-019
- Identity is a verified email, chosen by the owner 2026-09-19 — no phone verification, so no SMS
  provider dependency.
