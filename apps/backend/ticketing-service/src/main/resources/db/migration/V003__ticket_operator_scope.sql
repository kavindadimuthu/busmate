-- INC-021: every ticket records which operator sold it, at the moment of sale.
--
-- Previously the operator ticket-sales listing filtered by the bus ids the *frontend* sent, which
-- is not a security boundary (any caller could send any ids, or none, and see every ticket) and
-- is also historically wrong if a bus is ever sold to another operator. Recording the operator at
-- sale time fixes both: the server derives the scope itself, and it never changes retroactively.
--
-- Nullable: existing demo tickets predate this column. A backfill from bus_id would need a call
-- to core-service's bus registry, which a schema migration cannot make; see the dev seed for a
-- same-day backfill of the demo data instead.
ALTER TABLE public.tickets
    ADD COLUMN operator_id character varying(64);

CREATE INDEX tickets_operator_id_idx ON public.tickets (operator_id);
