-- The demo-data migrations (V900-V905: demo fares/transactions/tickets/"saman kumara full
-- scenario") seeded rows with explicit primary keys, which left the IDENTITY sequences backing
-- transactions/tickets/cash_payments/online behind the actual max row id in each table. New
-- inserts collide with those seeded rows ("duplicate key value violates unique constraint
-- transactions_pkey") - surfaced by INC-008's conductor card-payment flow, but not caused by
-- it: any new CASH ticket hits the same wall. Must run after V900-905, since they're what
-- caused the drift this corrects - hence V906, not a low number.
--
-- Resolves each column's real identity sequence via pg_get_serial_sequence (never guesses a
-- name) and advances it to the current max id - GREATEST so this can never move a sequence
-- backwards, making it safe to re-run.
DO $$
DECLARE
    tbl text; col text; seqname text; target bigint;
    pairs text[][] := ARRAY[
        ARRAY['transactions', 'transaction_id'],
        ARRAY['tickets', 'ticket_id'],
        ARRAY['cash_payments', 'payment_id'],
        ARRAY['online', 'payment_id']
    ];
    pair text[];
BEGIN
    FOREACH pair SLICE 1 IN ARRAY pairs LOOP
        tbl := pair[1];
        col := pair[2];
        seqname := pg_get_serial_sequence(tbl, col);
        IF seqname IS NULL THEN
            RAISE EXCEPTION 'No identity sequence found for %.%', tbl, col;
        END IF;

        EXECUTE format(
            'SELECT GREATEST((SELECT COALESCE(MAX(%I), 0) FROM %I), (SELECT last_value FROM %s))',
            col, tbl, seqname
        ) INTO target;

        PERFORM setval(seqname, target);
    END LOOP;
END $$;
