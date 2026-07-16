-- Tier 3 demo data, dev profile only — see R__900_demo_users.sql for the scenario.
-- profile_data keys follow ProfileSchemaValidator's REQUIRED_FIELDS exactly (operator:
-- organization_name/registration_id/operator_type/region, conductor:
-- employee_id/assign_operator_id/nic_number, timekeeper: assign_stand/nic, mot: employee_id) so
-- these rows look like what AuthService's real admin-create flow would have produced. Admin and
-- passenger accounts have no required fields (not in that map), so they get an empty object,
-- matching AuthService's own default of `new HashMap<>()`.
INSERT INTO user_profiles (id, user_id, profile_data)
VALUES
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000401', '{}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000402',
     '{"employee_id": "MOT-EMP-0042"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000403',
     '{"assign_stand": "Colombo Fort Central Bus Stand", "nic": "197512345678"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000101',
     '{"organization_name": "Lanka Suwaseriya Travels (Pvt) Ltd", "registration_id": "PVT-REG-2019-00456", "operator_type": "PRIVATE", "region": "Western Province"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000102',
     '{"organization_name": "Southern Comfort Express (Pvt) Ltd", "registration_id": "PVT-REG-2020-00891", "operator_type": "PRIVATE", "region": "Southern Province"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000103',
     '{"organization_name": "Sri Lanka Transport Board - Central Province", "registration_id": "SLTB-CP-REG-1979-001", "operator_type": "CTB", "region": "Central Province"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000301',
     '{"employee_id": "EMP-CND-1001", "nic_number": "199045612345", "assign_operator_id": "00000000-0000-0000-0000-000000000101"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000302',
     '{"employee_id": "EMP-CND-1002", "nic_number": "199267890123", "assign_operator_id": "00000000-0000-0000-0000-000000000102"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000303',
     '{"employee_id": "EMP-CND-1003", "nic_number": "198834567890", "assign_operator_id": "00000000-0000-0000-0000-000000000103"}'::jsonb),

    (gen_random_uuid(), '00000000-0000-0000-0000-000000000201', '{}'::jsonb),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000202', '{}'::jsonb),
    (gen_random_uuid(), '00000000-0000-0000-0000-000000000203', '{}'::jsonb)
ON CONFLICT (user_id) DO NOTHING;
