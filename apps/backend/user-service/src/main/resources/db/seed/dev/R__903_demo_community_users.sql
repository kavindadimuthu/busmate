-- INC-041/042 demo data, dev profile only — the accounts behind the community contribution programme,
-- so a fresh dev stack can exercise every step of it by logging in. See R__900_demo_users.sql for the
-- rest of the scenario and docs/dev-seed-credentials.md for the login list.
--
-- All four are ordinary passenger accounts (ADR-019): what each may do to the network is recorded in
-- core-service (V909__demo_community.sql), keyed by these exact user_ids. Repeatable and idempotent, like
-- the other R__9xx seeds; it sorts after R__001-003, which the user_types subquery depends on.
INSERT INTO users (user_id, email, full_name, username, phone_number, user_type_id,
                    account_status, is_email_verified, created_by)
VALUES
    ('00000000-0000-0000-0000-000000000204', 'contributor.amara@busmate.test', 'Amara Jayawardena',
     'amara.jayawardena', '+94711234510',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000205', 'contributor.chamara@busmate.test', 'Chamara Herath',
     'chamara.herath', '+94711234511',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000206', 'steward.tharindu@busmate.test', 'Tharindu Ekanayake',
     'tharindu.ekanayake', '+94711234512',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL),

    ('00000000-0000-0000-0000-000000000207', 'applicant.nadeesha@busmate.test', 'Nadeesha Rajapaksa',
     'nadeesha.rajapaksa', '+94711234513',
     (SELECT id FROM user_types WHERE name = 'passenger'), 'active', true, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO auth_credentials (user_id, password_hash, failed_attempts, password_updated_at)
VALUES
    -- contributor.amara@busmate.test / Contributor1@2026
    ('00000000-0000-0000-0000-000000000204',
     '{bcrypt}$2b$10$2u0NUiIASvm9nGLjd7arDeNqo/HRKuEwNcK8P3m5tL11.Qk3zf0JG', 0, now()),
    -- contributor.chamara@busmate.test / Contributor2@2026
    ('00000000-0000-0000-0000-000000000205',
     '{bcrypt}$2b$10$96frtii3MXY/LbiZNBOiD./qZSye962gg8ZwoUqLc6A1sWa3xElZq', 0, now()),
    -- steward.tharindu@busmate.test / Steward1@2026
    ('00000000-0000-0000-0000-000000000206',
     '{bcrypt}$2b$10$PjY9t.Ry2SH69nbiDcFmCOYVWsXSZ2z32TGfxvbA/G8hfhZThaXl.', 0, now()),
    -- applicant.nadeesha@busmate.test / Applicant1@2026
    ('00000000-0000-0000-0000-000000000207',
     '{bcrypt}$2b$10$LN8ul33BktOAmACPxy6/QuSFszJzOSupkeUchwwhuxHhlSTT8OMIq', 0, now())
ON CONFLICT DO NOTHING;

INSERT INTO user_profiles (id, user_id, profile_data)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000204', '{}'::jsonb),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000205', '{}'::jsonb),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000206', '{}'::jsonb),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000207', '{}'::jsonb)
ON CONFLICT DO NOTHING;
