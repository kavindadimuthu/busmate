---
id: INC-003
title: Media storage foundation, proven on user profile photos
state: shaped
track: 2
risk: R2
owner: kavinda
autonomy: A2
---

## Goal

A signed-in user can replace their profile photo and see it again on their next request, with the
bytes stored in self-hosted object storage that runs identically on a laptop and on a bare VPS. This
is the first media of any kind in BusMate, so it establishes the pattern every later surface copies —
which is why it is scoped to one narrow surface rather than to media in general.

## Why now

Vehicle images, operator logos and permit scans are all blocked on the same missing foundation, and
each one built independently would produce a different answer to the same questions about buckets,
keys, validation and access control. The cost of getting the pattern wrong is paid once per surface
that copies it, so the pattern is worth establishing deliberately before there are three of them.

Profile photos are the right first surface because they are low-volume, small, non-critical if lost,
and already conceptually owned by a service that exists.

## Design

Decided in [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md): self-hosted
S3-compatible storage as infrastructure, the S3 API as the portability boundary, the owning service
owning its media, and opaque object keys in the database rather than URLs. What that ADR leaves to
this increment:

**Storage is a shared infrastructure container, not a service.** It joins the existing development
Compose stack the way Postgres does — one instance, isolated per owning domain by bucket, with
credentials in the existing central secrets file rather than a new mechanism.

**Uploads are proxied through the owning service rather than presigned.** At this volume and object
size, the bandwidth cost of proxying is irrelevant, and proxying keeps authentication, size limits,
content sniffing and metadata stripping in one place that cannot be bypassed. Presigned upload is the
right answer at a scale we do not have, and is deliberately deferred; the key-based storage model
means adopting it later changes no stored data.

**Content type is determined by inspecting the bytes, not by trusting the client.** A declared
`Content-Type` from an uploader is an assertion, not evidence, and storing it unverified is how an
image bucket starts serving HTML.

**Image metadata is stripped on ingest**, per invariant 8 — a phone photo carries GPS and capture
time.

**The old object is deleted when a photo is replaced**, so that storage growth is bounded by user
count rather than by edit count.

**The photo key is stored alongside the other profile attributes rather than in a column of its
own.** A user's profile is already a validated document rather than a fixed column set, so a
dedicated column would be inconsistent with every other profile attribute, and nothing needs to query
users by whether they have a photo. This is what keeps the increment free of a schema migration —
which is a consequence of the existing design, not a reason to prefer it. Vehicle images will not
inherit this, and their increment should expect a migration and the R3 that comes with it.

## Acceptance criteria

- [ ] A user who uploads a photo through the gateway and then reads their own profile gets the photo
      back; a user who has never uploaded one gets an unambiguous "no photo" answer rather than a
      broken or placeholder link.
- [ ] A user cannot read or overwrite another user's photo, and an unauthenticated request cannot
      reach media at all — including by guessing or replaying an object key.
- [ ] The stored object cannot be made to serve as anything other than an image, regardless of what
      the uploader declares the file to be or what it is named.
- [ ] An upload larger than the configured limit, or that is not a supported image, is rejected with
      a message that says which of the two happened — and nothing is written to storage.
- [ ] A photo containing GPS and timestamp metadata, once uploaded, can be fetched back and shown to
      contain neither.
- [ ] Replacing a photo leaves exactly one object for that user in storage.
- [ ] The whole flow works against a freshly cloned repository with the documented development
      commands and no account on any external service.
- [ ] Pointing the deployment at a different S3-compatible endpoint changes configuration only — this
      is verified by an actual run against a second endpoint, not by inspection of the code.
- [ ] Acceptance tests name INC-003 and run against real storage and a real database, consistent with
      the existing Testcontainers convention.

## Out of scope

- **Any frontend UI.** No picker, no cropper, no avatar component. This increment is observable
  through the gateway's own API and nothing else. The UI across the portals and mobile apps is its
  own increment, and splitting it out is what keeps both reviewable.
- **Vehicle images.** They are the second surface deliberately, so that the pattern is proven and
  reviewed once before it is copied. Their own increment follows this one and should be mostly
  reuse — if it is not, this increment got the abstraction wrong.
- Operator logos, permit scans, incident photos, and any document (non-image) upload.
- Thumbnail or derivative generation, and any image transformation beyond metadata stripping.
- A CDN, caching layer, or presigned-URL delivery.
- Virus and malware scanning. It is a real requirement for user-supplied documents later; it is not
  one for an image pipeline that re-encodes what it stores.
- Backup and restore of the object store. Named as a consequence in ADR-009, owed a backlog entry,
  not solved here.

## Constraints

- **Two `always_human` approvals gate the start of implementation**: adding the storage server image
  and the S3 client library are new third-party dependencies, and the licence question raised in
  ADR-009 has to be answered first because it may decide which server.
- **R2 but still Track 2**, at A2 — every line read. Track is chosen by blast radius, not by risk
  class: this handles personal data, stands up storage whose key layout is expensive to change once
  objects exist, and creates an access-control surface that ADR-009 records cannot rely on RLS. A2
  rather than A3 because the evidence that would justify A3 — integration coverage that actually runs
  in CI — does not exist yet, per the known debt in [context.md](../context.md).
- Storage credentials belong in the existing central secrets file; this increment does not invent a
  second place for secrets.
- The upload contract is a published contract — clients are generated, never hand-edited.
- Keys embed owning tenant and entity, so that an authorisation decision never requires a database
  round-trip. Getting this wrong is expensive to change once objects exist.

## Open questions

- ~~Does serving media through the gateway violate invariant 1, or satisfy it?~~ **Resolved: media is
  proxied through the gateway.** Invariant 1 is read strictly. Presigned delivery is deferred, not
  rejected — the key-based storage model means adopting it later changes no stored data.
- ~~Which S3-compatible server, given the AGPL question in ADR-009?~~ **Resolved: MinIO, with the
  AGPL obligation accepted knowingly and the client kept vendor-neutral so the choice stays
  reversible.** See ADR-009.
- ~~Should the object store be reachable from outside the Compose network in a default
  deployment?~~ **Resolved by the proxying decision: no.** Nothing outside the Compose network needs
  to reach it, so it publishes no host port beyond what local development debugging requires, and
  none at all in production. A deployment that exposes it has misconfigured itself.
- Is a user's profile photo visible to anyone other than that user? Conductor and operator surfaces
  plausibly want to show crew photos, which would change the access rule from "owner only" to
  something the permission engine has to answer. The acceptance criteria above assume owner-only, and
  that assumption is cheap to hold and expensive to guess wrong.

## Decisions

- See [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md).
