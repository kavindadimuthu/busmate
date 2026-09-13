---
id: INC-007
title: A conductor's own photo in conductor-mobile
state: in-review
track: 1
risk: R1
owner: kavinda
autonomy: A2
---

## Goal

A conductor sees their own face in the app, and can change it from the phone — from the photo
library or by taking one. Today all three places that show "their" photo show the same stock
portrait of a stranger, and the camera buttons next to it do nothing.

## Why now

It is the last place in BusMate that actively shows something false. The backend and the upload rules
have been proven since [INC-003](INC-003-media-storage-foundation-profile-photos.md), and the portal
has done the same job twice, so the remaining work is only what React Native does differently.

## Design

**The stock portraits are deleted, not just unused.** A photo of a stranger presented as the
signed-in conductor is the defect; leaving the files in the repository invites their return. Anyone
without a photo gets their initials, the same answer the portal gives.

**One shared photo for the whole app, fetched once.** The home header, the profile tab and the edit
screen all show the same person, so they share one cached photo. Replacing it updates all three at
once, and signing out discards it — a second conductor signing in on the same phone must never see
the first one's face.

**The photo is held as a data URI rather than a blob URL.** React Native's image component cannot
read blob URLs, and passing an authorization header per image works only on device, not in the web
preview this increment is verified in. Decoding to a data URI works in both.

**The upload is written by hand, like the portal's download, and handles both platforms.** The
generated client builds multipart bodies only from web file objects. A phone supplies a file
reference; the browser supplies a real file. Sending the phone's shape from a browser silently
posts the text "[object Object]", so the upload sends whichever the platform actually gave it.

**The choice of camera or library is an in-app sheet, not a native alert.** A native alert does
nothing in the web preview, so an alert-based choice could never be verified here, and the sheet
behaves identically on a phone.

**Permission refusals are explained, not swallowed.**

## Acceptance criteria

- [x] A conductor with a photo sees it on the home header, the profile tab and the edit profile
      screen; a conductor without one sees their initials in all three — never a stranger.
- [x] Neither stock portrait file remains in the repository, and nothing references them.
- [x] The camera buttons on the profile tab and the edit screen each offer the photo library or the
      camera, and cancelling leaves the current photo alone.
- [x] After a successful change, all three screens show the new photo without restarting the app.
- [x] A file the backend rejects — too large, or not an image — shows the backend's own message.
      Observed: the upload answered 400 and the screen showed "The uploaded file is not an image
      format this server can decode.", with the initials left in place.
- [ ] Declining the photo-library or camera permission produces a message saying so. **Not
      verifiable in the browser preview, which grants silently — owed on a device.**
- [ ] Signing out and signing in as a different conductor on the same phone never shows the previous
      conductor's photo. **The cache is cleared in the sign-out path, but the app's sign-out asks for
      confirmation through a native alert, which does nothing in the web preview — owed on a device.**
- [x] The photo is fetched once per session no matter how often the three screens are visited —
      measured: one request covering home, profile and edit, and a second only after an upload.
- [x] Verified by driving the app in the browser preview, plus a type-check (back to the 2 errors
      that predate this work). **A check on a real device is owed and cannot be done here**, and it
      should cover the camera path, a refused permission, and sign-out.

## Out of scope

- Other people's photos in the mobile app; a conductor sees only their own.
- passenger-mobile's profile screen.
- Bus images.
- Caching the photo on disk between app launches, and any offline behaviour.
- Cropping or rotating before upload.

## Constraints

- **R1, A2.** Frontend only, and A2 is the ceiling until a frontend CI gate exists — the browser
  preview stands in for the gate, imperfectly, because the real target is a phone.
- **No new dependency.** `expo-image-picker`, `expo-camera` and `expo-file-system` were already
  declared and in the lockfile, and the Android photo and camera permissions were already configured.
- The upload contract does not change.

## Open questions

- None.

## Discovered during the work

**The committed `.env` points the app at a gateway address that no longer exists.** It names
`10.221.96.234`, while this machine is now `192.168.8.181`, so the app cannot reach the backend from
any device on this network until it is updated — unrelated to photos, and it will block the device
check this increment owes. Verification used a local, untracked override rather than editing the
tracked file, and the override was removed afterwards. Logged to the backlog.

**The upload needed to handle the browser's file object as well as the phone's.** Found only because
the preview exercised a real upload: the first attempt posted the phone's file reference from a
browser, which serialises to a string and reaches the server as a text field rather than a file.

## Decisions

- See [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md). No new decision.
