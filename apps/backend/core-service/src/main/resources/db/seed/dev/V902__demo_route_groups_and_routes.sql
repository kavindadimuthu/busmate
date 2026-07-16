-- Tier 3 demo data, dev profile only — see V900__demo_operators.sql for the scenario. Three
-- route groups (one per operator/permit), each with an outbound and inbound Route — this schema
-- models direction as separate Route rows sharing a route_group, not a single bidirectional row.
--
-- Route group UUIDs (00000000-0000-0000-0000-000000010601/02/03) are core-service-local only —
-- no other service references a route_group directly, so per docs/dev-seed-contract.md's own
-- rule they don't need a shared registry entry. Route UUIDs are the shared ones from that
-- registry (ticketing-service's dev seed references them via RouteFare.routeId as text).
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO route_group (id, name, name_sinhala, name_tamil, description)
VALUES
    ('00000000-0000-0000-0000-000000010601', 'Colombo - Kandy',
     'කොළඹ - මහනුවර', 'கொழும்பு - கண்டி',
     'Western/Central province trunk route serviced by Lanka Suwaseriya Travels.'),

    ('00000000-0000-0000-0000-000000010602', 'Colombo - Galle',
     'කොළඹ - ගාල්ල', 'கொழும்பு - காலி',
     'Southern Expressway route serviced by Southern Comfort Express.'),

    ('00000000-0000-0000-0000-000000010603', 'Colombo - Negombo',
     'කොළඹ - මීගමුව', 'கொழும்பு - நீர்கொழும்பு',
     'Western province coastal route serviced by SLTB - Central Province.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO route (id, name, name_sinhala, name_tamil, route_number, description, road_type,
                    route_through, route_group_id, start_stop_id, end_stop_id, distance_km,
                    estimated_duration_minutes, direction, created_by)
VALUES
    ('00000000-0000-0000-0000-000000010101', 'Colombo Fort to Kandy',
     'කොළඹ සිට මහනුවර', 'கொழும்பு முதல் கண்டி வரை', '01',
     'Daily semi-luxury service via Kadawatha and Kegalle.', 'NORMALWAY',
     'Kadawatha, Kegalle', '00000000-0000-0000-0000-000000010601',
     '00000000-0000-0000-0000-000000010201', '00000000-0000-0000-0000-000000010204',
     115.0, 225, 'OUTBOUND', 'db-seed'),

    ('00000000-0000-0000-0000-000000010102', 'Kandy to Colombo Fort',
     'මහනුවර සිට කොළඹ', 'கண்டி முதல் கொழும்பு வரை', '01',
     'Return working of the Colombo-Kandy service.', 'NORMALWAY',
     'Kegalle, Kadawatha', '00000000-0000-0000-0000-000000010601',
     '00000000-0000-0000-0000-000000010204', '00000000-0000-0000-0000-000000010201',
     115.0, 225, 'INBOUND', 'db-seed'),

    ('00000000-0000-0000-0000-000000010103', 'Colombo Fort to Galle',
     'කොළඹ සිට ගාල්ල', 'கொழும்பு முதல் காலி வரை', '02',
     'Luxury service via the Southern Expressway (E01).', 'EXPRESSWAY',
     'Kalutara, Ambalangoda', '00000000-0000-0000-0000-000000010602',
     '00000000-0000-0000-0000-000000010201', '00000000-0000-0000-0000-000000010207',
     119.0, 105, 'OUTBOUND', 'db-seed'),

    ('00000000-0000-0000-0000-000000010104', 'Galle to Colombo Fort',
     'ගාල්ල සිට කොළඹ', 'காலி முதல் கொழும்பு வரை', '02',
     'Return working of the Colombo-Galle expressway service.', 'EXPRESSWAY',
     'Ambalangoda, Kalutara', '00000000-0000-0000-0000-000000010602',
     '00000000-0000-0000-0000-000000010207', '00000000-0000-0000-0000-000000010201',
     119.0, 105, 'INBOUND', 'db-seed'),

    ('00000000-0000-0000-0000-000000010105', 'Colombo Fort to Negombo',
     'කොළඹ සිට මීගමුව', 'கொழும்பு முதல் நீர்கொழும்பு வரை', '03',
     'Normal-fare CTB service via Wattala.', 'NORMALWAY',
     'Wattala', '00000000-0000-0000-0000-000000010603',
     '00000000-0000-0000-0000-000000010201', '00000000-0000-0000-0000-000000010209',
     37.0, 75, 'OUTBOUND', 'db-seed'),

    ('00000000-0000-0000-0000-000000010106', 'Negombo to Colombo Fort',
     'මීගමුව සිට කොළඹ', 'நீர்கொழும்பு முதல் கொழும்பு வரை', '03',
     'Return working of the Colombo-Negombo service.', 'NORMALWAY',
     'Wattala', '00000000-0000-0000-0000-000000010603',
     '00000000-0000-0000-0000-000000010209', '00000000-0000-0000-0000-000000010201',
     37.0, 75, 'INBOUND', 'db-seed')
ON CONFLICT (id) DO NOTHING;
