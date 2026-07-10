/**
 * Schedule Workspace Types
 * 
 * These types represent the complete structure for managing schedule data
 * in the Schedule Workspace, including schedules, stops, calendars, and exceptions.
 * Designed to work seamlessly with the route-management-service Schedule APIs.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ScheduleTypeEnum {
  REGULAR = 'REGULAR',
  SPECIAL = 'SPECIAL',
}

export enum ScheduleStatusEnum {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
}

export enum ExceptionTypeEnum {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

// ============================================================================
// SCHEDULE CALENDAR TYPES
// ============================================================================

/**
 * Calendar defining which days of the week the schedule operates
 */
export interface ScheduleCalendar {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

// ============================================================================
// SCHEDULE EXCEPTION TYPES
// ============================================================================

/**
 * Exception date for adding or removing service on specific dates
 */
export interface ScheduleException {
  id?: string; // Client-side ID for UI management
  exceptionDate: string; // YYYY-MM-DD format
  exceptionType: ExceptionTypeEnum;
  description?: string; // UI-only field for notes
}

// ============================================================================
// SCHEDULE STOP TYPES
// ============================================================================

/**
 * Stop timing information within a schedule
 * 
 * IMPORTANT: All route stops should be stored as schedule stops, even if times are not set.
 * This is essential for:
 * 1. Automatic time calculation via database triggers
 * 2. Passenger information querying (Find My Bus feature)
 * 3. Maintaining complete route structure integrity
 * 
 * Times can be undefined/null - the backend will calculate them automatically
 * using triggers based on distance and average speed.
 */
export interface ScheduleStop {
  id?: string; // UUID - used for updates
  stopId: string; // UUID of the bus stop
  stopName?: string; // Display name (populated from route or stop data)
  stopOrder: number; // 0-based order in the route
  arrivalTime?: string; // HH:mm:ss format - can be undefined for automatic calculation
  departureTime?: string; // HH:mm:ss format - can be undefined for automatic calculation
}

// ============================================================================
// SCHEDULE TYPES
// ============================================================================

/**
 * Complete schedule data model for workspace
 */
export interface Schedule {
  id?: string; // UUID - optional for new schedules
  name: string;
  routeId: string; // UUID of the route this schedule belongs to
  routeName?: string; // Display name (populated from route data)
  routeGroupId?: string; // For reference
  routeGroupName?: string; // Display name
  scheduleType: ScheduleTypeEnum;
  effectiveStartDate: string; // YYYY-MM-DD format
  effectiveEndDate?: string; // YYYY-MM-DD format, optional for indefinite
  status: ScheduleStatusEnum;
  description?: string;
  generateTrips?: boolean;
  scheduleStops: ScheduleStop[];
  calendar: ScheduleCalendar;
  exceptions: ScheduleException[];
}

// ============================================================================
// ROUTE REFERENCE TYPES (for route selection)
// ============================================================================

/**
 * Minimal route information for selection dropdown
 */
export interface RouteReference {
  id: string;
  name: string;
  routeGroupId?: string;
  routeGroupName?: string;
  direction?: string;
  startStopName?: string;
  endStopName?: string;
}

/**
 * Stop reference from route for populating schedule stops
 */
export interface RouteStopReference {
  id: string; // Stop ID
  name: string;
  stopOrder: number;
  distanceFromStartKm?: number;
}

// ============================================================================
// WORKSPACE DATA TYPES
// ============================================================================

export interface ScheduleWorkspaceData {
  // Selected route information
  selectedRouteId: string | null;
  selectedRouteName: string | null;
  selectedRouteGroupId: string | null;
  selectedRouteGroupName: string | null;
  
  // All schedules for the selected route
  schedules: Schedule[];
  
  // Currently selected schedule index for editing metadata/exceptions
  activeScheduleIndex: number | null;
  
  // Highlighted schedule index in grid (temporary highlight when selecting from tabs)
  highlightedScheduleIndex: number | null;
  
  // Available routes for selection
  availableRoutes: RouteReference[];
  
  // Route stops when a route is selected (used to build schedule stops)
  routeStops: RouteStopReference[];
  
  // Currently selected stop index for editing
  selectedStopIndex: number | null;
  
  // Currently selected exception index for editing
  selectedExceptionIndex: number | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createEmptyCalendar(): ScheduleCalendar {
  return {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  };
}

export function createEmptyScheduleStop(stopOrder: number): ScheduleStop {
  return {
    stopId: '',
    stopName: '',
    stopOrder,
    // Leave times undefined for automatic calculation by database triggers
    arrivalTime: undefined,
    departureTime: undefined,
  };
}

export function createEmptyException(): ScheduleException {
  return {
    id: `exc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    exceptionDate: '',
    exceptionType: ExceptionTypeEnum.REMOVED,
    description: '',
  };
}

export function createEmptySchedule(): Schedule {
  return {
    name: '',
    routeId: '',
    routeName: '',
    scheduleType: ScheduleTypeEnum.REGULAR,
    effectiveStartDate: new Date().toISOString().split('T')[0],
    effectiveEndDate: '',
    status: ScheduleStatusEnum.PENDING,
    description: '',
    generateTrips: false,
    scheduleStops: [],
    calendar: createEmptyCalendar(),
    exceptions: [],
  };
}

export function createEmptyScheduleWorkspaceData(): ScheduleWorkspaceData {
  return {
    selectedRouteId: null,
    selectedRouteName: null,
    selectedRouteGroupId: null,
    selectedRouteGroupName: null,
    schedules: [],
    activeScheduleIndex: null,
    highlightedScheduleIndex: null,
    availableRoutes: [],
    routeStops: [],
    selectedStopIndex: null,
    selectedExceptionIndex: null,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a schedule has all required fields filled
 * 
 * @deprecated Use validateSchedule from @/validation-rules instead
 * This function is kept for backward compatibility and delegates to the new validation module
 */
export function isScheduleValid(schedule: Schedule): { valid: boolean; errors: string[] } {
  // Import dynamically to avoid circular dependencies
  // The actual validation logic is now in /src/validation-rules/scheduleValidation.ts
  const { validateSchedule } = require('@/validation-rules/scheduleValidation');
  return validateSchedule(schedule);
}

/**
 * @deprecated Old validation logic - now moved to validation-rules directory
 * Kept here for reference only. Use validateSchedule from @/validation-rules instead.
 */
/*
export function isScheduleValid_OLD(schedule: Schedule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schedule.name.trim()) {
    errors.push('Schedule name is required');
  }

  if (!schedule.routeId) {
    errors.push('Route selection is required');
  }

  if (!schedule.effectiveStartDate) {
    errors.push('Start date is required');
  }

  if (schedule.effectiveEndDate && schedule.effectiveStartDate > schedule.effectiveEndDate) {
    errors.push('End date must be after start date');
  }

  if (schedule.scheduleStops.length === 0) {
    errors.push('At least one schedule stop is required');
  }

  // Validate each schedule stop has timing
  const stopsWithoutTiming = schedule.scheduleStops.filter(
    stop => !stop.arrivalTime && !stop.departureTime
  );
  if (stopsWithoutTiming.length > 0) {
    errors.push(`${stopsWithoutTiming.length} stops are missing timing information`);
  }

  // Validate at least one operating day is selected
  const { calendar } = schedule;
  const hasOperatingDay = calendar.monday || calendar.tuesday || calendar.wednesday ||
    calendar.thursday || calendar.friday || calendar.saturday || calendar.sunday;
  if (!hasOperatingDay) {
    errors.push('At least one operating day must be selected');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
*/

// ============================================================================
// API CONVERSION HELPERS
// ============================================================================

/**
 * Converts workspace schedule data to API request format.
 * 
 * IMPORTANT: Now includes ALL schedule stops, even those without times.
 * Times are optional - if not set (null/undefined), the backend database triggers 
 * will calculate them automatically based on distance and average speed.
 * 
 * This ensures:
 * - Complete route structure is maintained in schedule_stop table
 * - Passenger queries (Find My Bus) can access all stops
 * - Automatic time calculation via DB triggers works correctly
 */
export function scheduleToApiRequest(schedule: Schedule): {
  name: string;
  routeId: string;
  scheduleType: 'REGULAR' | 'SPECIAL';
  effectiveStartDate: string;
  effectiveEndDate?: string;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  description?: string;
  generateTrips?: boolean;
  scheduleStops?: {
    id?: string;
    stopId: string;
    stopOrder: number;
    arrivalTime?: string;
    departureTime?: string;
  }[];
  calendar?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  exceptions?: {
    exceptionDate: string;
    exceptionType: 'ADDED' | 'REMOVED';
  }[];
} {
  // Include ALL schedule stops, even those without timing information.
  // This is essential for automatic time calculation via database triggers
  // and passenger information queries.
  // Times can be null - the database will calculate them automatically.
  const allScheduleStops = schedule.scheduleStops
    .map(stop => ({
      id: stop.id,
      stopId: stop.stopId,
      stopOrder: stop.stopOrder,
      // Only include times if they are actually set (not empty string)
      // Otherwise, leave undefined so DB triggers can calculate them
      arrivalTime: stop.arrivalTime && stop.arrivalTime.trim() 
        ? formatTimeForApi(stop.arrivalTime) 
        : undefined,
      departureTime: stop.departureTime && stop.departureTime.trim() 
        ? formatTimeForApi(stop.departureTime) 
        : undefined,
    }));

  return {
    name: schedule.name,
    routeId: schedule.routeId,
    scheduleType: schedule.scheduleType,
    effectiveStartDate: schedule.effectiveStartDate,
    effectiveEndDate: schedule.effectiveEndDate || undefined,
    status: schedule.status,
    description: schedule.description || undefined,
    generateTrips: schedule.generateTrips,
    scheduleStops: allScheduleStops,
    calendar: schedule.calendar,
    exceptions: schedule.exceptions.map(exc => ({
      exceptionDate: exc.exceptionDate,
      exceptionType: exc.exceptionType,
    })),
  };
}

// ============================================================================
// TIME HELPERS
// ============================================================================

/**
 * Formats time string to HH:mm:ss format
 * Handles undefined/null values by returning empty string
 */
export function formatTimeForApi(time: string | undefined): string {
  if (!time) return '';
  
  // If already in HH:mm:ss format
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // If in HH:mm format, add seconds
  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }
  
  return time;
}

/**
 * Formats time string to HH:mm format for display
 * Handles undefined/null values by returning empty string
 */
export function formatTimeForDisplay(time: string | undefined): string {
  if (!time) return '';
  
  // Extract HH:mm from HH:mm:ss
  const match = time.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : time;
}

/**
 * Calculates time offset from first stop
 */
export function calculateTimeOffset(baseTime: string, offsetMinutes: number): string {
  if (!baseTime) return '';
  
  const [hours, minutes] = baseTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + offsetMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Validates all schedules in workspace
 */
export function validateAllSchedules(schedules: Schedule[]): { 
  valid: boolean; 
  invalidCount: number;
  scheduleErrors: { index: number; name: string; errors: string[] }[] 
} {
  const scheduleErrors: { index: number; name: string; errors: string[] }[] = [];
  
  schedules.forEach((schedule, index) => {
    const validation = isScheduleValid(schedule);
    if (!validation.valid) {
      scheduleErrors.push({
        index,
        name: schedule.name || `Schedule ${index + 1}`,
        errors: validation.errors,
      });
    }
  });
  
  return {
    valid: scheduleErrors.length === 0,
    invalidCount: scheduleErrors.length,
    scheduleErrors,
  };
}

/**
 * Gets the first departure time from a schedule (used as identifier in grid)
 */
export function getScheduleStartTime(schedule: Schedule): string {
  if (schedule.scheduleStops.length === 0) return '--:--';
  const firstStop = schedule.scheduleStops[0];
  return formatTimeForDisplay(firstStop.departureTime || firstStop.arrivalTime || '') || '--:--';
}

/**
 * Creates a new schedule with route stops pre-populated
 */
export function createScheduleForRoute(
  routeId: string,
  routeName: string,
  routeGroupId: string,
  routeGroupName: string,
  routeStops: RouteStopReference[],
  scheduleName?: string
): Schedule {
  return {
    name: scheduleName || `New Schedule`,
    routeId,
    routeName,
    routeGroupId,
    routeGroupName,
    scheduleType: ScheduleTypeEnum.REGULAR,
    effectiveStartDate: new Date().toISOString().split('T')[0],
    effectiveEndDate: '',
    status: ScheduleStatusEnum.PENDING,
    description: '',
    generateTrips: false,
    scheduleStops: routeStops.map(stop => ({
      stopId: stop.id,
      stopName: stop.name,
      stopOrder: stop.stopOrder,
      // Leave times undefined for automatic calculation by database triggers
      arrivalTime: undefined,
      departureTime: undefined,
    })),
    calendar: createEmptyCalendar(),
    exceptions: [],
  };
}

// ============================================================================
// API RESPONSE TO WORKSPACE CONVERSION HELPERS
// ============================================================================

// Import types from API client (for type reference only - actual imports should be in the provider)
type ScheduleResponseType = {
  id?: string;
  name?: string;
  description?: string;
  routeId?: string;
  routeName?: string;
  routeGroupId?: string;
  routeGroupName?: string;
  scheduleType?: 'REGULAR' | 'SPECIAL';
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  scheduleStops?: Array<{
    id?: string;
    stopId?: string;
    stopName?: string;
    stopOrder?: number;
    arrivalTime?: string;
    departureTime?: string;
  }>;
  scheduleCalendars?: Array<{
    id?: string;
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
    sunday?: boolean;
  }>;
  scheduleExceptions?: Array<{
    id?: string;
    exceptionDate?: string;
    exceptionType?: 'ADDED' | 'REMOVED';
  }>;
};

type RouteResponseType = {
  id?: string;
  name?: string;
  routeGroupId?: string;
  routeGroupName?: string;
  direction?: string;
  startStopName?: string;
  endStopName?: string;
  routeStops?: Array<{
    id?: string;
    stopId?: string;
    stopName?: string;
    stopOrder?: number;
    distanceFromStartKm?: number;
  }>;
};

/**
 * Converts an API ScheduleResponse to workspace Schedule format
 * Note: This returns schedule with sparse stop data as received from API.
 * Use mergeScheduleWithRouteStops() to populate all route stops.
 */
export function scheduleResponseToWorkspace(response: ScheduleResponseType, routeStops?: RouteStopReference[]): Schedule {
  // Get calendar from first calendar entry (there should only be one)
  const apiCalendar = response.scheduleCalendars?.[0];
  const calendar: ScheduleCalendar = apiCalendar ? {
    monday: apiCalendar.monday ?? false,
    tuesday: apiCalendar.tuesday ?? false,
    wednesday: apiCalendar.wednesday ?? false,
    thursday: apiCalendar.thursday ?? false,
    friday: apiCalendar.friday ?? false,
    saturday: apiCalendar.saturday ?? false,
    sunday: apiCalendar.sunday ?? false,
  } : createEmptyCalendar();

  // Convert schedule stops from API
  // Preserve all schedule stops including those without times (for automatic calculation)
  const apiScheduleStops: ScheduleStop[] = (response.scheduleStops || [])
    .sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0))
    .map(stop => ({
      id: stop.id,
      stopId: stop.stopId || '',
      stopName: stop.stopName || '',
      stopOrder: stop.stopOrder ?? 0,
      // Keep times as undefined if not set (null or empty) for automatic calculation
      arrivalTime: stop.arrivalTime || undefined,
      departureTime: stop.departureTime || undefined,
    }));

  // If route stops are provided, merge schedule timings with all route stops
  let scheduleStops: ScheduleStop[];
  if (routeStops && routeStops.length > 0) {
    scheduleStops = mergeScheduleWithRouteStops(apiScheduleStops, routeStops);
  } else {
    scheduleStops = apiScheduleStops;
  }

  // Convert exceptions
  const exceptions: ScheduleException[] = (response.scheduleExceptions || []).map(exc => ({
    id: exc.id,
    exceptionDate: exc.exceptionDate || '',
    exceptionType: exc.exceptionType === 'ADDED' ? ExceptionTypeEnum.ADDED : ExceptionTypeEnum.REMOVED,
    description: '',
  }));

  return {
    id: response.id,
    name: response.name || '',
    routeId: response.routeId || '',
    routeName: response.routeName || '',
    routeGroupId: response.routeGroupId || '',
    routeGroupName: response.routeGroupName || '',
    scheduleType: response.scheduleType === 'SPECIAL' ? ScheduleTypeEnum.SPECIAL : ScheduleTypeEnum.REGULAR,
    effectiveStartDate: response.effectiveStartDate || '',
    effectiveEndDate: response.effectiveEndDate || '',
    status: (response.status as ScheduleStatusEnum) || ScheduleStatusEnum.PENDING,
    description: response.description || '',
    generateTrips: false,
    scheduleStops,
    calendar,
    exceptions,
  };
}

/**
 * Merges schedule stop timings with full route stops list.
 * This ensures all route stops are shown, with timings populated where available.
 * Matches by stopOrder primarily, and by stopId as fallback.
 */
export function mergeScheduleWithRouteStops(
  scheduleStops: ScheduleStop[],
  routeStops: RouteStopReference[]
): ScheduleStop[] {
  // Create a map of schedule stops by stopOrder for quick lookup
  const scheduleStopsByOrder = new Map<number, ScheduleStop>();
  const scheduleStopsByStopId = new Map<string, ScheduleStop>();
  
  scheduleStops.forEach(stop => {
    scheduleStopsByOrder.set(stop.stopOrder, stop);
    if (stop.stopId) {
      scheduleStopsByStopId.set(stop.stopId, stop);
    }
  });

  // Create schedule stops for ALL route stops, preserving times from API where available
  // and leaving undefined where not set (for automatic calculation)
  return routeStops.map(routeStop => {
    // Try to find matching schedule stop by stopOrder first, then by stopId
    let matchingStop = scheduleStopsByOrder.get(routeStop.stopOrder);
    
    if (!matchingStop && routeStop.id) {
      matchingStop = scheduleStopsByStopId.get(routeStop.id);
    }

    return {
      id: matchingStop?.id,
      stopId: routeStop.id,
      stopName: routeStop.name,
      stopOrder: routeStop.stopOrder,
      // Preserve times from API if available, otherwise leave undefined
      // Empty strings are converted to undefined for consistency
      arrivalTime: matchingStop?.arrivalTime || undefined,
      departureTime: matchingStop?.departureTime || undefined,
    };
  });
}

/**
 * Converts an API RouteResponse to RouteReference format
 */
export function routeResponseToReference(response: RouteResponseType): RouteReference {
  return {
    id: response.id || '',
    name: response.name || '',
    routeGroupId: response.routeGroupId || '',
    routeGroupName: response.routeGroupName || '',
    direction: response.direction || '',
    startStopName: response.startStopName || '',
    endStopName: response.endStopName || '',
  };
}

/**
 * Converts an API RouteResponse's routeStops to RouteStopReference array
 */
export function routeStopsToReferences(routeStops: RouteResponseType['routeStops']): RouteStopReference[] {
  if (!routeStops) return [];
  
  return routeStops
    .sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0))
    .map(stop => ({
      id: stop.stopId || stop.id || '',
      name: stop.stopName || '',
      stopOrder: stop.stopOrder ?? 0,
      distanceFromStartKm: stop.distanceFromStartKm,
    }));
}
