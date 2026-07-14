/**
 * Schedule Validation Rules
 * 
 * This file contains all validation rules for bus schedules.
 * Admins can modify these rules to adjust validation behavior without touching functional code.
 * 
 * @module scheduleValidation
 */

import { ValidationResult } from './types';
import { Schedule, ScheduleCalendar } from '@/types/ScheduleWorkspaceData';

// ============================================================================
// VALIDATION CONFIGURATION
// These values can be adjusted by admins to change validation behavior
// ============================================================================

/**
 * Schedule Validation Configuration
 * Modify these values to adjust validation rules
 */
export const SCHEDULE_VALIDATION_CONFIG = {
  /** Basic field requirements */
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    errorMessage: 'Schedule name is required',
    errorMessageMaxLength: 'Schedule name must not exceed 100 characters',
  },
  
  routeId: {
    required: true,
    errorMessage: 'Route selection is required',
  },
  
  /** Date validation rules */
  dates: {
    startDateRequired: true,
    endDateOptional: true,
    endDateMustBeAfterStart: true,
    errorMessageStartRequired: 'Start date is required',
    errorMessageEndBeforeStart: 'End date must be after start date',
  },
  
  /** Stop timing validation */
  stops: {
    minimumStopsRequired: 2, // At least start and end stops required
    requireStartStopDepartureTime: true, // Start stop must have departure time
    requireEndStopArrivalTime: true, // End stop must have arrival time
    allowIntermediateStopsWithoutTiming: true, // Intermediate stops can be without timing
    allowPartialTimingForIntermediateStops: true, // Intermediate stops can have only arrival OR departure time
    errorMessageMinimumStops: 'At least 2 stops (start and end) are required for a schedule',
    errorMessageStartStopDeparture: 'Start stop must have a departure time',
    errorMessageEndStopArrival: 'End stop must have an arrival time',
  },
  
  /** Calendar (operating days) validation */
  calendar: {
    requireAtLeastOneOperatingDay: true,
    errorMessageNoOperatingDays: 'At least one operating day must be selected',
    // Future: Add specific day requirements (e.g., must include weekdays)
  },
  
  /** Schedule type validation */
  scheduleType: {
    required: true,
    allowedTypes: ['REGULAR', 'SPECIAL'],
    errorMessage: 'Schedule type is required',
  },
  
  /** Status validation */
  status: {
    required: false,
    allowedStatuses: ['PENDING', 'ACTIVE', 'INACTIVE', 'CANCELLED'],
  },
  
  /** Exception date validation */
  exceptions: {
    allowDuplicateDates: false,
    requireFutureExceptions: false, // If true, exception dates must be in the future
    errorMessageDuplicateDate: 'Duplicate exception dates are not allowed',
  },
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// These functions apply the rules defined above
// ============================================================================

/**
 * Validates schedule name
 */
function validateScheduleName(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.name;
  
  if (config.required && !schedule.name.trim()) {
    errors.push(config.errorMessage);
  }
  
  if (schedule.name.trim().length > config.maxLength) {
    errors.push(config.errorMessageMaxLength);
  }
  
  return errors;
}

/**
 * Validates route selection
 */
function validateRouteId(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.routeId;
  
  if (config.required && !schedule.routeId) {
    errors.push(config.errorMessage);
  }
  
  return errors;
}

/**
 * Validates effective dates
 */
function validateDates(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.dates;
  
  if (config.startDateRequired && !schedule.effectiveStartDate) {
    errors.push(config.errorMessageStartRequired);
  }
  
  if (config.endDateMustBeAfterStart && 
      schedule.effectiveEndDate && 
      schedule.effectiveStartDate > schedule.effectiveEndDate) {
    errors.push(config.errorMessageEndBeforeStart);
  }
  
  return errors;
}

/**
 * Validates schedule stops and timing
 */
function validateStops(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.stops;
  
  // Check minimum stops requirement (must have at least start and end stops)
  if (schedule.scheduleStops.length < config.minimumStopsRequired) {
    errors.push(config.errorMessageMinimumStops);
    return errors; // Cannot validate further if minimum stops not met
  }
  
  // Sort stops by stopOrder to identify start and end stops
  const sortedStops = [...schedule.scheduleStops].sort((a, b) => a.stopOrder - b.stopOrder);
  const startStop = sortedStops[0];
  const endStop = sortedStops[sortedStops.length - 1];
  
  // Validate start stop: MUST have departure time (arrival time is optional)
  if (config.requireStartStopDepartureTime) {
    if (!startStop.departureTime) {
      errors.push(config.errorMessageStartStopDeparture);
    }
  }
  
  // Validate end stop: MUST have arrival time (departure time is optional)
  if (config.requireEndStopArrivalTime) {
    if (!endStop.arrivalTime) {
      errors.push(config.errorMessageEndStopArrival);
    }
  }
  
  // Note: Intermediate stops can have:
  // - No timing at all (allowed)
  // - Only arrival time (allowed)
  // - Only departure time (allowed)
  // - Both arrival and departure time (allowed)
  // This is controlled by allowIntermediateStopsWithoutTiming and allowPartialTimingForIntermediateStops
  
  return errors;
}

/**
 * Validates calendar (operating days)
 */
function validateCalendar(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.calendar;
  
  if (config.requireAtLeastOneOperatingDay) {
    const calendar = schedule.calendar;
    const hasOperatingDay = 
      calendar.monday || 
      calendar.tuesday || 
      calendar.wednesday ||
      calendar.thursday || 
      calendar.friday || 
      calendar.saturday || 
      calendar.sunday;
    
    if (!hasOperatingDay) {
      errors.push(config.errorMessageNoOperatingDays);
    }
  }
  
  return errors;
}

/**
 * Validates schedule type
 */
function validateScheduleType(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.scheduleType;
  
  if (config.required && !schedule.scheduleType) {
    errors.push(config.errorMessage);
  }
  
  if (schedule.scheduleType && !config.allowedTypes.includes(schedule.scheduleType)) {
    errors.push(`Invalid schedule type. Allowed types: ${config.allowedTypes.join(', ')}`);
  }
  
  return errors;
}

/**
 * Validates schedule exceptions
 */
function validateExceptions(schedule: Schedule): string[] {
  const errors: string[] = [];
  const config = SCHEDULE_VALIDATION_CONFIG.exceptions;
  
  if (!config.allowDuplicateDates && schedule.exceptions && schedule.exceptions.length > 0) {
    const dates = schedule.exceptions.map(e => e.exceptionDate);
    const uniqueDates = new Set(dates);
    
    if (dates.length !== uniqueDates.size) {
      errors.push(config.errorMessageDuplicateDate);
    }
  }
  
  // Future: Add validation for future exception dates
  if (config.requireFutureExceptions && schedule.exceptions) {
    const today = new Date().toISOString().split('T')[0];
    const pastExceptions = schedule.exceptions.filter(e => e.exceptionDate < today);
    
    if (pastExceptions.length > 0) {
      errors.push(`${pastExceptions.length} exception dates are in the past`);
    }
  }
  
  return errors;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates a complete schedule object
 * 
 * This function runs all validation rules defined in the configuration above.
 * To add new validation rules, create a new validation function and call it here.
 * 
 * @param schedule - The schedule to validate
 * @returns ValidationResult with valid flag and array of error messages
 * 
 * @example
 * ```typescript
 * const result = validateSchedule(mySchedule);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateSchedule(schedule: Schedule): ValidationResult {
  const allErrors: string[] = [
    ...validateScheduleName(schedule),
    ...validateRouteId(schedule),
    ...validateDates(schedule),
    ...validateStops(schedule),
    ...validateCalendar(schedule),
    ...validateScheduleType(schedule),
    ...validateExceptions(schedule),
  ];
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validates multiple schedules at once
 * 
 * @param schedules - Array of schedules to validate
 * @returns Array of validation results, one per schedule
 */
export function validateMultipleSchedules(schedules: Schedule[]): Array<{
  scheduleIndex: number;
  scheduleName: string;
  result: ValidationResult;
}> {
  return schedules.map((schedule, index) => ({
    scheduleIndex: index,
    scheduleName: schedule.name,
    result: validateSchedule(schedule),
  }));
}

/**
 * Quick validation check - returns true if all schedules are valid
 * 
 * @param schedules - Array of schedules to validate
 * @returns true if all schedules are valid
 */
export function areAllSchedulesValid(schedules: Schedule[]): boolean {
  return schedules.every(schedule => validateSchedule(schedule).valid);
}

// ============================================================================
// HELPER FUNCTIONS FOR ADMINS
// ============================================================================

/**
 * Get current validation configuration
 * Useful for admin interfaces to display current rules
 */
export function getValidationConfig() {
  return SCHEDULE_VALIDATION_CONFIG;
}

/**
 * Validate configuration integrity
 * Call this after modifying config to ensure it's valid
 */
export function validateConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check that required error messages are present
  if (!SCHEDULE_VALIDATION_CONFIG.name.errorMessage) {
    issues.push('Name error message is missing');
  }
  
  if (!SCHEDULE_VALIDATION_CONFIG.routeId.errorMessage) {
    issues.push('Route ID error message is missing');
  }
  
  // Check that numeric constraints are valid
  if (SCHEDULE_VALIDATION_CONFIG.name.minLength < 0) {
    issues.push('Name minimum length cannot be negative');
  }
  
  if (SCHEDULE_VALIDATION_CONFIG.stops.minimumStopsRequired < 0) {
    issues.push('Minimum stops required cannot be negative');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
