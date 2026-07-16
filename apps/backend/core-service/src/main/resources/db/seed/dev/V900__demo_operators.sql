-- Tier 3 demo data (docs/plans/Database-Migrations-and-Seed-Data-Plan.md §3, §5) — dev profile
-- only (see application-dev.yml's flyway.locations). Three Sri Lankan bus operators, linked to
-- user-service's dev seed via user_id: the same fixed UUID as that operator's users.user_id row
-- (V900__demo_users.sql in user-service), reproducing the real operator_sync_outbox -> Kafka link
-- between the two services without needing Kafka running in dev. operator.id itself is a
-- *separate* UUID from user_id — InternalOperatorServiceImpl.createOrGetOperator always assigns
-- Operator.id a fresh UUID.randomUUID(), never the linked userId, so this seed mirrors that
-- rather than conflating the two. Both UUIDs are the fixed ones registered in
-- docs/dev-seed-contract.md.
--
-- Idempotent via ON CONFLICT (id) DO NOTHING (per the plan's Tier 3 guidance) — safe to re-run.
INSERT INTO operator (id, operator_type, name, region, status, user_id, created_by)
VALUES
    ('00000000-0000-0000-0000-000000010501', 'PRIVATE', 'Lanka Suwaseriya Travels (Pvt) Ltd',
     'Western Province', 'active', '00000000-0000-0000-0000-000000000101', 'db-seed'),

    ('00000000-0000-0000-0000-000000010502', 'PRIVATE', 'Southern Comfort Express (Pvt) Ltd',
     'Southern Province', 'active', '00000000-0000-0000-0000-000000000102', 'db-seed'),

    ('00000000-0000-0000-0000-000000010503', 'CTB', 'Sri Lanka Transport Board - Central Province',
     'Central Province', 'active', '00000000-0000-0000-0000-000000000103', 'db-seed')
ON CONFLICT (id) DO NOTHING;
