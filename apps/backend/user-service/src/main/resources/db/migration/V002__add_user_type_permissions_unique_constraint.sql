-- Adds the natural-key unique constraint that db/reference's R__003_user_type_permissions.sql
-- needs as an ON CONFLICT target — the entity (UserTypePermission) only declares a surrogate
-- id primary key, so this was never enforced at the DB level. Dedupe defensively first: if any
-- (user_type_id, permission_id) pair was ever inserted twice before this constraint existed,
-- keep the earliest row and drop the rest, so the ADD CONSTRAINT below can't fail on real data.
DELETE FROM user_type_permissions utp
USING user_type_permissions dupe
WHERE utp.user_type_id = dupe.user_type_id
  AND utp.permission_id = dupe.permission_id
  AND utp.id > dupe.id;

ALTER TABLE user_type_permissions
    ADD CONSTRAINT uq_user_type_permissions_type_permission UNIQUE (user_type_id, permission_id);
