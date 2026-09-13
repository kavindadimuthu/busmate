---
id: INC-003
title: Media storage foundation, proven on user profile photos
state: active
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

**A replacement overwrites the previous object rather than accumulating alongside it**, so that
storage grows with the number of users rather than the number of edits. This falls out of deriving
the key from the user's identifier instead of generating a fresh one per upload, which also means no
orphaned object can outlive the profile that pointed at it.

**The photo key is not stored anywhere; it is derived from the user's identifier on every read.**
*Superseded during [INC-005](INC-005-profile-photos-in-the-portal.md).* This increment originally
recorded the key inside the profile document and trusted it on read. The profile document is
editable by its owner, so a user could write another user's key into their own profile and read that
photo through their own account — the access check passed because it was made against the reader's
account, not the photo's owner. Nothing a client can write may decide which object a read returns.
Deriving the key also keeps this increment free of a schema migration. Vehicle images will not be
able to derive a key from an owner in the same way and should expect a migration, and the R3 that
comes with it.

## Acceptance criteria

- [x] A user who uploads a photo through the gateway and then reads their own profile gets the photo
      back; a user who has never uploaded one gets an unambiguous "no photo" answer rather than a
      broken or placeholder link. **Holds only for a user who has a profile record — see Discovered
      during the work.**
- [x] A user cannot read or overwrite another user's photo, and an unauthenticated request cannot
      reach media at all — including by guessing or replaying an object key.
- [x] The stored object cannot be made to serve as anything other than an image, regardless of what
      the uploader declares the file to be or what it is named.
- [x] An upload larger than the configured limit, or that is not a supported image, is rejected with
      a message that says which of the two happened — and nothing is written to storage.
- [x] A photo containing GPS and timestamp metadata, once uploaded, can be fetched back and shown to
      contain neither.
- [x] Replacing a photo leaves exactly one object for that user in storage.
- [ ] The whole flow works against a freshly cloned repository with the documented development
      commands and no account on any external service.
- [x] Pointing the deployment at a different S3-compatible endpoint changes configuration only — this
      is verified by an actual run against a second endpoint, not by inspection of the code. **Partly
      met:** the acceptance suite runs the same code against a second, independent endpoint with
      different credentials and a different bucket, purely by configuration. That is a real second
      endpoint but the same server software, so it does not yet prove portability across a
      *different* S3 implementation.
- [x] Acceptance tests name INC-003 and run against real storage and a real database, consistent with
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
- Keys embed the owning entity, so that an authorisation decision never requires a database
  round-trip. Getting this wrong is expensive to change once objects exist.
- **Tenancy is deliberately absent from the key.** ADR-004 and ADR-005 describe logical
  multi-tenancy, but `user-service` has no tenant column and no tenant-aware code today, so a tenant
  segment in the key would be inventing a value rather than recording one. The user identifier is
  globally unique and the existing permission checks already answer "may this caller reach this
  user", so nothing is lost while tenancy remains unimplemented — but whichever increment introduces
  a real tenancy model must revisit the key layout while the object count is still small enough for
  that to be cheap.

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

## Discovered during the work

**Self-registration does not leave a profile record, and that blocks this increment's goal for
exactly the users most likely to set a photo.** `registerPassenger` writes the user, the credential,
the identity and the profile inside one transaction, yet the profile row is absent afterwards while
the user row is committed. It reproduces on every self-registration. This is not caused by anything
here — the pre-existing profile read fails identically for the same user, and nothing in this
increment touches the registration path — but a newly registered passenger currently cannot upload a
photo, because there is no profile document to record the key in.

Two consequences, both narrowing rather than expanding this increment:

1. The first acceptance criterion is met only for users that have a profile record. End-to-end
   verification used a profile created directly in the local development database.
2. The fix belongs to its own increment, in the registration path rather than in media. Doing it
   here would mix an auth-path change into a media review, and the cause is not yet understood —
   a transaction that commits one of its writes and silently drops another deserves an explanation
   before a fix, because the same shape could affect the credential and identity writes beside it.

**No gateway change was needed.** `/api/users` is already proxied by prefix, and the proxy streams
bodies rather than parsing them — a global JSON body parser was deliberately avoided there — so
multipart passes through untouched. This was the risk most likely to cost a day, and it cost none.

## Decisions

- See [ADR-009](../decisions/ADR-009-self-hosted-s3-compatible-media-storage.md).
