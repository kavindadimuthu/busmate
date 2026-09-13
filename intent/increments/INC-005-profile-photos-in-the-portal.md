---
id: INC-005
title: Profile photos visible and settable in the portal
state: in-review
track: 2
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A person signed into the portal — admin, MOT, operator or timekeeper — can see their own profile
photo and replace it from the profile screen. This is the first time any BusMate interface shows a
real photo of the person using it, and it turns [INC-003](INC-003-media-storage-foundation-profile-photos.md)
from a working API into something a user can actually reach.

## Why now

The backend has been proven end to end and seven demo accounts already have photos, but no interface
asks for them. Every remaining media surface — crew lists, operator logos, vehicle images — needs the
same missing piece first: a way for the browser to display an image that requires an authenticated
request. Building that once, here, is what makes the later surfaces small.

The portal is the right first surface because its four role dashboards share one profile component,
so a single implementation lands for every staff role at once.

## Design

**A shared hook fetches the image and hands the existing avatar component an object URL.** Media is
proxied through the gateway and therefore needs an `Authorization` header, which a plain `<img src>`
cannot send — and the portal's session lives in an httpOnly cookie the browser will not attach to an
image request either. The hook owns the fetch and the object-URL lifetime: exactly one URL is alive
at a time, the previous one is released only once its replacement has arrived so a replacement never
blinks back to initials, and the last is released on unmount.

**Signed URLs are deliberately deferred, not rejected.** ADR-009 already records presigned delivery
as the answer at a scale we do not have. One authenticated fetch per avatar is irrelevant on a
profile page showing exactly one. It stops being irrelevant on a list of fifty conductors, so the
increment that first renders a list is the one that should reconsider.

**No new avatar component.** `libs/ui` already has one with an initials fallback. The four role
dashboards each carried an identical copy of it pointing at a placeholder image that does not exist,
so every staff user had always seen initials; one shared portal component now replaces all four.

**The existing initials fallback stays the answer for "no photo".**

**The generated client is regenerated, never hand-written — with one exception it forces.** Upload
goes through the generated client. The photo download cannot: the code generator reads every
non-JSON response as text, which corrupts image bytes, so that single call is made by hand. That is a
limitation of the generator, not of the contract.

## Acceptance criteria

- [x] A signed-in staff user sees their own photo on their profile screen, and sees the initials
      fallback instead when they have none — never a broken image.
- [x] They can choose an image file and, without reloading the page, see their own new photo replace
      the old one.
- [x] Choosing a file the backend rejects — too large, or not an image — produces a message that says
      which of the two happened, in the interface, rather than a silent failure or a generic error.
- [x] The photo a user sees is their own. Verified by signing in as two different roles in turn, not
      by reading the code.
- [x] Leaving and returning to the profile screen repeatedly does not accumulate object URLs.
      Measured in the browser: seven visits created seven URLs, released six, and held only the one
      on screen.
- [x] The API client is regenerated from the service's own contract, and the diff shows the new
      endpoints arriving that way rather than by hand.
- [x] Verified by actually driving the portal in a browser, across all four role dashboards, with a
      real signed-in session — not by unit tests alone.

## Out of scope

- **Showing other people's photos anywhere** — crew lists, the admin users table, MOT operator lists.
  It is also the increment that should weigh signed URLs, because it is the first with a list.
- **Photos in conductor-mobile**, which still shows a stock photo of a stranger as the signed-in
  conductor. Its logout was changed here, but only because regenerating the shared client forced it —
  see Discovered during the work.
- Photos in passenger-web and passenger-mobile profile screens.
- Cropping, rotating, client-side resizing, or any editing before upload.
- Removing a photo once set.
- Caching images across screens or sessions.

## Constraints

- **R2 overall**, and **A2**, the ceiling for frontend work until a frontend CI gate exists.
- **Raised from Track 1 to Track 2 during the work.** It was shaped as UI work with no new risky
  surface. What landed also closes an access-control hole in INC-003 and changes how three apps end a
  server session. Both are auth-path changes, and the reviewer should read `ProfilePhotoService`,
  `UserProfileService` and the three `AuthContext` logout changes line by line, not at design level.
- Depends on [INC-004](INC-004-registration-profile-record.md).
- The upload contract's wire behaviour did not change. Its published description did, because it was
  wrong — see below.

## Open questions

- Should the profile screen show a user their own photo at a size worth uploading a good photo for,
  or is a small avatar the whole feature?
- ~~Does an upload failure need to distinguish "the file was rejected" from "the network failed"?~~
  **Resolved: yes, and it does.** The backend's own message is shown for a rejected file; a network
  failure gets a separate message.

## Discovered during the work

**INC-003 shipped an access-control hole, found only by looking at the portal.** The profile screen
showed a field called "profile photo key". That key lived in the profile document, which its owner
can edit, and the photo read trusted it. A passenger could write the MOT officer's key into their own
profile and download his photo through their own account — confirmed byte for byte before the fix.
The read check passed because it was made against the reader's account, not the photo's owner. The
key is now always derived from the user id and never read from client-writable data, the field name
is stripped from profile edits, and a regression test proves the attack returns nothing — it was run
and seen to fail before the fix was applied. INC-003's design text is corrected to match.

**The published contract described both photo endpoints wrongly.** It declared the multipart upload
as JSON and the image download as text, so a client generated from it could call neither. The
controller now states what it consumes and produces; nothing on the wire changed.

**Regenerating the client exposed a logout defect in three apps that predates this work.** The
backend stopped reading an explicit token argument on logout during auth migration Phase 2a, but the
committed client was never regenerated, so passenger-web, passenger-mobile and conductor-mobile kept
passing one. Each app also wipes its stored session before calling logout, while the client reads the
token from that storage — so with a correct client, every logout would have gone out unauthenticated
and left the server session alive, silently. All three now start the logout before clearing local
state, bounded to three seconds. The owner approved this for conductor-mobile; passenger-web and
passenger-mobile had the identical defect and were fixed the same way on the same reasoning. Verified
in a browser for passenger-web: the old session is rejected after logout. **The two mobile apps are
verified by type-check only and need a logout tested on a device.**

**A "Forbidden" profile page was a test-environment artifact, not a bug here.** With another portal
instance holding port 5173, this one started on 5174. user-service keeps its own hardcoded origin
allowlist behind the gateway and answered that origin with a bodyless 403 indistinguishable from a
permission denial. Logged to the backlog.

## Decisions

- See [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md). No new ADR: the
  derived-key change corrects an implementation defect rather than changing ADR-009, which already
  commits to opaque keys and owner-managed access.
