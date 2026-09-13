---
id: INC-005
title: Profile photos visible and settable in the portal
state: shaped
track: 1
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
cannot send. The hook is the whole reason this increment is worth doing before any other surface:
every later one reuses it rather than rediscovering the problem. It owns the fetch, the object-URL
lifetime, and revoking it on unmount so a long-lived portal session does not leak blobs.

**Signed URLs are deliberately deferred, not rejected.** ADR-009 already records presigned delivery
as the answer at a scale we do not have. One authenticated fetch per avatar is irrelevant on a
profile page showing exactly one. It stops being irrelevant on a list of fifty conductors, so the
increment that first renders a list is the one that should reconsider — and it will have real numbers
to reconsider with, rather than a guess made now.

**No new avatar component.** `libs/ui` already has one with an initials fallback, and the portal and
passenger web already render it. This increment gives it an image to show rather than replacing it.

**The existing initials fallback stays the answer for "no photo".** It is already correct behaviour,
it is what most users will see until they upload something, and it means a failed or missing image
degrades to something deliberate rather than to a broken-image icon.

**The generated client is regenerated, never hand-written.** The upload and fetch endpoints are a
published contract, and a hand-rolled call here would be a contract lie that survives until someone
changes the controller.

## Acceptance criteria

- [ ] A signed-in staff user sees their own photo on their profile screen, and sees the initials
      fallback instead when they have none — never a broken image.
- [ ] They can choose an image file and, without reloading the page, see their own new photo replace
      the old one.
- [ ] Choosing a file the backend rejects — too large, or not an image — produces a message that says
      which of the two happened, in the interface, rather than a silent failure or a generic error.
- [ ] The photo a user sees is their own. Verified by signing in as two different roles in turn, not
      by reading the code.
- [ ] Leaving and returning to the profile screen repeatedly does not accumulate object URLs.
- [ ] The API client is regenerated from the service's own contract, and the diff shows the new
      endpoints arriving that way rather than by hand.
- [ ] Verified by actually driving the portal in a browser, across all four role dashboards, with a
      real signed-in session — not by unit tests alone.

## Out of scope

- **Showing other people's photos anywhere** — crew lists, the admin users table, MOT operator
  lists. Permissions already allow it, so it is genuinely unblocked, and that is exactly why it
  should be its own increment rather than quietly doubling this one. It is also the increment that
  should weigh signed URLs, because it is the first with a list.
- **conductor-mobile**, which still shows a stock photo of a stranger as the signed-in conductor.
  React Native needs a different fetch, a different picker and a different auth story; bundling it
  here would mean two unrelated implementations in one review.
- passenger-web and passenger-mobile profile screens.
- Cropping, rotating, client-side resizing, or any editing before upload.
- Removing a photo once set. Worth having, not needed to prove the path works.
- Caching images across screens or sessions.

## Constraints

- **R2 overall**, because regenerating `libs/api-clients` is R2 even though the app and `libs/ui`
  changes are R1. **A2**, which is the ceiling for frontend work regardless: `policy.yaml`'s honest
  override says so until a frontend CI gate exists, and the last acceptance criterion above is what
  stands in for that missing gate.
- **Track 1.** It handles personal data, but it adds no new risky surface — access control is
  enforced in the backend and unchanged here, and every part of it is reversible.
- Depends on [INC-004](INC-004-registration-profile-record.md). A newly registered user has no
  profile record, so upload fails for exactly the users this feature is for.
- The upload contract must not change. If the UI wants something the API does not offer, that is a
  finding to raise, not a reason to edit a generated client.

## Open questions

- Should the profile screen show a user their own photo at a size worth uploading a good photo for,
  or is a small avatar the whole feature? This decides whether a larger view is needed, and it is
  cheap to answer by looking at the screen.
- Does an upload failure need to distinguish "the file was rejected" from "the network failed"? The
  criteria above assume the first matters and the second can be generic.

## Decisions

- See [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md). This increment
  records no new architectural decision; the deferral of signed URLs is ADR-009's, restated here as
  design rather than decided again.
