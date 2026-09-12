# ADR-009 · Media lives in self-hosted, S3-compatible object storage

**Date:** 2026-09-12 · **Status:** Accepted
**Type:** architecture

## Context

BusMate has no media capability at all today — no upload endpoint, no storage backend, no
photo/image columns in any entity. The first two surfaces that need one are user profile photos and
vehicle images, and more will follow (operator logos, permit scans, incident photos, ticket QR
assets).

The binding constraint is deployment independence: BusMate must run on a laptop, on a single VPS, or
in any cloud, with no dependency on an external managed service. That rules out the default answer
(managed S3, Cloudinary, Supabase Storage) as the *primary* target — though not as an optional
deployment.

Two existing invariants bear on this and pull in different directions.
[context.md](../context.md) invariant 1 says frontends call the gateway only; invariant 4 says tenant
isolation is enforced in the database via RLS. Object storage has neither a gateway nor RLS.

## Options considered

**Bytes in Postgres (`bytea` or large objects).** Zero new infrastructure, transactional with the row
that references it, backed up by the existing database backup. But it puts binary load on the
connection pool, inflates every dump and replica, and gives no path to range requests or a CDN. It
solves deployment independence by making the database do a job it is bad at.

**Local filesystem plus static serving.** Simplest possible thing. Fails as soon as a service runs
more than one replica, forces a shared volume mount between services that are meant to share nothing
but contracts, and offers no signed-URL semantics — so access control becomes "the path is hard to
guess".

**Self-hosted S3-compatible object store.** One more infrastructure container alongside Postgres,
Kafka and MQTT — all of which we already self-host for exactly this reason. Gives presigned URLs,
range requests, replica-safe shared access, and a well-understood backup story.

**External managed object storage.** Rejected outright against the deployment-independence
requirement, but worth noting it stays *available* under the option above, because the interface is
the same.

## Decision

Media bytes live in **self-hosted, S3-compatible object storage, treated as infrastructure rather
than as a new domain service.** Three commitments follow from that, and they are the actual content
of this decision:

1. **The S3 API is the portability boundary.** Application code talks to an S3 client and nothing
   else. This is what makes "deployable anywhere" true rather than aspirational: the same build runs
   against a local container in development, against a self-hosted store on a VPS, and against
   managed S3 for an operator who wants that — configuration only, no code change. It also means the
   choice of *which* self-hosted server is deferrable and reversible.

2. **No new service owns media.** Per [ADR-003](ADR-003-modular-monolith-over-microservices.md) we do
   not add services lightly, and per [ADR-002](ADR-002-decompose-by-data-not-by-product.md)
   decomposition follows data ownership. Media is not a domain; it is an attribute of entities that
   already have owners. The service that owns the entity owns its media — uploads, validation,
   lifecycle and access control — with storage as shared infrastructure the way Postgres is.

3. **The database stores an opaque object key, never a URL.** A stored URL bakes today's host,
   bucket, scheme and access model into every row, and rots the moment any of them change — which,
   for a platform whose selling point is running anywhere, is guaranteed. The owning service resolves
   a key to a URL at read time.

## Consequences

**Media access control cannot use RLS.** Invariant 4 makes the database the control for tenant
isolation, with application-layer filtering as defence in depth only. Object storage has no
equivalent, so for media the application layer *is* the control. This is a deliberate, named
deviation rather than an oversight, and it is the main reason media work is Track 2. It is mitigated
by keeping the bucket private with no anonymous read, embedding the owning tenant and entity in the
object key so an authorisation check is always possible without a database round-trip, and treating a
leaked key as a leaked object.

**Invariant 1 is under tension and must be resolved explicitly.** Serving media through the gateway
keeps the invariant intact and costs app-tier bandwidth; issuing presigned URLs means a browser
fetches bytes from a host the gateway named at runtime. The second is the scalable answer and is
probably still within the spirit of the invariant — no frontend *holds* a service URL — but it is a
judgment for a human, not for an agent, and it is carried as an open question on the first increment
rather than settled here.

**Stripping image metadata becomes mandatory, not optional.** Invariant 8 forbids personal data in
logs and driver-level position on passenger surfaces. A photo taken on a phone carries GPS
coordinates and a capture timestamp in EXIF. Accepting uploads without stripping that would quietly
publish exactly the data invariant 8 protects.

**Backups now have a second target.** The existing "back up Postgres" story stops being sufficient,
and a restore that recovers rows but not objects yields dangling keys.

**MinIO is the server, and its AGPLv3 licence was accepted knowingly.** MinIO is what the tooling and
the documentation ecosystem assume, and that ordinary-path advantage was judged to outweigh the
licence obligation an operator self-hosting BusMate inherits. Apache-2.0 alternatives were considered
and rejected on ecosystem grounds rather than on technical ones (SeaweedFS, Apache Ozone). The
client-side dependency is the vendor-neutral AWS SDK v2 rather than MinIO's own client, precisely so
that commitment 1 stays real and this choice stays reversible: if the licence obligation later proves
unacceptable to an operator, the server is replaceable as configuration, not as a rewrite. Both are
`always_human` dependency approvals and were taken as such.

## Revisit when

- Media volume or object size stops looking like "a few hundred KB per user or vehicle" — video,
  incident photo bursts, or anything that makes app-tier proxying untenable.
- A second operator deployment wants managed object storage, testing whether commitment 1 actually
  held.
- The tenancy model changes such that key-embedded tenancy is no longer sufficient for authorisation.
