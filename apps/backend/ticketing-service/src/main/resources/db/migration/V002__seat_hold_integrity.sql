-- INC-012: exactly one live ticket may hold a given seat on a given trip. This is the actual
-- guarantee against a double booking - the application-level check in PaymentServiceIMPL exists
-- for a clear error message, not as the source of truth, because only the database can settle a
-- genuine race between two simultaneous requests.
--
-- Freeing a seat - by cancellation or by INC-012's hold-expiry sweep - always sets
-- Tickets.status = CANCELLED, the same state a genuine cancellation already used, so this index
-- needs no separate notion of "expired". NULL seat_number is excluded: a conductor cash sale with
-- no seat assignment must not collide with every other such sale.
ALTER TABLE public.tickets
    ADD COLUMN hold_expires_at timestamp without time zone;

CREATE UNIQUE INDEX tickets_trip_seat_active_uq
    ON public.tickets (trip_id, seat_number)
    WHERE status <> 'CANCELLED' AND seat_number IS NOT NULL;
