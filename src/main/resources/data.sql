-- ============================================================================
-- BusMate Route Management Service - Development Seed Data
-- Sri Lankan Bus Transport System Data
-- ============================================================================

-- Disable foreign key checks for data insertion
SET session_replication_role = replica;

-- ============================================================================
-- 1. OPERATORS DATA
-- ============================================================================

-- Government and Semi-Government Operators
INSERT INTO operator (id, operator_type, name, region, status, created_at, updated_at, created_by, updated_by) VALUES
('11111111-1111-1111-1111-111111111111', 'CTB', 'Sri Lanka Transport Board - Western Province', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('11111111-1111-1111-1111-111111111112', 'CTB', 'Sri Lanka Transport Board - Central Province', 'Central Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('11111111-1111-1111-1111-111111111113', 'CTB', 'Sri Lanka Transport Board - Southern Province', 'Southern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('11111111-1111-1111-1111-111111111114', 'CTB', 'Sri Lanka Transport Board - Northern Province', 'Northern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Private Operators
INSERT INTO operator (id, operator_type, name, region, status, created_at, updated_at, created_by, updated_by) VALUES
('22222222-2222-2222-2222-222222222221', 'PRIVATE', 'Swarnayya Transport Company', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222222', 'PRIVATE', 'Royal Express Transport', 'Central Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222223', 'PRIVATE', 'Golden Arrow Bus Service', 'Southern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222224', 'PRIVATE', 'Highway Express Pvt Ltd', 'All Island', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222225', 'PRIVATE', 'Supro Express Transport', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222226', 'PRIVATE', 'Capital Transport Solutions', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 2. BUS STOPS DATA
-- ============================================================================

-- Major Bus Stops in Colombo and suburbs
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('33333333-3333-3333-3333-333333333331', 'Fort Railway Station', 'Main transport hub in Colombo Fort', 6.9344, 79.8428, 'Station Road', 'Colombo', 'Western Province', '00100', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333332', 'Pettah Central Bus Stand', 'Main intercity bus terminal', 6.9367, 79.8486, 'Olcott Mawatha', 'Colombo', 'Western Province', '00110', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333333', 'Maharagama Bus Stand', 'Major suburban bus terminal', 6.8475, 79.9269, 'High Level Road', 'Maharagama', 'Western Province', '10280', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333334', 'Nugegoda Bus Stand', 'Suburban transport hub', 6.8699, 79.8959, 'High Level Road', 'Nugegoda', 'Western Province', '10250', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333335', 'Kelaniya Bus Stand', 'Temple city transport hub', 6.9553, 79.9219, 'Colombo Road', 'Kelaniya', 'Western Province', '11600', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333336', 'Gampaha Bus Stand', 'District transport center', 7.0873, 79.9990, 'Colombo Road', 'Gampaha', 'Western Province', '11000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333337', 'Kadawatha Bus Stand', 'Suburban junction', 6.9928, 79.9578, 'Kandy Road', 'Kadawatha', 'Western Province', '11850', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333338', 'Ragama Bus Stand', 'Railway town transport hub', 7.0275, 79.9178, 'Station Road', 'Ragama', 'Western Province', '11010', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Major intercity destinations
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('44444444-4444-4444-4444-444444444441', 'Kandy Central Bus Stand', 'Hill capital main terminal', 7.2906, 80.6337, 'Goods Shed Street', 'Kandy', 'Central Province', '20000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444442', 'Galle Bus Terminal', 'Southern province main hub', 6.0535, 80.2210, 'Main Street', 'Galle', 'Southern Province', '80000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444443', 'Matara Bus Stand', 'Southern coastal terminal', 5.9549, 80.5550, 'Anagarika Dharmapala Mawatha', 'Matara', 'Southern Province', '81000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444444', 'Kurunegala Bus Stand', 'Northwestern province hub', 7.4867, 80.3647, 'Colombo Road', 'Kurunegala', 'North Western Province', '60000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444445', 'Anuradhapura Bus Stand', 'Ancient city transport hub', 8.3114, 80.4037, 'Harischandra Mawatha', 'Anuradhapura', 'North Central Province', '50000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444446', 'Ratnapura Bus Stand', 'Gem city terminal', 6.6828, 80.3992, 'Main Street', 'Ratnapura', 'Sabaragamuwa Province', '70000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444447', 'Negombo Bus Stand', 'Coastal city terminal', 7.2083, 79.8358, 'Main Street', 'Negombo', 'Western Province', '11500', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444448', 'Kegalle Bus Stand', 'Hill country junction', 7.2513, 80.3464, 'Kandy Road', 'Kegalle', 'Sabaragamuwa Province', '71000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Additional stops for route construction
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('55555555-5555-5555-5555-555555555551', 'Peradeniya Junction', 'University town junction', 7.2599, 80.5977, 'Kandy Road', 'Peradeniya', 'Central Province', '20400', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555552', 'Kottawa Junction', 'Highway interchange', 6.8185, 79.9733, 'Southern Expressway', 'Kottawa', 'Western Province', '10230', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555553', 'Panadura Bus Stand', 'Coastal town terminal', 6.7132, 79.9026, 'Galle Road', 'Panadura', 'Western Province', '12500', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555554', 'Kalutara Bus Stand', 'Southern gateway', 6.5854, 79.9607, 'Galle Road', 'Kalutara', 'Western Province', '12000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555555', 'Horana Bus Stand', 'Inland southern junction', 6.7155, 80.0634, 'Panadura Road', 'Horana', 'Western Province', '12400', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 3. ROUTE GROUPS
-- ============================================================================

INSERT INTO route_group (id, name, description, created_at, updated_at, created_by, updated_by) VALUES
('66666666-6666-6666-6666-666666666661', 'Colombo - Kandy Route Group', 'Main route connecting capital to hill capital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666662', 'Colombo - Galle Route Group', 'Southern coastal highway route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666663', 'Colombo - Kurunegala Route Group', 'Northwestern province connection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666664', 'Colombo - Negombo Route Group', 'Airport and coastal route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666665', 'Colombo Suburban Routes', 'Local suburban connectivity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 4. ROUTES
-- ============================================================================

-- Colombo to Kandy Routes
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777771', 'Colombo Fort - Kandy', 'Main route via Kadugannawa', '66666666-6666-6666-6666-666666666661', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 115.0, 210, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777772', 'Kandy - Colombo Fort', 'Return route via Kadugannawa', '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 115.0, 210, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Colombo to Galle Routes
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777773', 'Pettah - Galle', 'Southern expressway route', '66666666-6666-6666-6666-666666666662', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444442', 119.0, 150, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777774', 'Galle - Pettah', 'Return via Southern expressway', '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 119.0, 150, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Colombo to Kurunegala Routes
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777775', 'Pettah - Kurunegala', 'Northwestern route via Nittambuwa', '66666666-6666-6666-6666-666666666663', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444444', 103.0, 180, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777776', 'Kurunegala - Pettah', 'Return via Nittambuwa', '66666666-6666-6666-6666-666666666663', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333332', 103.0, 180, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Suburban Routes
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777777', 'Fort - Maharagama', 'Suburban route via Nugegoda', '66666666-6666-6666-6666-666666666665', '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 18.5, 45, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777778', 'Maharagama - Fort', 'Return suburban route', '66666666-6666-6666-6666-666666666665', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333331', 18.5, 45, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 5. ROUTE STOPS (For route construction)
-- ============================================================================

-- Colombo Fort to Kandy route stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333331', 1, 0.0),
('88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333337', 2, 15.2),
('88888888-8888-8888-8888-888888888883', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333336', 3, 28.5),
('88888888-8888-8888-8888-888888888884', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444448', 4, 67.3),
('88888888-8888-8888-8888-888888888885', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', 5, 95.2),
('88888888-8888-8888-8888-888888888886', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444441', 6, 115.0);

-- Pettah to Galle route stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-888888888887', '77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333332', 1, 0.0),
('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333334', 2, 8.2),
('88888888-8888-8888-8888-888888888889', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555552', 3, 23.1),
('88888888-8888-8888-8888-88888888888a', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555553', 4, 35.7),
('88888888-8888-8888-8888-88888888888b', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555554', 5, 45.2),
('88888888-8888-8888-8888-88888888888c', '77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444442', 6, 119.0);

-- Fort to Maharagama suburban route stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-88888888888d', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333331', 1, 0.0),
('88888888-8888-8888-8888-88888888888e', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333334', 2, 8.2),
('88888888-8888-8888-8888-88888888888f', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 3, 18.5);

-- ============================================================================
-- 6. BUSES
-- ============================================================================

-- SLTB Buses
INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model, facilities, status, created_at, updated_at, created_by, updated_by) VALUES
('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', 'WP-SLTB-001', 'WP CAA-1234', 52, 'TATA LP 1613', '{"air_conditioning": false, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', 'WP-SLTB-002', 'WP CAB-5678', 49, 'Ashok Leyland Viking', '{"air_conditioning": false, "wheelchair_accessible": false, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999993', '11111111-1111-1111-1111-111111111112', 'CP-SLTB-001', 'CP KA-9876', 52, 'TATA LP 1613', '{"air_conditioning": true, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Private Operator Buses
INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model, facilities, status, created_at, updated_at, created_by, updated_by) VALUES
('99999999-9999-9999-9999-999999999994', '22222222-2222-2222-2222-222222222221', 'WP-PVT-001', 'WP CBB-1111', 45, 'Rosa Deluxe', '{"air_conditioning": true, "wheelchair_accessible": false, "wifi": true, "gps": true, "pushback_seats": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999995', '22222222-2222-2222-2222-222222222222', 'CP-PVT-002', 'CP KB-2222', 41, 'Coaster Luxury', '{"air_conditioning": true, "wheelchair_accessible": false, "wifi": true, "gps": true, "pushback_seats": true, "entertainment": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999996', '22222222-2222-2222-2222-222222222224', 'WP-PVT-003', 'WP CBC-3333', 35, 'Mitsubishi Rosa Super Long', '{"air_conditioning": true, "wheelchair_accessible": true, "wifi": true, "gps": true, "pushback_seats": true, "entertainment": true, "charging_ports": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999997', '22222222-2222-2222-2222-222222222225', 'WP-PVT-004', 'WP CBD-4444', 52, 'TATA LP 1613', '{"air_conditioning": false, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 7. PASSENGER SERVICE PERMITS
-- ============================================================================

INSERT INTO passenger_service_permit (id, operator_id, route_group_id, permit_number, issue_date, expiry_date, maximum_bus_assigned, status, permit_type, created_at, updated_at, created_by, updated_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666665', 'SLTB-WP-2025-001', '2025-01-01', '2025-12-31', 10, 'active', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111112', '66666666-6666-6666-6666-666666666661', 'SLTB-CP-2025-001', '2025-01-01', '2025-12-31', 5, 'active', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '22222222-2222-2222-2222-222222222221', '66666666-6666-6666-6666-666666666665', 'PVT-SW-2025-001', '2025-01-15', '2025-12-31', 3, 'active', 'SEMI_LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 'PVT-RE-2025-001', '2025-02-01', '2026-01-31', 2, 'active', 'LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '22222222-2222-2222-2222-222222222224', '66666666-6666-6666-6666-666666666662', 'PVT-HE-2025-001', '2025-01-01', '2025-12-31', 3, 'active', 'EXTRA_LUXURY_HIGHWAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 8. BUS TO PERMIT ASSIGNMENTS
-- ============================================================================

INSERT INTO bus_passenger_service_permit_assignment (id, bus_id, passenger_service_permit_id, start_date, end_date, request_status, status, created_at, updated_at, created_by, updated_by) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999991', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '99999999-9999-9999-9999-999999999992', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', '99999999-9999-9999-9999-999999999993', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', '99999999-9999-9999-9999-999999999994', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '2025-01-15', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbf', '99999999-9999-9999-9999-999999999995', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '2025-02-01', '2026-01-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccc', '99999999-9999-9999-9999-999999999996', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 9. SCHEDULES
-- ============================================================================

-- Regular schedules for main routes
INSERT INTO schedule (id, route_id, name, description, schedule_type, effective_start_date, effective_end_date, status, created_at, updated_at, created_by, updated_by) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777771', 'Colombo-Kandy Morning Schedule', 'Regular morning services to Kandy', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-cccccccccccd', '77777777-7777-7777-7777-777777777772', 'Kandy-Colombo Evening Schedule', 'Regular evening return services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-ccccccccccce', '77777777-7777-7777-7777-777777777773', 'Pettah-Galle Express Schedule', 'Highway express services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-cccccccccccf', '77777777-7777-7777-7777-777777777777', 'Fort-Maharagama Suburban', 'Frequent suburban services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 10. SCHEDULE CALENDAR (Operating Days)
-- ============================================================================

-- Weekday services for intercity routes
INSERT INTO schedule_calendar (id, schedule_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, true, true, true, true, true, false),
('dddddddd-dddd-dddd-dddd-ddddddddddde', 'cccccccc-cccc-cccc-cccc-cccccccccccd', true, true, true, true, true, true, false),
('dddddddd-dddd-dddd-dddd-dddddddddddf', 'cccccccc-cccc-cccc-cccc-ccccccccccce', true, true, true, true, true, true, true);

-- Daily suburban services
INSERT INTO schedule_calendar (id, schedule_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
('dddddddd-dddd-dddd-dddd-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccf', true, true, true, true, true, true, true);

-- ============================================================================
-- 11. SCHEDULE STOPS (Timing Information)
-- ============================================================================

-- Colombo to Kandy schedule stops with timings
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888881', 1, NULL, '05:30:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888882', 2, '05:55:00', '05:57:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888883', 3, '06:15:00', '06:17:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888884', 4, '07:10:00', '07:12:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888885', 5, '07:45:00', '07:47:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888886', 6, '08:00:00', NULL);

-- Suburban schedule stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef4', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888d', 1, NULL, '06:00:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef5', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888e', 2, '06:20:00', '06:22:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef6', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888f', 3, '06:40:00', NULL);

-- ============================================================================
-- 12. PERMIT TO SCHEDULE ASSIGNMENTS
-- ============================================================================

INSERT INTO passenger_service_permit_schedule_assignment (id, permit_id, schedule_id, start_date, end_date, status, created_at, updated_at, created_by, updated_by) VALUES
('ffffffff-ffff-ffff-ffff-fffffffffffa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-01-01', '2025-12-31', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('ffffffff-ffff-ffff-ffff-fffffffffffb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'cccccccc-cccc-cccc-cccc-cccccccccccd', '2025-02-01', '2026-01-31', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('ffffffff-ffff-ffff-ffff-fffffffffffc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-01-01', '2025-12-31', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('ffffffff-ffff-ffff-ffff-fffffffffffd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-01-01', '2025-12-31', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 13. SAMPLE TRIPS
-- ============================================================================

-- Recent trips for testing
INSERT INTO trip (id, assignment_id, trip_date, scheduled_departure_time, actual_departure_time, scheduled_arrival_time, actual_arrival_time, bus_id, driver_id, conductor_id, status, notes, created_at, updated_at, created_by, updated_by) VALUES
('10101010-1010-1010-1010-101010101010', 'ffffffff-ffff-ffff-ffff-fffffffffffa', '2025-09-20', '05:30:00', '05:32:00', '08:00:00', '08:05:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Normal service, slight delay due to traffic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101011', 'ffffffff-ffff-ffff-ffff-fffffffffffd', '2025-09-20', '06:00:00', '06:00:00', '06:40:00', NULL, '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'in_transit', 'Currently en route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101012', 'ffffffff-ffff-ffff-ffff-fffffffffffc', '2025-09-21', '07:00:00', NULL, '09:30:00', NULL, '99999999-9999-9999-9999-999999999996', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'pending', 'Scheduled for tomorrow', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Enable foreign key checks
SET session_replication_role = DEFAULT;

-- ============================================================================
-- Data insertion completed successfully!
-- ============================================================================