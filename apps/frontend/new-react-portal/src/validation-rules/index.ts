/**
 * Validation Rules Entry Point
 * 
 * Import validation functions from this file for convenience
 */

// Types
export type { 
  ValidationResult, 
  ValidationResultWithWarnings,
  ValidationRule,
  FieldValidationConfig,
  DetailedValidationError,
  DetailedValidationResult,
} from './types';

export { ValidationSeverity } from './types';

// Schedule Validation
export { 
  validateSchedule,
  validateMultipleSchedules,
  areAllSchedulesValid,
  getValidationConfig as getScheduleValidationConfig,
  validateConfig as validateScheduleConfig,
  SCHEDULE_VALIDATION_CONFIG,
} from './scheduleValidation';

// Re-export for backward compatibility
export { validateSchedule as isScheduleValid } from './scheduleValidation';
