-- Tier 3 demo data, dev profile only. Forward-fix for V903/V904: both seeded Tickets.seatNumber
-- in airline-style row+letter labels ("12A", "5B", ...), but SeatLayoutFactory.defaultLayout
-- (core-service) documents and generates plain string-integer seat ids ("1".."N") as the actual
-- contract - "the same scheme the ticketing-service stores in Tickets.seatNumber, so the app can
-- match a booking to a seat directly" (core-service SeatLayoutFactory javadoc). The conductor
-- app's getSeatBookings() builds a seat map keyed "1".."49" and only assigns a ticket to a seat on
-- an exact key match, so every airline-style label silently matched nothing - every trip showed 0
-- passengers/tickets/revenue despite tickets existing.
--
-- V903/V904 are versioned migrations already applied to this database, so per HACO policy
-- (intent/policy.yaml always_human: "editing a migration that has already been applied anywhere")
-- they are left untouched - this renumbers the existing rows forward instead. Numbers are assigned
-- uniquely per trip (each trip's bus has its own 49-seat layout), in ticket_id order.
UPDATE tickets SET seat_number = new_seat FROM (VALUES
    -- Trip 00000000-...-010407 (7 tickets)
    (1, '1'), (2, '2'), (19, '3'), (20, '4'), (21, '5'), (22, '6'), (23, '7'),
    -- Trip 00000000-...-010408 (2 tickets)
    (3, '1'), (4, '2'),
    -- Trip 00000000-...-010409 (2 tickets)
    (5, '1'), (6, '2'),
    -- Trip 00000000-...-011201 (5 tickets)
    (7, '1'), (8, '2'), (9, '3'), (10, '4'), (11, '5'),
    -- Trip 00000000-...-011202 (3 tickets)
    (12, '1'), (13, '2'), (14, '3'),
    -- Trip 00000000-...-011203 (4 tickets)
    (15, '1'), (16, '2'), (17, '3'), (18, '4')
) AS fix(ticket_id, new_seat)
WHERE tickets.ticket_id = fix.ticket_id;
