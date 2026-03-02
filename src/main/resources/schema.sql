-- Database Triggers for Auto-Calculation (Path 3)
-- Automatically runs after Hibernate creates tables

-- =====================================================
-- Trigger 1: RouteStop Distance Calculation
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_route_stop_distance()
RETURNS TRIGGER AS $$
DECLARE
    total_distance DOUBLE PRECISION;
    max_stop_order INTEGER;
    min_stop_order INTEGER;
    route_start_stop_id UUID;
    route_end_stop_id UUID;
BEGIN
    -- Get route information
    SELECT 
        r.distance_km,
        r.start_stop_id,
        r.end_stop_id
    INTO 
        total_distance,
        route_start_stop_id,
        route_end_stop_id
    FROM route r 
    WHERE r.id = NEW.route_id;
    
    -- Get min and max stop_order for this route (include all rows)
    SELECT MIN(stop_order), MAX(stop_order) INTO min_stop_order, max_stop_order
    FROM route_stop 
    WHERE route_id = NEW.route_id;
    
    -- For INSERT, consider if current row changes min/max
    IF TG_OP = 'INSERT' THEN
        IF min_stop_order IS NULL OR NEW.stop_order < min_stop_order THEN
            min_stop_order := NEW.stop_order;
        END IF;
        IF max_stop_order IS NULL OR NEW.stop_order > max_stop_order THEN
            max_stop_order := NEW.stop_order;
        END IF;
    ELSE
        -- For UPDATE, reconsider min/max if this row's stop_order changed
        IF NEW.stop_order < COALESCE(min_stop_order, NEW.stop_order) THEN
            min_stop_order := NEW.stop_order;
        END IF;
        IF NEW.stop_order > COALESCE(max_stop_order, NEW.stop_order) THEN
            max_stop_order := NEW.stop_order;
        END IF;
    END IF;
    
    -- Calculate distance based on stop position if we have the necessary data
    IF total_distance IS NOT NULL AND total_distance > 0 THEN
        -- First stop (min stop_order or matches start_stop_id) has distance 0
        IF NEW.stop_order = min_stop_order OR NEW.stop_id = route_start_stop_id THEN
            NEW.distance_from_start_km_calculated := 0.0;
        -- Last stop (max stop_order or matches end_stop_id) has distance equal to total route distance
        ELSIF NEW.stop_order = max_stop_order OR NEW.stop_id = route_end_stop_id THEN
            NEW.distance_from_start_km_calculated := total_distance;
        -- Intermediate stops: distribute distance proportionally using stop_order
        ELSIF max_stop_order IS NOT NULL AND min_stop_order IS NOT NULL AND max_stop_order > min_stop_order THEN
            -- Linear interpolation: (stop_order - min) / (max - min) * total_distance
            NEW.distance_from_start_km_calculated := 
                ((NEW.stop_order - min_stop_order)::DOUBLE PRECISION / (max_stop_order - min_stop_order)::DOUBLE PRECISION) * total_distance;
        ELSE
            NEW.distance_from_start_km_calculated := 0.0;
        END IF;
    ELSE
        -- No route distance available, set to 0
        NEW.distance_from_start_km_calculated := 0.0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_route_stop_distance ON route_stop;

CREATE TRIGGER trigger_calculate_route_stop_distance
BEFORE INSERT OR UPDATE ON route_stop
FOR EACH ROW 
EXECUTE FUNCTION calculate_route_stop_distance();

-- =====================================================
-- Trigger 2: ScheduleStop Time Calculation
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_schedule_stop_times()
RETURNS TRIGGER AS $$
DECLARE
    origin_departure TIME;
    destination_arrival TIME;
    total_distance DOUBLE PRECISION;
    stop_distance DOUBLE PRECISION;
    total_duration_seconds INTEGER;
    stop_duration_seconds INTEGER;
    calculated_time TIME;
    origin_stop_id UUID;
    destination_stop_id UUID;
    max_stop_order INTEGER;
    min_stop_order INTEGER;
BEGIN
    -- Always recalculate for consistency
    
    -- Get route's start and end stop IDs and total distance
    SELECT r.start_stop_id, r.end_stop_id, r.distance_km
    INTO origin_stop_id, destination_stop_id, total_distance
    FROM schedule sch
    JOIN route r ON sch.route_id = r.id
    WHERE sch.id = NEW.schedule_id;
    
    -- Get min and max stop_order for this schedule (excluding current row properly)
    -- FIX: Handle INSERT vs UPDATE differently since NEW.id is NULL during INSERT
    IF TG_OP = 'INSERT' THEN
        -- For INSERT, get min/max from existing rows only
        SELECT MIN(stop_order), MAX(stop_order) INTO min_stop_order, max_stop_order
        FROM schedule_stop WHERE schedule_id = NEW.schedule_id;
    ELSE
        -- For UPDATE, exclude the current row by ID
        SELECT MIN(stop_order), MAX(stop_order) INTO min_stop_order, max_stop_order
        FROM schedule_stop WHERE schedule_id = NEW.schedule_id AND id != NEW.id;
    END IF;
    
    -- Include current row in min/max calculation
    IF min_stop_order IS NULL OR NEW.stop_order < min_stop_order THEN
        min_stop_order := NEW.stop_order;
    END IF;
    IF max_stop_order IS NULL OR NEW.stop_order > max_stop_order THEN
        max_stop_order := NEW.stop_order;
    END IF;
    
    -- Get origin departure time (first stop in schedule - stop_order = min)
    SELECT COALESCE(ss.departure_time, ss.departure_time_unverified)
    INTO origin_departure
    FROM schedule_stop ss
    WHERE ss.schedule_id = NEW.schedule_id 
    AND ss.stop_order = min_stop_order
    LIMIT 1;
    
    -- If we're inserting the first stop, use its departure time
    IF NEW.stop_order = min_stop_order THEN
        origin_departure := COALESCE(NEW.departure_time, NEW.departure_time_unverified, origin_departure);
    END IF;
    
    -- Get destination arrival time (last stop in schedule - stop_order = max)
    SELECT COALESCE(ss.arrival_time, ss.arrival_time_unverified)
    INTO destination_arrival
    FROM schedule_stop ss
    WHERE ss.schedule_id = NEW.schedule_id 
    AND ss.stop_order = max_stop_order
    LIMIT 1;
    
    -- If we're inserting the last stop, use its arrival time
    IF NEW.stop_order = max_stop_order THEN
        destination_arrival := COALESCE(NEW.arrival_time, NEW.arrival_time_unverified, destination_arrival);
    END IF;
    
    -- Get stop distance from start (prioritize: verified > unverified > calculated)
    SELECT 
        COALESCE(
            rs.distance_from_start_km, 
            rs.distance_from_start_km_unverified,
            rs.distance_from_start_km_calculated
        )
    INTO stop_distance
    FROM route_stop rs
    WHERE rs.id = NEW.route_stop_id;
    
    -- Calculate times if we have all necessary data
    IF origin_departure IS NOT NULL 
       AND destination_arrival IS NOT NULL 
       AND total_distance IS NOT NULL 
       AND total_distance > 0
       AND stop_distance IS NOT NULL THEN
        
        -- Calculate total travel duration in seconds
        total_duration_seconds := EXTRACT(EPOCH FROM (destination_arrival - origin_departure))::INTEGER;
        
        -- Handle case where destination is before origin (next day)
        IF total_duration_seconds < 0 THEN
            total_duration_seconds := total_duration_seconds + 86400; -- Add 24 hours
        END IF;
        
        -- Calculate duration for this stop based on distance proportion
        stop_duration_seconds := ((stop_distance / total_distance) * total_duration_seconds)::INTEGER;
        
        -- Calculate the time by adding duration to origin departure
        calculated_time := origin_departure + (stop_duration_seconds || ' seconds')::INTERVAL;
        
        -- Set calculated arrival time
        IF stop_distance = 0 THEN
            -- First stop: arrival same as departure
            NEW.arrival_time_calculated := origin_departure;
        ELSIF stop_distance >= total_distance THEN
            -- Last stop: use destination arrival
            NEW.arrival_time_calculated := destination_arrival;
        ELSE
            NEW.arrival_time_calculated := calculated_time;
        END IF;
        
        -- Set calculated departure time
        IF stop_distance = 0 THEN
            NEW.departure_time_calculated := origin_departure;
        ELSIF stop_distance >= total_distance THEN
            NEW.departure_time_calculated := destination_arrival;
        ELSE
            -- For intermediate stops, departure = arrival (no dwell time assumed)
            NEW.departure_time_calculated := calculated_time;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_schedule_stop_times ON schedule_stop;

CREATE TRIGGER trigger_calculate_schedule_stop_times
BEFORE INSERT OR UPDATE ON schedule_stop
FOR EACH ROW 
EXECUTE FUNCTION calculate_schedule_stop_times();

-- =====================================================
-- Trigger 3: Recalculate when route distance changes
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_route_stop_distances()
RETURNS TRIGGER AS $$
DECLARE
    total_stops INTEGER;
    max_stop_order INTEGER;
    min_stop_order INTEGER;
    route_start_stop_id UUID;
    route_end_stop_id UUID;
BEGIN
    -- Only proceed if distance_km has changed
    IF OLD.distance_km IS DISTINCT FROM NEW.distance_km THEN
        -- Get route information
        route_start_stop_id := NEW.start_stop_id;
        route_end_stop_id := NEW.end_stop_id;
        
        -- Get total number of stops and min/max stop_order
        SELECT COUNT(*), MIN(stop_order), MAX(stop_order) 
        INTO total_stops, min_stop_order, max_stop_order 
        FROM route_stop WHERE route_id = NEW.id;
        
        -- Recalculate distances for all route stops if we have the necessary data
        IF NEW.distance_km IS NOT NULL AND NEW.distance_km > 0 AND total_stops >= 1 THEN
            IF total_stops = 1 OR min_stop_order = max_stop_order THEN
                -- Single stop gets 0 distance
                UPDATE route_stop
                SET distance_from_start_km_calculated = 0.0
                WHERE route_id = NEW.id;
            ELSE
                -- Update using stop_order for linear interpolation
                -- Formula: (stop_order - min) / (max - min) * total_distance
                UPDATE route_stop
                SET distance_from_start_km_calculated = 
                    CASE 
                        WHEN stop_order = min_stop_order OR stop_id = route_start_stop_id THEN 0.0
                        WHEN stop_order = max_stop_order OR stop_id = route_end_stop_id THEN NEW.distance_km
                        ELSE ((stop_order - min_stop_order)::DOUBLE PRECISION / (max_stop_order - min_stop_order)::DOUBLE PRECISION) * NEW.distance_km
                    END
                WHERE route_id = NEW.id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_route_stop_distances ON route;

CREATE TRIGGER trigger_recalculate_route_stop_distances
AFTER UPDATE ON route
FOR EACH ROW 
EXECUTE FUNCTION recalculate_route_stop_distances();

-- =====================================================
-- Trigger 4: Recalculate when origin/destination times change
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_schedule_stop_times()
RETURNS TRIGGER AS $$
DECLARE
    min_stop_order INTEGER;
    max_stop_order INTEGER;
    v_origin_departure TIME;
    v_destination_arrival TIME;
    v_total_distance DOUBLE PRECISION;
    v_total_duration_seconds INTEGER;
BEGIN
    -- Get min and max stop_order for this schedule
    SELECT MIN(stop_order), MAX(stop_order) INTO min_stop_order, max_stop_order
    FROM schedule_stop WHERE schedule_id = NEW.schedule_id;
    
    -- Check if this is the first or last stop and times have changed
    IF NEW.stop_order = min_stop_order OR NEW.stop_order = max_stop_order THEN
        IF (OLD.arrival_time IS DISTINCT FROM NEW.arrival_time) OR 
           (OLD.departure_time IS DISTINCT FROM NEW.departure_time) OR
           (OLD.arrival_time_unverified IS DISTINCT FROM NEW.arrival_time_unverified) OR
           (OLD.departure_time_unverified IS DISTINCT FROM NEW.departure_time_unverified) THEN
            
            -- Get the new origin departure time
            SELECT COALESCE(ss.departure_time, ss.departure_time_unverified)
            INTO v_origin_departure
            FROM schedule_stop ss
            WHERE ss.schedule_id = NEW.schedule_id AND ss.stop_order = min_stop_order
            LIMIT 1;
            
            -- Get the new destination arrival time  
            SELECT COALESCE(ss.arrival_time, ss.arrival_time_unverified)
            INTO v_destination_arrival
            FROM schedule_stop ss
            WHERE ss.schedule_id = NEW.schedule_id AND ss.stop_order = max_stop_order
            LIMIT 1;
            
            -- Get route total distance
            SELECT r.distance_km INTO v_total_distance
            FROM schedule sch
            JOIN route r ON sch.route_id = r.id
            WHERE sch.id = NEW.schedule_id;
            
            -- Only recalculate if we have all necessary data
            IF v_origin_departure IS NOT NULL AND v_destination_arrival IS NOT NULL 
               AND v_total_distance IS NOT NULL AND v_total_distance > 0 THEN
                
                -- Calculate total duration in seconds
                v_total_duration_seconds := EXTRACT(EPOCH FROM (v_destination_arrival - v_origin_departure))::INTEGER;
                IF v_total_duration_seconds < 0 THEN
                    v_total_duration_seconds := v_total_duration_seconds + 86400;
                END IF;
                
                -- FIX: Batch update all intermediate stops in a single UPDATE statement
                -- This avoids O(n) cascading trigger calls
                UPDATE schedule_stop ss
                SET 
                    arrival_time_calculated = v_origin_departure + 
                        (((COALESCE(rs.distance_from_start_km, rs.distance_from_start_km_unverified, rs.distance_from_start_km_calculated, 0) 
                           / v_total_distance) * v_total_duration_seconds)::INTEGER || ' seconds')::INTERVAL,
                    departure_time_calculated = v_origin_departure + 
                        (((COALESCE(rs.distance_from_start_km, rs.distance_from_start_km_unverified, rs.distance_from_start_km_calculated, 0) 
                           / v_total_distance) * v_total_duration_seconds)::INTEGER || ' seconds')::INTERVAL
                FROM route_stop rs
                WHERE ss.route_stop_id = rs.id
                  AND ss.schedule_id = NEW.schedule_id
                  AND ss.stop_order > min_stop_order 
                  AND ss.stop_order < max_stop_order;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_schedule_stop_times ON schedule_stop;

CREATE TRIGGER trigger_recalculate_schedule_stop_times
AFTER UPDATE ON schedule_stop
FOR EACH ROW 
EXECUTE FUNCTION recalculate_schedule_stop_times();

-- =====================================================
-- UTILITY FUNCTIONS: Recalculate existing data
-- =====================================================

-- Function to recalculate all route_stop distances for a specific route
CREATE OR REPLACE FUNCTION recalculate_all_route_stop_distances(p_route_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    r RECORD;
    updated_count INTEGER := 0;
    row_count_temp INTEGER;
    total_stops INTEGER;
    max_stop_order INTEGER;
    min_stop_order INTEGER;
    route_start_stop_id UUID;
    route_end_stop_id UUID;
    route_distance DOUBLE PRECISION;
BEGIN
    FOR r IN 
        SELECT id, distance_km, start_stop_id, end_stop_id 
        FROM route 
        WHERE (p_route_id IS NULL OR id = p_route_id)
        AND distance_km IS NOT NULL AND distance_km > 0
    LOOP
        route_distance := r.distance_km;
        route_start_stop_id := r.start_stop_id;
        route_end_stop_id := r.end_stop_id;
        
        -- Get total number of stops and min/max stop_order
        SELECT COUNT(*), MIN(stop_order), MAX(stop_order) 
        INTO total_stops, min_stop_order, max_stop_order 
        FROM route_stop WHERE route_id = r.id;
        
        IF total_stops >= 1 THEN
            IF total_stops = 1 OR min_stop_order = max_stop_order THEN
                UPDATE route_stop
                SET distance_from_start_km_calculated = 0.0
                WHERE route_id = r.id;
            ELSE
                -- Formula: (stop_order - min) / (max - min) * total_distance
                UPDATE route_stop
                SET distance_from_start_km_calculated = 
                    CASE 
                        WHEN stop_order = min_stop_order OR stop_id = route_start_stop_id THEN 0.0
                        WHEN stop_order = max_stop_order OR stop_id = route_end_stop_id THEN route_distance
                        ELSE ((stop_order - min_stop_order)::DOUBLE PRECISION / (max_stop_order - min_stop_order)::DOUBLE PRECISION) * route_distance
                    END
                WHERE route_id = r.id;
            END IF;
            
            GET DIAGNOSTICS row_count_temp = ROW_COUNT;
            updated_count := updated_count + row_count_temp;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all schedule_stop times for a specific schedule
CREATE OR REPLACE FUNCTION recalculate_all_schedule_stop_times(p_schedule_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    s RECORD;
    stop_rec RECORD;
    updated_count INTEGER := 0;
    origin_departure TIME;
    destination_arrival TIME;
    total_distance DOUBLE PRECISION;
    stop_distance DOUBLE PRECISION;
    total_duration_seconds INTEGER;
    stop_duration_seconds INTEGER;
    calculated_time TIME;
    min_stop_order INTEGER;
    max_stop_order INTEGER;
BEGIN
    FOR s IN 
        SELECT sch.id as schedule_id, r.distance_km, r.start_stop_id, r.end_stop_id
        FROM schedule sch
        JOIN route r ON sch.route_id = r.id
        WHERE (p_schedule_id IS NULL OR sch.id = p_schedule_id)
        AND r.distance_km IS NOT NULL AND r.distance_km > 0
    LOOP
        total_distance := s.distance_km;
        
        -- Get min and max stop_order for this schedule
        SELECT MIN(stop_order), MAX(stop_order) INTO min_stop_order, max_stop_order
        FROM schedule_stop WHERE schedule_id = s.schedule_id;
        
        IF min_stop_order IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Get origin departure time (first stop)
        SELECT COALESCE(sst.departure_time, sst.departure_time_unverified)
        INTO origin_departure
        FROM schedule_stop sst
        WHERE sst.schedule_id = s.schedule_id 
        AND sst.stop_order = min_stop_order
        LIMIT 1;
        
        -- Get destination arrival time (last stop)
        SELECT COALESCE(sst.arrival_time, sst.arrival_time_unverified)
        INTO destination_arrival
        FROM schedule_stop sst
        WHERE sst.schedule_id = s.schedule_id 
        AND sst.stop_order = max_stop_order
        LIMIT 1;
        
        IF origin_departure IS NULL OR destination_arrival IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Calculate total travel duration in seconds
        total_duration_seconds := EXTRACT(EPOCH FROM (destination_arrival - origin_departure))::INTEGER;
        IF total_duration_seconds < 0 THEN
            total_duration_seconds := total_duration_seconds + 86400;
        END IF;
        
        -- Update each schedule stop
        FOR stop_rec IN
            SELECT sst.id, sst.stop_order, sst.route_stop_id,
                   COALESCE(rs.distance_from_start_km, rs.distance_from_start_km_unverified, rs.distance_from_start_km_calculated, 0) as stop_dist
            FROM schedule_stop sst
            JOIN route_stop rs ON sst.route_stop_id = rs.id
            WHERE sst.schedule_id = s.schedule_id
        LOOP
            stop_distance := stop_rec.stop_dist;
            
            IF stop_distance = 0 OR stop_rec.stop_order = min_stop_order THEN
                calculated_time := origin_departure;
            ELSIF stop_distance >= total_distance OR stop_rec.stop_order = max_stop_order THEN
                calculated_time := destination_arrival;
            ELSE
                stop_duration_seconds := ((stop_distance / total_distance) * total_duration_seconds)::INTEGER;
                calculated_time := origin_departure + (stop_duration_seconds || ' seconds')::INTERVAL;
            END IF;
            
            UPDATE schedule_stop
            SET arrival_time_calculated = calculated_time,
                departure_time_calculated = calculated_time
            WHERE id = stop_rec.id;
            
            updated_count := updated_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- These indexes improve trigger performance for lookups

-- Index for schedule_stop queries by schedule_id and stop_order
CREATE INDEX IF NOT EXISTS idx_schedule_stop_schedule_order 
ON schedule_stop(schedule_id, stop_order);

-- Index for route_stop queries by route_id and stop_order
CREATE INDEX IF NOT EXISTS idx_route_stop_route_order 
ON route_stop(route_id, stop_order);

-- Index for route_stop distance lookups
CREATE INDEX IF NOT EXISTS idx_route_stop_id_distances 
ON route_stop(id) 
INCLUDE (distance_from_start_km, distance_from_start_km_unverified, distance_from_start_km_calculated);

-- =====================================================
-- Run initial calculation for existing data
-- =====================================================

-- Recalculate all route_stop distances
SELECT recalculate_all_route_stop_distances();

-- Recalculate all schedule_stop times
SELECT recalculate_all_schedule_stop_times();
