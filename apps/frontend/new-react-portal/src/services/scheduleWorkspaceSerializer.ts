import yaml from 'js-yaml';
import {
  ScheduleWorkspaceData,
  Schedule,
  ScheduleStop,
  ScheduleCalendar,
  ScheduleException,
  ScheduleTypeEnum,
  ScheduleStatusEnum,
  ExceptionTypeEnum,
  createEmptyCalendar,
  createEmptySchedule,
} from '@/types/ScheduleWorkspaceData';

/**
 * Schedule Workspace Serializer
 * 
 * Provides serialization and deserialization functions to convert
 * schedule workspace data to/from YAML format for the textual mode.
 */

// ============================================================================
// YAML SERIALIZATION (Data -> YAML)
// ============================================================================

/**
 * Serialize ScheduleWorkspaceData to YAML format
 */
export function serializeSchedulesToYaml(data: ScheduleWorkspaceData): string {
  const yamlData: any = {
    schedule_workspace: {
      // Route information (read-only context)
      route_id: data.selectedRouteId || '',
      route_name: data.selectedRouteName || '',
      route_group_id: data.selectedRouteGroupId || '',
      route_group_name: data.selectedRouteGroupName || '',
      
      // Schedules array
      schedules: data.schedules.map((schedule, index) => 
        serializeSchedule(schedule, index)
      ),
    }
  };

  return yaml.dump(yamlData, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Serialize a single schedule to YAML-friendly object
 */
function serializeSchedule(schedule: Schedule, index: number): any {
  const scheduleObj: any = {
    // Metadata
    name: schedule.name || `Schedule ${index + 1}`,
    schedule_type: schedule.scheduleType || 'REGULAR',
    status: schedule.status || 'PENDING',
    description: schedule.description || '',
    
    // Dates
    effective_start_date: schedule.effectiveStartDate || '',
    effective_end_date: schedule.effectiveEndDate || '',
    
    // Options
    generate_trips: schedule.generateTrips ?? false,
    
    // Calendar (operating days)
    calendar: serializeCalendar(schedule.calendar),
    
    // Schedule stops with timings
    stops: schedule.scheduleStops.map(stop => serializeScheduleStop(stop)),
    
    // Exceptions
    exceptions: schedule.exceptions.map(exc => serializeException(exc)),
  };

  // Add ID if exists (for edit mode)
  if (schedule.id) {
    scheduleObj.id = schedule.id;
  }

  return { schedule: scheduleObj };
}

/**
 * Serialize calendar to YAML-friendly object
 */
function serializeCalendar(calendar: ScheduleCalendar): any {
  return {
    monday: calendar.monday,
    tuesday: calendar.tuesday,
    wednesday: calendar.wednesday,
    thursday: calendar.thursday,
    friday: calendar.friday,
    saturday: calendar.saturday,
    sunday: calendar.sunday,
  };
}

/**
 * Serialize schedule stop to YAML-friendly object
 */
function serializeScheduleStop(stop: ScheduleStop): any {
  const stopObj: any = {
    stop_id: stop.stopId || '',
    stop_name: stop.stopName || '',
    stop_order: stop.stopOrder,
  };

  // Only add times if they exist
  if (stop.arrivalTime) {
    stopObj.arrival_time = stop.arrivalTime;
  }
  if (stop.departureTime) {
    stopObj.departure_time = stop.departureTime;
  }

  // Add ID if exists (for edit mode)
  if (stop.id) {
    stopObj.id = stop.id;
  }

  return { stop: stopObj };
}

/**
 * Serialize exception to YAML-friendly object
 */
function serializeException(exception: ScheduleException): any {
  const excObj: any = {
    exception_date: exception.exceptionDate || '',
    exception_type: exception.exceptionType || 'REMOVED',
  };

  if (exception.description) {
    excObj.description = exception.description;
  }

  return { exception: excObj };
}

// ============================================================================
// YAML DESERIALIZATION (YAML -> Data)
// ============================================================================

/**
 * Parse YAML format to partial ScheduleWorkspaceData
 * 
 * Note: This only updates schedules data, not the route selection or available routes.
 * The route context is maintained from the current workspace state.
 */
export function parseSchedulesFromYaml(yamlText: string): { 
  schedules: Schedule[];
  error?: string;
} {
  try {
    if (!yamlText.trim()) {
      return { schedules: [], error: 'Empty YAML content' };
    }

    const parsed = yaml.load(yamlText) as any;
    
    if (!parsed || typeof parsed !== 'object') {
      return { schedules: [], error: 'Invalid YAML structure' };
    }

    // Handle schedule_workspace wrapper
    const workspaceData = parsed.schedule_workspace;
    if (!workspaceData) {
      return { schedules: [], error: 'Missing schedule_workspace root element' };
    }

    // Parse schedules array
    const schedulesArray = workspaceData.schedules;
    if (!schedulesArray || !Array.isArray(schedulesArray)) {
      return { schedules: [], error: 'Missing or invalid schedules array' };
    }

    const schedules: Schedule[] = schedulesArray.map((wrapper: any, index: number) => {
      const scheduleData = wrapper.schedule || wrapper;
      return parseSchedule(scheduleData, index);
    });

    return { schedules };
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    return { 
      schedules: [], 
      error: error instanceof Error ? error.message : 'Failed to parse YAML' 
    };
  }
}

/**
 * Parse a single schedule from YAML data
 */
function parseSchedule(data: any, index: number): Schedule {
  const calendar = parseCalendar(data.calendar);
  const scheduleStops = parseScheduleStops(data.stops);
  const exceptions = parseExceptions(data.exceptions);

  const schedule: Schedule = {
    name: String(data.name || `Schedule ${index + 1}`),
    routeId: String(data.route_id || ''),
    routeName: data.route_name ? String(data.route_name) : undefined,
    routeGroupId: data.route_group_id ? String(data.route_group_id) : undefined,
    routeGroupName: data.route_group_name ? String(data.route_group_name) : undefined,
    scheduleType: parseScheduleType(data.schedule_type),
    effectiveStartDate: String(data.effective_start_date || new Date().toISOString().split('T')[0]),
    effectiveEndDate: data.effective_end_date ? String(data.effective_end_date) : undefined,
    status: parseScheduleStatus(data.status),
    description: data.description ? String(data.description) : undefined,
    generateTrips: data.generate_trips !== false,
    scheduleStops,
    calendar,
    exceptions,
  };

  // Add ID if exists
  if (data.id) {
    schedule.id = String(data.id);
  }

  return schedule;
}

/**
 * Parse schedule type from string
 */
function parseScheduleType(typeStr: string | undefined): ScheduleTypeEnum {
  const normalized = (typeStr || '').toUpperCase();
  if (normalized === 'SPECIAL') {
    return ScheduleTypeEnum.SPECIAL;
  }
  return ScheduleTypeEnum.REGULAR;
}

/**
 * Parse schedule status from string
 */
function parseScheduleStatus(statusStr: string | undefined): ScheduleStatusEnum {
  const normalized = (statusStr || '').toUpperCase();
  switch (normalized) {
    case 'ACTIVE':
      return ScheduleStatusEnum.ACTIVE;
    case 'INACTIVE':
      return ScheduleStatusEnum.INACTIVE;
    case 'CANCELLED':
      return ScheduleStatusEnum.CANCELLED;
    default:
      return ScheduleStatusEnum.PENDING;
  }
}

/**
 * Parse calendar from YAML data
 */
function parseCalendar(data: any): ScheduleCalendar {
  if (!data || typeof data !== 'object') {
    return createEmptyCalendar();
  }

  return {
    monday: Boolean(data.monday),
    tuesday: Boolean(data.tuesday),
    wednesday: Boolean(data.wednesday),
    thursday: Boolean(data.thursday),
    friday: Boolean(data.friday),
    saturday: Boolean(data.saturday),
    sunday: Boolean(data.sunday),
  };
}

/**
 * Parse schedule stops from YAML data
 */
function parseScheduleStops(data: any): ScheduleStop[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((wrapper: any, index: number) => {
    const stopData = wrapper.stop || wrapper;
    return parseScheduleStop(stopData, index);
  });
}

/**
 * Parse a single schedule stop from YAML data
 */
function parseScheduleStop(data: any, defaultOrder: number): ScheduleStop {
  const stop: ScheduleStop = {
    stopId: String(data.stop_id || ''),
    stopName: data.stop_name ? String(data.stop_name) : undefined,
    stopOrder: data.stop_order !== undefined ? Number(data.stop_order) : defaultOrder,
    arrivalTime: data.arrival_time ? String(data.arrival_time) : undefined,
    departureTime: data.departure_time ? String(data.departure_time) : undefined,
  };

  // Add ID if exists
  if (data.id) {
    stop.id = String(data.id);
  }

  return stop;
}

/**
 * Parse exceptions from YAML data
 */
function parseExceptions(data: any): ScheduleException[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((wrapper: any) => {
    const excData = wrapper.exception || wrapper;
    return parseException(excData);
  });
}

/**
 * Parse a single exception from YAML data
 */
function parseException(data: any): ScheduleException {
  const exception: ScheduleException = {
    id: `exc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exceptionDate: String(data.exception_date || ''),
    exceptionType: parseExceptionType(data.exception_type),
    description: data.description ? String(data.description) : undefined,
  };

  return exception;
}

/**
 * Parse exception type from string
 */
function parseExceptionType(typeStr: string | undefined): ExceptionTypeEnum {
  const normalized = (typeStr || '').toUpperCase();
  if (normalized === 'ADDED') {
    return ExceptionTypeEnum.ADDED;
  }
  return ExceptionTypeEnum.REMOVED;
}

// ============================================================================
// MERGE HELPERS
// ============================================================================

/**
 * Merge parsed schedules with current route context.
 * This ensures route information is preserved when updating from YAML.
 */
export function mergeSchedulesWithRouteContext(
  parsedSchedules: Schedule[],
  currentData: ScheduleWorkspaceData
): Schedule[] {
  return parsedSchedules.map((schedule, index) => {
    // Get existing schedule if available (for preserving IDs during edit)
    const existingSchedule = currentData.schedules[index];
    
    // Merge route info from current context
    const mergedSchedule: Schedule = {
      ...schedule,
      routeId: schedule.routeId || currentData.selectedRouteId || '',
      routeName: schedule.routeName || currentData.selectedRouteName || '',
      routeGroupId: schedule.routeGroupId || currentData.selectedRouteGroupId || '',
      routeGroupName: schedule.routeGroupName || currentData.selectedRouteGroupName || '',
    };

    // Preserve existing schedule ID if not provided in YAML
    if (!mergedSchedule.id && existingSchedule?.id) {
      mergedSchedule.id = existingSchedule.id;
    }

    // Merge schedule stops with route stops for complete stop information
    if (currentData.routeStops.length > 0) {
      mergedSchedule.scheduleStops = mergeStopsWithRouteStops(
        schedule.scheduleStops,
        currentData.routeStops,
        existingSchedule?.scheduleStops
      );
    }

    return mergedSchedule;
  });
}

/**
 * Merge parsed schedule stops with route stops to ensure completeness.
 * Preserves timing data from YAML while ensuring all route stops are included.
 */
function mergeStopsWithRouteStops(
  parsedStops: ScheduleStop[],
  routeStops: ScheduleWorkspaceData['routeStops'],
  existingStops?: ScheduleStop[]
): ScheduleStop[] {
  // Create a map of parsed stops by stopOrder for quick lookup
  const parsedStopsByOrder = new Map<number, ScheduleStop>();
  const parsedStopsByStopId = new Map<string, ScheduleStop>();
  
  parsedStops.forEach(stop => {
    parsedStopsByOrder.set(stop.stopOrder, stop);
    if (stop.stopId) {
      parsedStopsByStopId.set(stop.stopId, stop);
    }
  });

  // Create map of existing stops for ID preservation
  const existingStopsByOrder = new Map<number, ScheduleStop>();
  (existingStops || []).forEach(stop => {
    existingStopsByOrder.set(stop.stopOrder, stop);
  });

  // Build complete stops array based on route stops
  return routeStops.map(routeStop => {
    // Find matching parsed stop
    let matchingStop = parsedStopsByOrder.get(routeStop.stopOrder);
    if (!matchingStop && routeStop.id) {
      matchingStop = parsedStopsByStopId.get(routeStop.id);
    }

    // Find existing stop for ID preservation
    const existingStop = existingStopsByOrder.get(routeStop.stopOrder);

    return {
      id: matchingStop?.id || existingStop?.id,
      stopId: routeStop.id,
      stopName: routeStop.name,
      stopOrder: routeStop.stopOrder,
      arrivalTime: matchingStop?.arrivalTime || '',
      departureTime: matchingStop?.departureTime || '',
    };
  });
}

// ============================================================================
// YAML EXAMPLE GENERATOR
// ============================================================================

/**
 * Generate example YAML structure for reference
 */
export function generateExampleYaml(): string {
  return `# Schedule Workspace YAML Format
# Edit schedules below - changes sync with Form Mode in real-time

schedule_workspace:
  route_id: ""  # (read-only - set via route selection)
  route_name: ""
  route_group_id: ""
  route_group_name: ""
  
  schedules:
    - schedule:
        name: "Morning Express"
        schedule_type: REGULAR  # REGULAR or SPECIAL
        status: PENDING  # PENDING, ACTIVE, INACTIVE, or CANCELLED
        description: "Weekday morning service"
        
        effective_start_date: "2024-01-01"
        effective_end_date: ""  # Leave empty for indefinite
        
        generate_trips: true
        
        calendar:
          monday: true
          tuesday: true
          wednesday: true
          thursday: true
          friday: true
          saturday: false
          sunday: false
        
        stops:
          - stop:
              stop_order: 0
              arrival_time: "06:00"
              departure_time: "06:02"
          - stop:
              stop_order: 1
              arrival_time: "06:15"
              departure_time: "06:16"
        
        exceptions:
          - exception:
              exception_date: "2024-12-25"
              exception_type: REMOVED  # ADDED or REMOVED
              description: "Christmas Day"
`;
}

// ============================================================================
// JSON SERIALIZATION (Data -> JSON)
// ============================================================================

/**
 * Serialize ScheduleWorkspaceData to JSON format
 */
export function serializeSchedulesToJson(data: ScheduleWorkspaceData): string {
  const jsonData = {
    schedule_workspace: {
      // Route information (read-only context)
      route_id: data.selectedRouteId || '',
      route_name: data.selectedRouteName || '',
      route_group_id: data.selectedRouteGroupId || '',
      route_group_name: data.selectedRouteGroupName || '',
      
      // Schedules array
      schedules: data.schedules.map((schedule, index) => 
        serializeScheduleToJson(schedule, index)
      ),
    }
  };

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Serialize a single schedule to JSON-friendly object
 */
function serializeScheduleToJson(schedule: Schedule, index: number): any {
  const scheduleObj: any = {
    // Metadata
    name: schedule.name || `Schedule ${index + 1}`,
    schedule_type: schedule.scheduleType || 'REGULAR',
    status: schedule.status || 'PENDING',
    description: schedule.description || '',
    
    // Dates
    effective_start_date: schedule.effectiveStartDate || '',
    effective_end_date: schedule.effectiveEndDate || '',
    
    // Options
    generate_trips: schedule.generateTrips ?? false,
    
    // Calendar (operating days)
    calendar: {
      monday: schedule.calendar.monday,
      tuesday: schedule.calendar.tuesday,
      wednesday: schedule.calendar.wednesday,
      thursday: schedule.calendar.thursday,
      friday: schedule.calendar.friday,
      saturday: schedule.calendar.saturday,
      sunday: schedule.calendar.sunday,
    },
    
    // Schedule stops with timings
    stops: schedule.scheduleStops.map(stop => ({
      stop_id: stop.stopId || '',
      stop_name: stop.stopName || '',
      stop_order: stop.stopOrder,
      ...(stop.arrivalTime && { arrival_time: stop.arrivalTime }),
      ...(stop.departureTime && { departure_time: stop.departureTime }),
      ...(stop.id && { id: stop.id }),
    })),
    
    // Exceptions
    exceptions: schedule.exceptions.map(exc => ({
      exception_date: exc.exceptionDate || '',
      exception_type: exc.exceptionType || 'REMOVED',
      ...(exc.description && { description: exc.description }),
    })),
  };

  // Add ID if exists (for edit mode)
  if (schedule.id) {
    scheduleObj.id = schedule.id;
  }

  return { schedule: scheduleObj };
}

// ============================================================================
// JSON DESERIALIZATION (JSON -> Data)
// ============================================================================

/**
 * Parse JSON format to partial ScheduleWorkspaceData
 * 
 * Note: This only updates schedules data, not the route selection or available routes.
 * The route context is maintained from the current workspace state.
 */
export function parseSchedulesFromJson(jsonText: string): { 
  schedules: Schedule[];
  error?: string;
} {
  try {
    if (!jsonText.trim()) {
      return { schedules: [], error: 'Empty JSON content' };
    }

    const parsed = JSON.parse(jsonText);
    
    if (!parsed || typeof parsed !== 'object') {
      return { schedules: [], error: 'Invalid JSON structure' };
    }

    // Handle schedule_workspace wrapper
    const workspaceData = parsed.schedule_workspace;
    if (!workspaceData) {
      return { schedules: [], error: 'Missing schedule_workspace root element' };
    }

    // Parse schedules array
    const schedulesArray = workspaceData.schedules;
    if (!schedulesArray || !Array.isArray(schedulesArray)) {
      return { schedules: [], error: 'Missing or invalid schedules array' };
    }

    const schedules: Schedule[] = schedulesArray.map((wrapper: any, index: number) => {
      const scheduleData = wrapper.schedule || wrapper;
      return parseScheduleFromJson(scheduleData, index);
    });

    return { schedules };
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return { 
      schedules: [], 
      error: error instanceof Error ? error.message : 'Failed to parse JSON' 
    };
  }
}

/**
 * Parse a single schedule from JSON data
 */
function parseScheduleFromJson(data: any, index: number): Schedule {
  const calendar = parseCalendarFromJson(data.calendar);
  const scheduleStops = parseScheduleStopsFromJson(data.stops);
  const exceptions = parseExceptionsFromJson(data.exceptions);

  const schedule: Schedule = {
    name: String(data.name || `Schedule ${index + 1}`),
    routeId: String(data.route_id || ''),
    routeName: data.route_name ? String(data.route_name) : undefined,
    routeGroupId: data.route_group_id ? String(data.route_group_id) : undefined,
    routeGroupName: data.route_group_name ? String(data.route_group_name) : undefined,
    scheduleType: parseScheduleType(data.schedule_type),
    effectiveStartDate: String(data.effective_start_date || new Date().toISOString().split('T')[0]),
    effectiveEndDate: data.effective_end_date ? String(data.effective_end_date) : undefined,
    status: parseScheduleStatus(data.status),
    description: data.description ? String(data.description) : undefined,
    generateTrips: data.generate_trips !== false,
    scheduleStops,
    calendar,
    exceptions,
  };

  // Add ID if exists
  if (data.id) {
    schedule.id = String(data.id);
  }

  return schedule;
}

/**
 * Parse calendar from JSON data
 */
function parseCalendarFromJson(data: any): ScheduleCalendar {
  if (!data || typeof data !== 'object') {
    return createEmptyCalendar();
  }

  return {
    monday: Boolean(data.monday),
    tuesday: Boolean(data.tuesday),
    wednesday: Boolean(data.wednesday),
    thursday: Boolean(data.thursday),
    friday: Boolean(data.friday),
    saturday: Boolean(data.saturday),
    sunday: Boolean(data.sunday),
  };
}

/**
 * Parse schedule stops from JSON data
 */
function parseScheduleStopsFromJson(data: any): ScheduleStop[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((stopData: any, index: number) => {
    // Handle both wrapped {stop: ...} and direct format
    const stop = stopData.stop || stopData;
    return parseScheduleStopFromJson(stop, index);
  });
}

/**
 * Parse a single schedule stop from JSON data
 */
function parseScheduleStopFromJson(data: any, defaultOrder: number): ScheduleStop {
  const stop: ScheduleStop = {
    stopId: String(data.stop_id || ''),
    stopName: data.stop_name ? String(data.stop_name) : undefined,
    stopOrder: data.stop_order !== undefined ? Number(data.stop_order) : defaultOrder,
    arrivalTime: data.arrival_time ? String(data.arrival_time) : undefined,
    departureTime: data.departure_time ? String(data.departure_time) : undefined,
  };

  // Add ID if exists
  if (data.id) {
    stop.id = String(data.id);
  }

  return stop;
}

/**
 * Parse exceptions from JSON data
 */
function parseExceptionsFromJson(data: any): ScheduleException[] {
  if (!data || !Array.isArray(data)) {
    return [];
  }

  return data.map((excData: any) => {
    // Handle both wrapped {exception: ...} and direct format
    const exc = excData.exception || excData;
    return parseExceptionFromJson(exc);
  });
}

/**
 * Parse a single exception from JSON data
 */
function parseExceptionFromJson(data: any): ScheduleException {
  const exception: ScheduleException = {
    id: `exc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exceptionDate: String(data.exception_date || ''),
    exceptionType: parseExceptionType(data.exception_type),
    description: data.description ? String(data.description) : undefined,
  };

  return exception;
}

// ============================================================================
// JSON EXAMPLE GENERATOR
// ============================================================================

/**
 * Generate example JSON structure for reference
 */
export function generateExampleJson(): string {
  const example = {
    schedule_workspace: {
      route_id: "",
      route_name: "",
      route_group_id: "",
      route_group_name: "",
      schedules: [
        {
          schedule: {
            name: "Morning Express",
            schedule_type: "REGULAR",
            status: "PENDING",
            description: "Weekday morning service",
            effective_start_date: "2024-01-01",
            effective_end_date: "",
            generate_trips: true,
            calendar: {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: false,
              sunday: false
            },
            stops: [
              {
                stop_order: 0,
                arrival_time: "06:00",
                departure_time: "06:02"
              },
              {
                stop_order: 1,
                arrival_time: "06:15",
                departure_time: "06:16"
              }
            ],
            exceptions: [
              {
                exception_date: "2024-12-25",
                exception_type: "REMOVED",
                description: "Christmas Day"
              }
            ]
          }
        }
      ]
    }
  };

  return JSON.stringify(example, null, 2);
}
