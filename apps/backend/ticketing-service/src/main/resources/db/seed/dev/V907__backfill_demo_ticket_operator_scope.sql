-- Tier 3 demo data, dev profile only. Backfill for V003/V903/V904: the operator_id column (INC-021)
-- did not exist when these demo tickets were seeded, so they carry no operator scope and would be
-- invisible to every operator's ticket-sales listing despite being real sales on their buses.
--
-- The mapping is core-service's fixed bus-to-operator registry (docs/dev-seed-contract.md) - the
-- same fixed UUIDs core-service's own demo seed assigns, not new ones. Every ticket already
-- carries bus_id, so this is a plain lookup, not a guess.
UPDATE tickets SET operator_id = mapping.operator_id FROM (VALUES
    ('00000000-0000-0000-0000-000000010301', '00000000-0000-0000-0000-000000010501'),
    ('00000000-0000-0000-0000-000000010302', '00000000-0000-0000-0000-000000010501'),
    ('00000000-0000-0000-0000-000000010303', '00000000-0000-0000-0000-000000010502'),
    ('00000000-0000-0000-0000-000000010304', '00000000-0000-0000-0000-000000010502'),
    ('00000000-0000-0000-0000-000000010305', '00000000-0000-0000-0000-000000010503'),
    ('00000000-0000-0000-0000-000000010306', '00000000-0000-0000-0000-000000010503')
) AS mapping(bus_id, operator_id)
WHERE tickets.bus_id = mapping.bus_id AND tickets.operator_id IS NULL;
