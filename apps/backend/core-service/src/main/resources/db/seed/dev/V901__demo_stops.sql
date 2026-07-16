-- Tier 3 demo data, dev profile only — see V900__demo_operators.sql for the scenario. Nine real
-- Sri Lankan bus stops covering the three demo lines (Colombo-Kandy, Colombo-Galle,
-- Colombo-Negombo), shared as a common origin (Colombo Fort) fanning out to three destinations.
-- Coordinates are the real-world locations. UUIDs from docs/dev-seed-contract.md.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO stop (id, name, name_sinhala, name_tamil, description, latitude, longitude, address,
                   city, state, country, is_accessible, created_by)
VALUES
    ('00000000-0000-0000-0000-000000010201', 'Colombo Fort (Central Bus Stand)',
     'කොළඹ බස් නැවතුම්පොළ', 'கொழும்பு பேருந்து நிலையம்',
     'Main departure point for long-distance and expressway services out of Colombo.',
     6.9355, 79.8487, 'Olcott Mawatha', 'Colombo', 'Western Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010202', 'Kadawatha', 'කඩවත', 'கடவத',
     'Junction stop on the Colombo-Kandy road, at the start of the Kandy expressway link.',
     7.0008, 79.9511, 'Kandy Road', 'Kadawatha', 'Western Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010203', 'Kegalle', 'කෑගල්ල', 'கேகல்லை',
     'Midway stop on the Colombo-Kandy route.',
     7.2513, 80.3464, 'Kandy Road', 'Kegalle', 'Sabaragamuwa Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010204', 'Kandy (Goods Shed Bus Stand)', 'මහනුවර', 'கண்டி',
     'Kandy''s main bus terminal, adjacent to the railway goods shed.',
     7.2931, 80.6350, 'Goods Shed Road', 'Kandy', 'Central Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010205', 'Kalutara', 'කළුතර', 'களுத்துறை',
     'Coastal stop on the Colombo-Galle expressway corridor.',
     6.5854, 79.9607, 'Galle Road', 'Kalutara', 'Western Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010206', 'Ambalangoda', 'අම්බලන්ගොඩ', 'அம்பலாங்கொடை',
     'Coastal town stop between Kalutara and Galle.',
     6.2354, 80.0540, 'Galle Road', 'Ambalangoda', 'Southern Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010207', 'Galle (Bus Stand)', 'ගාල්ල', 'காலி',
     'Galle''s main bus terminal, near the Southern Expressway terminus.',
     6.0329, 80.2168, 'Matara Road', 'Galle', 'Southern Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010208', 'Wattala', 'වත්තල', 'வத்தளை',
     'Suburban stop on the Colombo-Negombo coastal road.',
     6.9894, 79.8917, 'Negombo Road', 'Wattala', 'Western Province', 'Sri Lanka', true, 'db-seed'),

    ('00000000-0000-0000-0000-000000010209', 'Negombo (Bus Stand)', 'මීගමුව', 'நீர்கொழும்பு',
     'Negombo''s main bus terminal, near the fish market and lagoon.',
     7.2086, 79.8358, 'Custom House Road', 'Negombo', 'Western Province', 'Sri Lanka', true, 'db-seed')
ON CONFLICT (id) DO NOTHING;
