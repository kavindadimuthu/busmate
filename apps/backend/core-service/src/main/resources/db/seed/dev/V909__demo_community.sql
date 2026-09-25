-- INC-041/042 demo data, dev profile only — where the four accounts in user-service's
-- R__903_demo_community_users.sql stand in the contributor programme (ADR-019, ADR-022), plus two
-- pending proposals so a steward has something to review the first time they sign in.
--
--   ...204  Amara Jayawardena     active contributor, knows Colombo–Kandy   (has a pending proposal)
--   ...205  Chamara Herath        active contributor, knows Colombo–Galle   (has a pending proposal)
--   ...206  Tharindu Ekanayake    steward for Colombo–Kandy only
--   ...207  Nadeesha Rajapaksa    applied, waiting for MOT to accept
--
-- Amara's proposal falls inside Tharindu's corridor and Chamara's does not, so signing in as the
-- steward shows one proposal and MOT sees both. Both are new-stop proposals: a CREATE is placed by its
-- proposer's declared corridors (ADR-022), which is what makes that split visible.
--
-- agreement_version matches application.yml's community.agreement.version: standing fails closed on an
-- older one, so if that version changes these rows need re-accepting like any contributor's. Route
-- group UUIDs are the shared ones from V902; user UUIDs are user-service's (docs/dev-seed-contract.md).
-- Idempotent via ON CONFLICT DO NOTHING.
INSERT INTO contributor (user_id, status, level, motivation, home_district, affiliation,
                         agreement_version, agreement_accepted_at, applied_at, decided_by, decided_at,
                         steward_appointed_by, steward_appointed_at)
VALUES
    ('00000000-0000-0000-0000-000000000204', 'ACTIVE', 'CONTRIBUTOR',
     'I commute Colombo to Kandy every week and know every stop on the way.', 'Kandy', 'NONE',
     'draft-1', now() - interval '60 days', now() - interval '60 days',
     '00000000-0000-0000-0000-000000000402', now() - interval '58 days', NULL, NULL),

    ('00000000-0000-0000-0000-000000000205', 'ACTIVE', 'CONTRIBUTOR',
     'I grew up in Galle and ride the expressway bus most weekends.', 'Galle', 'NONE',
     'draft-1', now() - interval '45 days', now() - interval '45 days',
     '00000000-0000-0000-0000-000000000402', now() - interval '44 days', NULL, NULL),

    ('00000000-0000-0000-0000-000000000206', 'ACTIVE', 'STEWARD',
     'A retired conductor on the Colombo–Kandy road; happy to check other people''s corrections.', 'Kegalle', 'NONE',
     'draft-1', now() - interval '120 days', now() - interval '120 days',
     '00000000-0000-0000-0000-000000000402', now() - interval '118 days',
     '00000000-0000-0000-0000-000000000402', now() - interval '30 days'),

    ('00000000-0000-0000-0000-000000000207', 'APPLIED', 'CONTRIBUTOR',
     'I photograph bus timetables at stops around Negombo and would like to add them properly.', 'Negombo', 'NONE',
     'draft-1', now() - interval '2 days', now() - interval '2 days',
     NULL, NULL, NULL, NULL)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO contributor_corridor (user_id, route_group_id)
VALUES
    ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000010601'),
    ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000010602'),
    ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000010601'),
    ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000010603')
ON CONFLICT DO NOTHING;

INSERT INTO contributor_steward_scope (user_id, route_group_id)
VALUES ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000010601')
ON CONFLICT DO NOTHING;

INSERT INTO changeset (id, entity_type, target_id, action, proposed_values, observed_on, observation_method,
                       note, status, proposer_user_id, created_at)
VALUES
    ('00000000-0000-0000-0000-000000012001', 'STOP', NULL, 'CREATE',
     '{"name": "Peradeniya Road Junction", "description": "Stop at the Peradeniya Road turn-off, just before Kandy.",
       "isAccessible": false, "location": {"latitude": 7.2731, "longitude": 80.5947, "city": "Kandy", "country": "Sri Lanka"}}'::jsonb,
     current_date - 3, 'RODE_THE_ROUTE',
     'Buses on the Colombo–Kandy road stop here; it is not on the map yet.', 'PENDING',
     '00000000-0000-0000-0000-000000000204', now() - interval '3 days'),

    ('00000000-0000-0000-0000-000000012002', 'STOP', NULL, 'CREATE',
     '{"name": "Moratuwa Flyover Stop", "description": "Stop under the Moratuwa flyover, southbound.",
       "isAccessible": false, "location": {"latitude": 6.7871, "longitude": 79.8828, "city": "Moratuwa", "country": "Sri Lanka"}}'::jsonb,
     current_date - 2, 'LIVES_OR_WORKS_NEARBY',
     'I live nearby; southbound buses pick up here every day.', 'PENDING',
     '00000000-0000-0000-0000-000000000205', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;
