/**
 * Common Types for Validation Rules
 * 
 * These types are shared across all validation modules to ensure consistency
 */

/**
 * Standard validation result format
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validation result with warnings (non-blocking issues)
 */
export interface ValidationResultWithWarnings extends ValidationResult {
  warnings: string[];
}

/**
 * Individual field validation rule
 */
export interface ValidationRule<T = any> {
  /** Rule identifier */
  id: string;
  /** Human-readable error message */
  message: string;
  /** Validation function that returns true if valid */
  validate: (value: T, context?: any) => boolean;
  /** Whether this rule is required or optional */
  required?: boolean;
  /** Priority level (higher = validated first) */
  priority?: number;
}

/**
 * Field validation configuration
 */
export interface FieldValidationConfig {
  /** Field name */
  fieldName: string;
  /** Display label for error messages */
  label: string;
  /** Validation rules to apply */
  rules: ValidationRule[];
}

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Detailed validation error with context
 */
export interface DetailedValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  code?: string;
  context?: Record<string, any>;
}

/**
 * Enhanced validation result with detailed errors
 */
export interface DetailedValidationResult {
  valid: boolean;
  errors: DetailedValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    errorsByField: Record<string, number>;
  };
}
