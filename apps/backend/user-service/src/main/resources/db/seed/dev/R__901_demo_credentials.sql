-- Tier 3 demo data, dev profile only — see R__900_demo_users.sql for the scenario.
-- Password hashes are real bcrypt (10 rounds, same BCryptPasswordEncoder used by
-- PasswordConfig/CredentialService), not placeholders — every account below logs in for real
-- with the password shown against it. See docs/dev-seed-credentials.md for the full login list.
--
-- Password convention: {Role}{N}@2026, matching the pre-Flyway
-- scripts/seed-operator-conductor-profiles.sh convention this migration supersedes.
--
-- failed_attempts has no DB-level DEFAULT — only a Java-side @Builder.Default — so a raw SQL
-- insert must supply 0 explicitly or hit its NOT NULL constraint.
INSERT INTO auth_credentials (user_id, password_hash, failed_attempts, password_updated_at)
VALUES
    -- admin@busmate.test / Admin@2026
    ('00000000-0000-0000-0000-000000000401',
     '{bcrypt}$2b$10$rRpA.ZLH/HxHiHB8GCzZUOFogNN3xyqMyrNa7BBTbmVwQ1i91VYJy', 0, now()),
    -- mot@busmate.test / Mot@2026
    ('00000000-0000-0000-0000-000000000402',
     '{bcrypt}$2b$10$akALYM4MQhkr8iazsae8luGztnYKWFUo7WmPVvTRxXdSj8ICDUnz6', 0, now()),
    -- timekeeper@busmate.test / Timekeeper@2026
    ('00000000-0000-0000-0000-000000000403',
     '{bcrypt}$2b$10$Ew1iXBhZC90ztj6EEdu3h.1b/E/.Td6bpdUJj/Gt42PnYjrVRC1Fe', 0, now()),
    -- operator.suwaseriya@busmate.test / Operator1@2026
    ('00000000-0000-0000-0000-000000000101',
     '{bcrypt}$2b$10$UqoffuOrS6gcUfxEPB.riewSVE5HOXePa6ZG.AK27i8l8hcheFZke', 0, now()),
    -- operator.southerncomfort@busmate.test / Operator2@2026
    ('00000000-0000-0000-0000-000000000102',
     '{bcrypt}$2b$10$PbxxRY766CxMWLf7BrGLW.TWT1eMZkGAtl55oDmXVXS5840D.fVEC', 0, now()),
    -- operator.sltbcentral@busmate.test / Operator3@2026
    ('00000000-0000-0000-0000-000000000103',
     '{bcrypt}$2b$10$yF/JbWHeVe7C.3KYkb5EKe7yT5vX6JNMNjF9Ypa0XFn2dsesmNM.G', 0, now()),
    -- conductor.saman@busmate.test / Conductor1@2026
    ('00000000-0000-0000-0000-000000000301',
     '{bcrypt}$2b$10$znAaEKzoZSyjUJ2UNJopCO6mrvJsbC/ggng4MqTGhiubU9ZjNYqy.', 0, now()),
    -- conductor.nirosha@busmate.test / Conductor2@2026
    ('00000000-0000-0000-0000-000000000302',
     '{bcrypt}$2b$10$7910./Os5Os1xJCdytrOOeyobWE5Feihhw5ytTmHpPoKEvrWSkOHW', 0, now()),
    -- conductor.ranjith@busmate.test / Conductor3@2026
    ('00000000-0000-0000-0000-000000000303',
     '{bcrypt}$2b$10$6C5WqsKyhtAu98xynogOgee23mjqKJnKDdEsKS/p.Ca591uu0ayE.', 0, now()),
    -- passenger.dilani@busmate.test / Passenger1@2026
    ('00000000-0000-0000-0000-000000000201',
     '{bcrypt}$2b$10$cM9cs5DZEssL9Dpt8T6qOe289DDKtMUvqJ3OH/NXxqEzp5nfHsHKC', 0, now()),
    -- passenger.kasun@busmate.test / Passenger2@2026
    ('00000000-0000-0000-0000-000000000202',
     '{bcrypt}$2b$10$t76g9tQELkMUyWhjrgKQWuqk8dN3G.oe94oxFev/gxAELttkM5dE2', 0, now()),
    -- passenger.ishara@busmate.test / Passenger3@2026
    ('00000000-0000-0000-0000-000000000203',
     '{bcrypt}$2b$10$4CpCb4/kYr3X11DrdqnVY.xruXf4PY/xpvZBgqhxQ.H8TEfAjIfkK', 0, now())
ON CONFLICT (user_id) DO NOTHING;
