-- INC-031: applying and reverting a staff decision on a changeset (ADR-018).
--
-- applied_version records the stop's version right after an approval wrote it, so a later revert
-- can tell whether anyone touched the stop since — the same staleness guard approval itself uses
-- against target_version.
--
-- previous_* records the stop's exact provenance before an approval overwrote it (including who
-- was credited, which the public API never exposes — this is read from the entity directly, not
-- through that response) so a revert restores it precisely rather than guessing SRC_4/BusMate.

ALTER TABLE public.changeset
    ADD COLUMN applied_version bigint,
    ADD COLUMN previous_source_tier character varying(8),
    ADD COLUMN previous_observed_at timestamp with time zone,
    ADD COLUMN previous_base_confidence integer,
    ADD COLUMN previous_attributed_user_id uuid,
    ADD COLUMN previous_attribution_label character varying(255),
    ADD COLUMN reverted_by uuid,
    ADD COLUMN reverted_at timestamp with time zone;

ALTER TABLE public.changeset DROP CONSTRAINT changeset_status_check;
ALTER TABLE public.changeset ADD CONSTRAINT changeset_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'REVERTED'));
