---
id: INC-006
title: Other people's photos in the portal's lists and detail pages
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

Portal staff see the faces of the people they manage: an operator sees their conductors, MOT sees
the contact person behind each operator, and an admin sees every user — in the list tables and on
each person's detail page. Until now the only photo anywhere in the portal was your own.

## Why now

[INC-005](INC-005-profile-photos-in-the-portal.md) built the piece that lets a browser display an
image needing an authenticated request, and the backend already permits every one of these views.
What is missing is purely display, and it is the most visible payoff of the media work so far.

## Design

**One shared cache of photos for the whole session, keyed by user.** A list re-renders on every sort,
filter and page change, and the gateway allows 100 requests a minute per client for everything. So
each person's photo is fetched at most once per session, concurrent requests for the same person
share one fetch, and "this person has no photo" is remembered as firmly as a photo is — otherwise
every photo-less row costs a request on every render. Uploading a photo replaces that person's entry,
so your new photo also appears anywhere you are already on screen.

**The cache is emptied on sign-out.** A later user on the same browser tab must never be shown
images, or remembered absences, fetched under someone else's session. Sign-out also reloads the page,
which discards it anyway; it is cleared explicitly so that stays true if sign-out ever stops
reloading.

**Object URLs now live for the session rather than for a component.** INC-005 released each URL when
its avatar unmounted, which was right for one photo but would refetch every row on every page change.
Each person now holds at most one URL, reused wherever they appear and released when replaced or at
sign-out, so memory is bounded by the number of distinct people viewed rather than by navigation.

**Rows without a photo look exactly as they did before.** Each screen passes the fallback it already
showed — the conductor dot, the building icon, the initials — so the only visible change is a face
where one exists.

**MOT's operator rows show the linked contact person's photo**, labelled as such on hover. An operator
is a company; a company logo is a separate future feature and would replace this. Operators with no
linked account keep the building icon. The operator detail page had no picture at all, so the contact
person's photo is placed beside the company name, labelled the same way.

**Signed URLs stay deferred.** The measurements below say photos are not what presses on the rate
limit, so there is no case yet for reopening ADR-009.

## Acceptance criteria

- [x] The operator crew list, MOT operators list and admin users list each show a photo for people who
      have one, and the existing fallback for people who do not — never a broken image.
- [x] The crew detail, operator detail and user detail pages show the same person's photo.
- [x] Sorting, filtering, and paging back to a page already seen send no further photo requests —
      measured in the browser by counting requests, not asserted from the code. Covered sorting on
      the crew and operators lists, switching back and forth between admin user-type tabs including a
      tab of people with no photo, and opening a detail page for someone already seen in a list.
- [x] A list page's first view stays well inside the gateway's per-minute limit, with the real number
      of requests recorded here: crew list 9 gateway requests (1 photo), operators list 19 (3 photos),
      admin users list 49 (1 photo). The last is close to half the limit, and photos are not why — see
      Discovered during the work.
- [x] After signing out and signing in as a different role in the same tab, no photo or remembered
      absence from the previous session is shown.
- [x] An operator's crew list requests photos only for that operator's own conductors.
- [x] Verified by driving the portal in a browser as operator, MOT and admin. INC-005's own-profile
      photo, upload and rejection message were re-verified on the shared cache as well.

## Out of scope

- Company logos for operators.
- Photos anywhere outside the portal, including conductor-mobile's stock photo.
- Bus images.
- Tightening who may read a conductor's photo. Any operator may today, platform-wide — see the
  backlog. This increment only shows an operator their own conductors, but the backend still permits
  more.
- Signed URLs or any backend change.
- Reducing the admin users page's request volume — logged to the backlog instead.

## Constraints

- **R1, A2.** Frontend only; A2 is the ceiling until a frontend CI gate exists.
- **Larger than the default slice, by the owner's choice.** Detail pages were included deliberately.
  It stayed reviewable in one sitting because all six screens reuse one shared photo component and no
  screen needed a special case.
- Must not change what INC-005's own-profile photo does. Re-verified: it still loads, replaces without
  a reload, releases the replaced image, and shows the rejection message.

## Open questions

- None.

## Discovered during the work

**Photos are not what presses on the gateway's rate limit; the portal's token handling is.** Opening
the admin users list sends 49 gateway requests: 24 are fetches of the access token, because the
portal's token cache does not share a fetch already in flight and a burst of parallel calls each asks
for its own; 22 are user-list and count calls, three for each of six user types; and exactly 1 is a
photo. A single view of that page uses about half a minute's allowance. Logged to the backlog with
these numbers, since it would cause rate-limit failures on that page regardless of photos.

**MOT's operator detail page never had a picture slot.** Its header was text only, so the contact
person's photo was added beside the company name rather than replacing an existing element.

## Decisions

- No new ADR. Deferral of signed URLs remains ADR-009's decision; this increment supplies the numbers
  a future revisit would need, and those numbers do not justify one.
