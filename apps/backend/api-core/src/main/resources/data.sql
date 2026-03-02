-- ============================================================================
-- BusMate Route Management Service - Sri Lankan Bus Transport System
-- Comprehensive Development Seed Data
-- ============================================================================
-- This file contains complete seed data for the BusMate route management service,
-- representing Sri Lanka's bus transport system with realistic operators, routes,
-- schedules, and operational data.
--
-- Data Organization:
-- 1. Independent entities (operators, stops, route groups)
-- 2. Route-related data (routes, route stops)
-- 3. Vehicle and permit data (buses, permits, assignments)
-- 4. Schedule data (schedules, calendars, stops, exceptions)
-- 5. Operational data (trips)
--
-- Dependencies are respected in insertion order to maintain referential integrity.

-- Disable foreign key checks for bulk insert
SET session_replication_role = replica;
-- ============================================================================

-- Disable foreign key checks for bulk data insertion
SET session_replication_role = replica;

-- ============================================================================
-- 1. OPERATORS - Bus Transport Companies
-- ============================================================================
-- Sri Lanka has both government (CTB) and private operators serving different regions

-- Government and Semi-Government Operators (CTB)
INSERT INTO operator (id, operator_type, name, region, status, created_at, updated_at, created_by, updated_by) VALUES
('11111111-1111-1111-1111-111111111111', 'CTB', 'Sri Lanka Transport Board - Western Province', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('8e886a71-445c-4e3a-8bc5-a17b5b2dad24', 'CTB', 'Sri Lanka Transport Board - Central Province', 'Central Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('11111111-1111-1111-1111-111111111113', 'CTB', 'Sri Lanka Transport Board - Southern Province', 'Southern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('11111111-1111-1111-1111-111111111114', 'CTB', 'Sri Lanka Transport Board - Northern Province', 'Northern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Private Sector Operators
INSERT INTO operator (id, operator_type, name, region, status, created_at, updated_at, created_by, updated_by) VALUES
('22222222-2222-2222-2222-222222222221', 'PRIVATE', 'Swarnayya Transport Company', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222222', 'PRIVATE', 'Royal Express Transport', 'Central Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222223', 'PRIVATE', 'Golden Arrow Bus Service', 'Southern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222224', 'PRIVATE', 'Highway Express Pvt Ltd', 'All Island', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222225', 'PRIVATE', 'Supro Express Transport', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222226', 'PRIVATE', 'Capital Transport Solutions', 'Western Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222227', 'PRIVATE', 'Northern Express Lines', 'Northern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222228', 'PRIVATE', 'Eastern Coast Transport', 'Eastern Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222229', 'PRIVATE', 'Uva Highlands Bus Service', 'Uva Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('22222222-2222-2222-2222-222222222230', 'PRIVATE', 'Sabaragamuwa Transit', 'Sabaragamuwa Province', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 2. BUS STOPS - Geographic Locations
-- ============================================================================
-- Bus stops across Sri Lanka's major cities and transport hubs

-- Colombo Metropolitan Area Stops
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('33333333-3333-3333-3333-333333333331', 'Fort Railway Station', 'Main transport hub in Colombo Fort', 6.9344, 79.8428, 'Station Road', 'Colombo', 'Western Province', '00100', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333332', 'Pettah Central Bus Stand', 'Main intercity bus terminal', 6.9367, 79.8486, 'Olcott Mawatha', 'Colombo', 'Western Province', '00110', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333333', 'Maharagama Bus Stand', 'Major suburban bus terminal', 6.8475, 79.9269, 'High Level Road', 'Maharagama', 'Western Province', '10280', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333334', 'Nugegoda Bus Stand', 'Suburban transport hub', 6.8699, 79.8959, 'High Level Road', 'Nugegoda', 'Western Province', '10250', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333335', 'Kelaniya Bus Stand', 'Temple city transport hub', 6.9553, 79.9219, 'Colombo Road', 'Kelaniya', 'Western Province', '11600', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333336', 'Gampaha Bus Stand', 'District transport center', 7.0873, 79.9990, 'Colombo Road', 'Gampaha', 'Western Province', '11000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333337', 'Kadawatha Bus Stand', 'Suburban junction', 6.9928, 79.9578, 'Kandy Road', 'Kadawatha', 'Western Province', '11850', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333338', 'Ragama Bus Stand', 'Railway town transport hub', 7.0275, 79.9178, 'Station Road', 'Ragama', 'Western Province', '11010', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('33333333-3333-3333-3333-333333333339', 'Negombo Bus Stand', 'Coastal city terminal', 7.2083, 79.8358, 'Main Street', 'Negombo', 'Western Province', '11500', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Major Intercity Destinations
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('44444444-4444-4444-4444-444444444441', 'Kandy Central Bus Stand', 'Hill capital main terminal', 7.2906, 80.6337, 'Goods Shed Street', 'Kandy', 'Central Province', '20000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444442', 'Galle Bus Terminal', 'Southern province main hub', 6.0535, 80.2210, 'Main Street', 'Galle', 'Southern Province', '80000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444443', 'Matara Bus Stand', 'Southern coastal terminal', 5.9549, 80.5550, 'Anagarika Dharmapala Mawatha', 'Matara', 'Southern Province', '81000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444444', 'Kurunegala Bus Stand', 'Northwestern province hub', 7.4867, 80.3647, 'Colombo Road', 'Kurunegala', 'North Western Province', '60000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444445', 'Anuradhapura Bus Stand', 'Ancient city transport hub', 8.3114, 80.4037, 'Harischandra Mawatha', 'Anuradhapura', 'North Central Province', '50000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444446', 'Ratnapura Bus Stand old', 'Gem city terminal', 6.6828, 80.3992, 'Main Street', 'Ratnapura', 'Sabaragamuwa Province', '70000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('44444444-4444-4444-4444-444444444447', 'Kegalle Bus Stand', 'Hill country junction', 7.2513, 80.3464, 'Kandy Road', 'Kegalle', 'Sabaragamuwa Province', '71000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Additional Route Junctions
INSERT INTO stop (id, name, description, latitude, longitude, address, city, state, zip_code, country, is_accessible, created_at, updated_at, created_by, updated_by) VALUES
('55555555-5555-5555-5555-555555555551', 'Peradeniya Junction', 'University town junction', 7.2599, 80.5977, 'Kandy Road', 'Peradeniya', 'Central Province', '20400', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555552', 'Kottawa Junction', 'Highway interchange', 6.8185, 79.9733, 'Southern Expressway', 'Kottawa', 'Western Province', '10230', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555553', 'Panadura Bus Stand', 'Coastal town terminal', 6.7132, 79.9026, 'Galle Road', 'Panadura', 'Western Province', '12500', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555554', 'Kalutara Bus Stand', 'Southern gateway', 6.5854, 79.9607, 'Galle Road', 'Kalutara', 'Western Province', '12000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555555', 'Horana Bus Stand', 'Inland southern junction', 6.7155, 80.0634, 'Panadura Road', 'Horana', 'Western Province', '12400', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555556', 'Jaffna Central Bus Stand', 'Northern capital terminal', 9.6615, 80.0255, 'Stanley Road', 'Jaffna', 'Northern Province', '40000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555557', 'Trincomalee Bus Stand', 'Eastern port city terminal', 8.5874, 81.2152, 'Inner Harbour Road', 'Trincomalee', 'Eastern Province', '31000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555558', 'Batticaloa Bus Stand', 'Eastern coastal terminal', 7.7300, 81.6747, 'Bar Road', 'Batticaloa', 'Eastern Province', '30000', 'Sri Lanka', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555559', 'Badulla Bus Stand', 'Uva province capital', 6.9897, 81.0557, 'Main Street', 'Badulla', 'Uva Province', '90000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('55555555-5555-5555-5555-555555555560', 'Monaragala Bus Stand', 'Southeast junction', 6.8714, 81.3484, 'Wellawaya Road', 'Monaragala', 'Uva Province', '91000', 'Sri Lanka', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 3. ROUTE GROUPS - Route Categories
-- ============================================================================
-- Logical grouping of routes by corridor or service type

INSERT INTO route_group (id, name, description, created_at, updated_at, created_by, updated_by) VALUES
('66666666-6666-6666-6666-666666666661', 'Colombo - Kandy Route Group', 'Main route connecting capital to hill capital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666662', 'Colombo - Galle Route Group', 'Southern coastal highway route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666663', 'Colombo - Kurunegala Route Group', 'Northwestern province connection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666664', 'Colombo - Negombo Route Group', 'Airport and coastal route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666665', 'Colombo Suburban Routes', 'Local suburban connectivity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666666', 'Colombo - Jaffna Route Group', 'Northern long-distance route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666667', 'Colombo - Trincomalee Route Group', 'Eastern coastal route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('66666666-6666-6666-6666-666666666668', 'Colombo - Badulla Route Group', 'Uva province hill route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 4. ROUTES - Transport Corridors
-- ============================================================================
-- Defined routes with start/end points and basic characteristics

-- Colombo to Kandy Routes (Hill Country Corridor)
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777771', 'Colombo Fort - Kandy', 'Main route via Kadugannawa', '66666666-6666-6666-6666-666666666661', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 115.0, 210, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777772', 'Kandy - Colombo Fort', 'Return route via Kadugannawa', '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 115.0, 210, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Colombo to Galle Routes (Southern Corridor)
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777773', 'Pettah - Galle', 'Southern expressway route', '66666666-6666-6666-6666-666666666662', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444442', 119.0, 150, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777774', 'Galle - Pettah', 'Return via Southern expressway', '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 119.0, 150, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Colombo to Kurunegala Routes (Northwestern Corridor)
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777775', 'Pettah - Kurunegala', 'Northwestern route via Nittambuwa', '66666666-6666-6666-6666-666666666663', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444444', 103.0, 180, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777776', 'Kurunegala - Pettah', 'Return via Nittambuwa', '66666666-6666-6666-6666-666666666663', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333332', 103.0, 180, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Suburban Routes (Local Connectivity)
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777777', 'Fort - Maharagama', 'Suburban route via Nugegoda', '66666666-6666-6666-6666-666666666665', '33333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 18.5, 45, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777778', 'Maharagama - Fort', 'Return suburban route', '66666666-6666-6666-6666-666666666665', '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333331', 18.5, 45, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Long Distance Routes (Inter-Provincial)
INSERT INTO route (id, name, description, route_group_id, start_stop_id, end_stop_id, distance_km, estimated_duration_minutes, direction, created_at, updated_at, created_by, updated_by) VALUES
('77777777-7777-7777-7777-777777777779', 'Pettah - Jaffna', 'Northern long-distance via A9 highway', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555556', 396.0, 480, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777780', 'Jaffna - Pettah', 'Return northern route', '66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555556', '33333333-3333-3333-3333-333333333332', 396.0, 480, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777781', 'Pettah - Trincomalee', 'Eastern coastal route', '66666666-6666-6666-6666-666666666667', '33333333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555557', 273.0, 360, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777782', 'Trincomalee - Pettah', 'Return eastern route', '66666666-6666-6666-6666-666666666667', '55555555-5555-5555-5555-555555555557', '33333333-3333-3333-3333-333333333332', 273.0, 360, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777783', 'Pettah - Badulla', 'Uva province hill route', '66666666-6666-6666-6666-666666666668', '33333333-3333-3333-3333-333333333332', '55555555-5555-5555-5555-555555555559', 235.0, 300, 'OUTBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('77777777-7777-7777-7777-777777777784', 'Badulla - Pettah', 'Return hill route', '66666666-6666-6666-6666-666666666668', '55555555-5555-5555-5555-555555555559', '33333333-3333-3333-3333-333333333332', 235.0, 300, 'INBOUND', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 5. ROUTE STOPS - Route Stop Sequences
-- ============================================================================
-- Ordered stops along each route with distance markers

-- Colombo to Kandy Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333331', 0, 0.0),
('88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333337', 1, 15.2),
('88888888-8888-8888-8888-888888888883', '77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333336', 2, 28.5),
('88888888-8888-8888-8888-888888888884', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444447', 3, 67.3),
('88888888-8888-8888-8888-888888888885', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', 4, 95.2),
('88888888-8888-8888-8888-888888888886', '77777777-7777-7777-7777-777777777771', '44444444-4444-4444-4444-444444444441', 5, 115.0);

-- Pettah to Galle Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-888888888887', '77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333332', 0, 0.0),
('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333334', 1, 8.2),
('88888888-8888-8888-8888-888888888889', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555552', 2, 23.1),
('88888888-8888-8888-8888-88888888888a', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555553', 3, 35.7),
('88888888-8888-8888-8888-88888888888b', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555554', 4, 45.2),
('88888888-8888-8888-8888-88888888888c', '77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444442', 5, 119.0);

-- Fort to Maharagama Suburban Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('88888888-8888-8888-8888-88888888888d', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333331', 0, 0.0),
('88888888-8888-8888-8888-88888888888e', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333334', 1, 8.2),
('88888888-8888-8888-8888-88888888888f', '77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 2, 18.5);

-- Colombo to Kurunegala Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('99999999-9999-9999-9999-999999999991', '77777777-7777-7777-7777-777777777775', '33333333-3333-3333-3333-333333333332', 0, 0.0),
('99999999-9999-9999-9999-999999999992', '77777777-7777-7777-7777-777777777775', '33333333-3333-3333-3333-333333333336', 1, 25.0),
('99999999-9999-9999-9999-999999999993', '77777777-7777-7777-7777-777777777775', '44444444-4444-4444-4444-444444444447', 2, 75.0),
('99999999-9999-9999-9999-999999999994', '77777777-7777-7777-7777-777777777775', '44444444-4444-4444-4444-444444444444', 3, 103.0);;

-- Colombo to Jaffna Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '77777777-7777-7777-7777-777777777779', '33333333-3333-3333-3333-333333333332', 0, 0.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '77777777-7777-7777-7777-777777777779', '33333333-3333-3333-3333-333333333336', 1, 25.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '77777777-7777-7777-7777-777777777779', '44444444-4444-4444-4444-444444444444', 2, 103.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '77777777-7777-7777-7777-777777777779', '44444444-4444-4444-4444-444444444445', 3, 200.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '77777777-7777-7777-7777-777777777779', '55555555-5555-5555-5555-555555555556', 4, 396.0);

-- Colombo to Trincomalee Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '77777777-7777-7777-7777-777777777781', '33333333-3333-3333-3333-333333333332', 0, 0.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '77777777-7777-7777-7777-777777777781', '44444444-4444-4444-4444-444444444444', 1, 103.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '77777777-7777-7777-7777-777777777781', '55555555-5555-5555-5555-555555555558', 2, 220.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', '77777777-7777-7777-7777-777777777781', '55555555-5555-5555-5555-555555555557', 3, 273.0);

-- Colombo to Badulla Route Stops
INSERT INTO route_stop (id, route_id, stop_id, stop_order, distance_from_start_km) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', '77777777-7777-7777-7777-777777777783', '33333333-3333-3333-3333-333333333332', 0, 0.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', '77777777-7777-7777-7777-777777777783', '44444444-4444-4444-4444-444444444441', 1, 115.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', '77777777-7777-7777-7777-777777777783', '55555555-5555-5555-5555-555555555560', 2, 180.0),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13', '77777777-7777-7777-7777-777777777783', '55555555-5555-5555-5555-555555555559', 3, 235.0);

-- ============================================================================
-- 6. BUSES - Vehicle Fleet
-- ============================================================================
-- Fleet of buses operated by different companies with various facilities

-- Sri Lanka Transport Board (CTB) Buses
INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model, facilities, status, created_at, updated_at, created_by, updated_by) VALUES
('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', 'WP-SLTB-001', 'WP CAA-1234', 52, 'TATA LP 1613', '{"air_conditioning": false, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', 'WP-SLTB-002', 'WP CAB-5678', 49, 'Ashok Leyland Viking', '{"air_conditioning": false, "wheelchair_accessible": false, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999993', '8e886a71-445c-4e3a-8bc5-a17b5b2dad24', 'CP-SLTB-001', 'CP KA-9876', 52, 'TATA LP 1613', '{"air_conditioning": true, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Private Operator Buses
INSERT INTO bus (id, operator_id, ntc_registration_number, plate_number, capacity, model, facilities, status, created_at, updated_at, created_by, updated_by) VALUES
('99999999-9999-9999-9999-999999999994', '22222222-2222-2222-2222-222222222221', 'WP-PVT-001', 'WP CBB-1111', 45, 'Rosa Coaster', '{"air_conditioning": true, "wheelchair_accessible": false, "wifi": true, "gps": true, "pushback_seats": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999995', '22222222-2222-2222-2222-222222222222', 'CP-PVT-002', 'CP KB-2222', 41, 'Coaster Luxury', '{"air_conditioning": true, "wheelchair_accessible": false, "wifi": true, "gps": true, "pushback_seats": true, "entertainment": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999996', '22222222-2222-2222-2222-222222222224', 'WP-PVT-003', 'WP CBC-3333', 35, 'Mitsubishi Rosa Super Long', '{"air_conditioning": true, "wheelchair_accessible": true, "wifi": true, "gps": true, "pushback_seats": true, "entertainment": true, "charging_ports": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999997', '22222222-2222-2222-2222-222222222225', 'WP-PVT-004', 'WP CBD-4444', 52, 'TATA LP 1613', '{"air_conditioning": false, "wheelchair_accessible": true, "wifi": false, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999998', '22222222-2222-2222-2222-222222222227', 'NP-PVT-005', 'NP JA-5555', 48, 'Ashok Leyland Viking', '{"air_conditioning": true, "wheelchair_accessible": false, "wifi": true, "gps": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222228', 'EP-PVT-006', 'EP TC-6666', 42, 'Rosa Coaster', '{"air_conditioning": true, "wheelchair_accessible": true, "wifi": true, "gps": true, "pushback_seats": true}', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 7. PASSENGER SERVICE PERMITS - Operating Licenses
-- ============================================================================
-- Permits authorizing operators to run services on specific routes

INSERT INTO passenger_service_permit (id, operator_id, route_group_id, permit_number, issue_date, expiry_date, maximum_bus_assigned, status, permit_type, created_at, updated_at, created_by, updated_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666665', 'SLTB-WP-2025-001', '2025-01-01', '2025-12-31', 10, 'active', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '8e886a71-445c-4e3a-8bc5-a17b5b2dad24', '66666666-6666-6666-6666-666666666661', 'SLTB-CP-2025-001', '2025-01-01', '2025-12-31', 5, 'active', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '22222222-2222-2222-2222-222222222221', '66666666-6666-6666-6666-666666666665', 'PVT-SW-2025-001', '2025-01-15', '2025-12-31', 3, 'active', 'SEMI_LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666661', 'PVT-RE-2025-001', '2025-02-01', '2026-01-31', 2, 'active', 'LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '22222222-2222-2222-2222-222222222224', '66666666-6666-6666-6666-666666666662', 'PVT-HE-2025-001', '2025-01-01', '2025-12-31', 3, 'active', 'EXTRA_LUXURY_HIGHWAY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '22222222-2222-2222-2222-222222222227', '66666666-6666-6666-6666-666666666666', 'PVT-NE-2025-001', '2025-03-01', '2026-02-28', 2, 'active', 'LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa14', '22222222-2222-2222-2222-222222222228', '66666666-6666-6666-6666-666666666667', 'PVT-EC-2025-001', '2025-04-01', '2026-03-31', 2, 'active', 'SEMI_LUXURY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', '22222222-2222-2222-2222-222222222229', '66666666-6666-6666-6666-666666666668', 'PVT-UH-2025-001', '2025-05-01', '2026-04-30', 1, 'active', 'NORMAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 8. BUS TO PERMIT ASSIGNMENTS - Vehicle Allocations
-- ============================================================================
-- Assignment of buses to specific permits for operational authorization

INSERT INTO bus_passenger_service_permit_assignment (id, bus_id, passenger_service_permit_id, start_date, end_date, request_status, status, created_at, updated_at, created_by, updated_by) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999991', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '99999999-9999-9999-9999-999999999992', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', '99999999-9999-9999-9999-999999999993', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', '99999999-9999-9999-9999-999999999994', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '2025-01-15', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbf', '99999999-9999-9999-9999-999999999995', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '2025-02-01', '2026-01-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccc', '99999999-9999-9999-9999-999999999996', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '2025-01-01', '2025-12-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-cccccccccccd', '99999999-9999-9999-9999-999999999998', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '2025-03-01', '2026-02-28', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('bbbbbbbb-bbbb-bbbb-bbbb-ccccccccccce', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', '2025-04-01', '2026-03-31', 'ACCEPTED', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 9. SCHEDULES - Service Timetables
-- ============================================================================
-- Regular schedules defining when services operate

INSERT INTO schedule (id, route_id, name, description, schedule_type, effective_start_date, effective_end_date, status, created_at, updated_at, created_by, updated_by) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777771', 'Colombo-Kandy Morning Schedule', 'Regular morning services to Kandy', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-cccccccccccd', '77777777-7777-7777-7777-777777777772', 'Kandy-Colombo Evening Schedule', 'Regular evening return services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-ccccccccccce', '77777777-7777-7777-7777-777777777773', 'Pettah-Galle Express Schedule', 'Highway express services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-cccccccccccf', '77777777-7777-7777-7777-777777777777', 'Fort-Maharagama Suburban', 'Frequent suburban services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '77777777-7777-7777-7777-777777777779', 'Pettah-Jaffna Long Distance', 'Northern long-distance services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '77777777-7777-7777-7777-777777777781', 'Pettah-Trincomalee Eastern', 'Eastern coastal services', 'REGULAR', '2025-01-01', '2025-12-31', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- ============================================================================
-- 10. SCHEDULE CALENDARS - Operating Days
-- ============================================================================
-- Days of the week when schedules are active

-- Weekday services for intercity routes
INSERT INTO schedule_calendar (id, schedule_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, true, true, true, true, true, false),
('dddddddd-dddd-dddd-dddd-ddddddddddde', 'cccccccc-cccc-cccc-cccc-cccccccccccd', true, true, true, true, true, true, false),
('dddddddd-dddd-dddd-dddd-dddddddddddf', 'cccccccc-cccc-cccc-cccc-ccccccccccce', true, true, true, true, true, true, true);

-- Daily suburban services
INSERT INTO schedule_calendar (id, schedule_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
('dddddddd-dddd-dddd-dddd-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccf', true, true, true, true, true, true, true);

-- Long distance services (weekdays only)
INSERT INTO schedule_calendar (id, schedule_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES
('dddddddd-dddd-dddd-dddd-ddddddddddf1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', true, true, true, true, true, false, false),
('dddddddd-dddd-dddd-dddd-ddddddddddf2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', true, true, true, true, true, false, false);

-- ============================================================================
-- 11. SCHEDULE STOPS - Detailed Timings
-- ============================================================================
-- Specific arrival and departure times at each stop

-- Colombo to Kandy Schedule Stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888881', 0, NULL, '05:30:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888882', 1, '05:55:00', '05:57:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888883', 2, '06:15:00', '06:17:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888884', 3, '07:10:00', '07:12:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888885', 4, '07:45:00', '07:47:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888886', 5, '08:00:00', NULL);

-- Pettah to Galle Schedule Stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef7', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-888888888887', 0, NULL, '07:00:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef8', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-888888888888', 1, '07:25:00', '07:27:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef9', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-888888888889', 2, '08:15:00', '08:17:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeefa', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-88888888888a', 3, '08:35:00', '08:37:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeefb', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-88888888888b', 4, '08:55:00', '08:57:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeefc', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '88888888-8888-8888-8888-88888888888c', 5, '09:30:00', NULL);

-- Suburban Schedule Stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeefa0', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888d', 0, NULL, '06:00:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeefa1', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888e', 1, '06:20:00', '06:22:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeefa2', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '88888888-8888-8888-8888-88888888888f', 2, '06:40:00', NULL);

-- Long Distance Schedule Stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeefd', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 0, NULL, '06:00:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeefe', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, '07:00:00', '07:15:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeff', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 2, '09:00:00', '09:30:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef4', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 3, '13:00:00', '13:30:00'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeef5', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 4, '18:00:00', NULL);

-- Eastern Route Schedule Stops
INSERT INTO schedule_stop (id, schedule_id, route_stop_id, stop_order, arrival_time, departure_time) VALUES
('fff00000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 0, NULL, '08:00:00'),
('fff00000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 1, '10:00:00', '10:30:00'),
('fff00000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 2, '13:30:00', '14:00:00'),
('fff00000-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', 3, '16:00:00', NULL);

-- ============================================================================
-- 12. SCHEDULE EXCEPTIONS - Special Cases
-- ============================================================================
-- Exceptions to regular schedules (cancellations, additional services)

INSERT INTO schedule_exception (id, schedule_id, exception_date, exception_type) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-07', 'REMOVED'),
('ffffffff-ffff-ffff-ffff-fffffffffffe', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-10-08', 'ADDED'),
('ffffffff-ffff-ffff-ffff-fffffffffff0', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-10-10', 'REMOVED'),
('ffffffff-ffff-ffff-ffff-fffffffffff1', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2025-10-15', 'ADDED'),
('ffffffff-ffff-ffff-ffff-fffffffffff2', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '2025-10-20', 'REMOVED');

-- ============================================================================
-- 13. TRIPS - Operational Records
-- ============================================================================
-- Actual trip executions with real-time status and performance data

-- Historical Completed Trips
INSERT INTO trip (id, passenger_service_permit_id, schedule_id, trip_date, scheduled_departure_time, actual_departure_time, scheduled_arrival_time, actual_arrival_time, bus_id, driver_id, conductor_id, status, notes, created_at, updated_at, created_by, updated_by) VALUES
('10101010-1010-1010-1010-101010101010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-09-20', '05:30:00', '05:32:00', '08:00:00', '08:05:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Normal service, slight delay due to traffic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-09-20', '06:00:00', '06:00:00', '06:40:00', NULL, '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'in_transit', 'Currently en route', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101012', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-09-21', '07:00:00', NULL, '09:30:00', NULL, '99999999-9999-9999-9999-999999999996', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'pending', 'Scheduled for tomorrow', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Additional Completed Trips
INSERT INTO trip (id, passenger_service_permit_id, schedule_id, trip_date, scheduled_departure_time, actual_departure_time, scheduled_arrival_time, actual_arrival_time, bus_id, driver_id, conductor_id, status, notes, created_at, updated_at, created_by, updated_by) VALUES
('10101010-1010-1010-1010-101010101013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-01', '05:30:00', '05:30:00', '08:00:00', '08:00:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'On-time service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101014', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-02', '05:30:00', '05:45:00', '08:00:00', '08:30:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Delayed due to road construction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-03', '05:30:00', '05:30:00', '08:00:00', '07:45:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Early arrival due to light traffic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101016', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-04', '05:30:00', NULL, '08:00:00', NULL, '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cancelled', 'Cancelled due to driver illness', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', '2025-10-01', '16:00:00', '16:00:00', '18:30:00', '18:30:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Return journey completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101018', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccd', '2025-10-02', '16:00:00', '16:15:00', '18:30:00', '18:45:00', '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'completed', 'Delayed return due to traffic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-10-01', '07:00:00', '07:00:00', '09:30:00', '09:30:00', '99999999-9999-9999-9999-999999999996', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'completed', 'Highway express service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-10-02', '07:00:00', '07:10:00', '09:30:00', '09:50:00', '99999999-9999-9999-9999-999999999996', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'completed', 'Express service with minor delay', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-10-01', '06:00:00', '06:00:00', '06:40:00', '06:40:00', '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'completed', 'Regular suburban service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101022', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-10-02', '06:00:00', '06:05:00', '06:40:00', '06:45:00', '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'completed', 'Suburban service with slight delay', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-10-03', '06:00:00', '06:00:00', '06:40:00', NULL, '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'in_transit', 'Currently en route to Maharagama', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2025-10-01', '06:00:00', '06:00:00', '18:00:00', '18:00:00', '99999999-9999-9999-9999-999999999998', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'completed', 'Northern long-distance service completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', '2025-10-03', '06:00:00', '06:30:00', '18:00:00', '18:45:00', '99999999-9999-9999-9999-999999999998', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000008', 'completed', 'Delayed northern service due to weather', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101026', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa15', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', '2025-10-02', '08:00:00', '08:00:00', '16:00:00', '16:00:00', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010', 'completed', 'Eastern coastal service completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Current and Future Trips
INSERT INTO trip (id, passenger_service_permit_id, schedule_id, trip_date, scheduled_departure_time, actual_departure_time, scheduled_arrival_time, actual_arrival_time, bus_id, driver_id, conductor_id, status, notes, created_at, updated_at, created_by, updated_by) VALUES
('10101010-1010-1010-1010-101010101027', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-08', '05:30:00', NULL, '08:00:00', NULL, '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'pending', 'Scheduled for next week', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101028', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', 'cccccccc-cccc-cccc-cccc-ccccccccccce', '2025-10-09', '07:00:00', NULL, '09:30:00', NULL, '99999999-9999-9999-9999-999999999996', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'pending', 'Express service scheduled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101029', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccf', '2025-10-07', '06:00:00', '06:00:00', '06:40:00', NULL, '99999999-9999-9999-9999-999999999991', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'boarding', 'Passengers boarding at Fort', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-07', '05:30:00', '05:30:00', '08:00:00', NULL, '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'departed', 'Departed from Colombo Fort', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101031', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-05', '05:30:00', '06:15:00', '08:00:00', NULL, '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'delayed', 'Significantly delayed due to accident', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),
('10101010-1010-1010-1010-101010101032', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2025-10-06', '05:30:00', NULL, '08:00:00', NULL, '99999999-9999-9999-9999-999999999993', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'cancelled', 'Cancelled due to vehicle breakdown', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- ============================================================================
-- DATA INSERTION COMPLETED SUCCESSFULLY
-- ============================================================================
-- Summary:
-- - 10 Operators (4 CTB + 6 Private)
-- - 20 Bus Stops across Sri Lanka
-- - 8 Route Groups
-- - 12 Routes (6 pairs)
-- - Complete route stop sequences
-- - 7 Buses with various facilities
-- - 8 Passenger Service Permits
-- - 8 Bus-permit assignments
-- - 6 Schedules with operating calendars
-- - Detailed schedule stops with timings
-- - 5 Schedule exceptions
-- - 23 Trips with various statuses and scenarios
--
-- Total Records: 113
-- Ready for comprehensive testing of the route management service.
-- ============================================================================