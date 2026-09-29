-- INC-061: staff correct an AI's reading of a post and load it. What staff decided (edits, stop matches,
-- override reasons, source label/date) and what loading it actually did (created / already there / failed,
-- row by row) — kept beside the AI's own reading a draft already holds (INC-060), never overwriting it.
ALTER TABLE post_import_draft
    ADD COLUMN resolution jsonb,
    ADD COLUMN load_status varchar(20) NOT NULL DEFAULT 'NOT_LOADED'
        CONSTRAINT post_import_draft_load_status_check CHECK (load_status IN ('NOT_LOADED', 'LOADED')),
    ADD COLUMN load_result jsonb;
