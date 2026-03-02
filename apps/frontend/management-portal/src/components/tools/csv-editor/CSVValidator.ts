import { CSVData, CSVRow, ValidationError, ValidationResult, ValidationRule } from './types';

// Bus stop specific validation rules
export const BUS_STOP_VALIDATION_RULES: ValidationRule[] = [
  // At least one name field is required
  {
    column: 'name',
    required: false, // We'll handle this with custom validator
    type: 'string',
    minLength: 2,
    maxLength: 100,
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      // Check if at least one name field exists
      const hasName = row.name || row.name_sinhala || row.name_tamil;
      if (!hasName) {
        return 'At least one name field (name, name_sinhala, or name_tamil) is required';
      }
      return null;
    }
  },
  {
    column: 'name_sinhala',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'name_tamil',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'description',
    type: 'string',
    maxLength: 500
  },
  {
    column: 'latitude',
    type: 'number',
    min: -90,
    max: 90,
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'number') {
        // Sri Lanka latitude range approximately
        if (value < 5.9 || value > 9.9) {
          return 'Latitude should be within Sri Lanka\'s range (5.9 to 9.9)';
        }
      }
      return null;
    }
  },
  {
    column: 'longitude',
    type: 'number',
    min: -180,
    max: 180,
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'number') {
        // Sri Lanka longitude range approximately
        if (value < 79.6 || value > 81.9) {
          return 'Longitude should be within Sri Lanka\'s range (79.6 to 81.9)';
        }
      }
      return null;
    }
  },
  {
    column: 'address',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'address_sinhala',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'address_tamil',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'city',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'city_sinhala',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'city_tamil',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'state',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'state_sinhala',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'state_tamil',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'country',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'country_sinhala',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'country_tamil',
    type: 'string',
    maxLength: 100
  },
  {
    column: 'zipCode',
    type: 'string',
    maxLength: 20,
    pattern: /^[A-Z0-9\s-]*$/i,
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        // Basic Sri Lankan postal code validation (5 digits)
        if (!/^\d{5}$/.test(value.trim())) {
          return 'Zip code should be a 5-digit number for Sri Lanka';
        }
      }
      return null;
    }
  },
  {
    column: 'isAccessible',
    type: 'boolean'
  }
];

// Route specific validation rules
export const ROUTE_VALIDATION_RULES: ValidationRule[] = [
  // Route Group fields
  {
    column: 'route_group_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_group_name_sinhala',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_group_name_tamil',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_group_description',
    type: 'string',
    maxLength: 500
  },
  
  // Route fields
  {
    column: 'route_name',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_name_sinhala',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_name_tamil',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'route_number',
    type: 'string',
    maxLength: 20,
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        // Route number should be alphanumeric
        if (!/^[A-Z0-9\-\/]+$/i.test(value.trim())) {
          return 'Route number should contain only letters, numbers, hyphens, and forward slashes';
        }
      }
      return null;
    }
  },
  {
    column: 'route_description',
    type: 'string',
    maxLength: 500
  },
  {
    column: 'road_type',
    type: 'string',
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        const validRoadTypes = ['NORMALWAY', 'EXPRESSWAY'];
        if (!validRoadTypes.includes(value.toUpperCase())) {
          return 'Road type must be either NORMALWAY or EXPRESSWAY';
        }
      }
      return null;
    }
  },
  {
    column: 'route_through',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'route_through_sinhala',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'route_through_tamil',
    type: 'string',
    maxLength: 255
  },
  {
    column: 'direction',
    type: 'string',
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        const validDirections = ['OUTBOUND', 'INBOUND'];
        if (!validDirections.includes(value.toUpperCase())) {
          return 'Direction must be either OUTBOUND or INBOUND';
        }
      }
      return null;
    }
  },
  {
    column: 'distance_km',
    type: 'number',
    min: 0.1,
    max: 1000
  },
  {
    column: 'estimated_duration_minutes',
    type: 'number',
    min: 1,
    max: 1440 // 24 hours max
  },

  // Start/End stop references  
  {
    column: 'start_stop_id',
    type: 'string',
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value.trim())) {
          return 'Start stop ID should be a valid UUID format';
        }
      }
      return null;
    }
  },
  {
    column: 'end_stop_id',
    type: 'string',
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value.trim())) {
          return 'End stop ID should be a valid UUID format';
        }
      }
      return null;
    }
  },

  // Route stops fields
  {
    column: 'stop_order',
    required: true,
    type: 'number',
    min: 0,
    max: 999
  },
  {
    column: 'stop_id',
    type: 'string',
    customValidator: (value: any, row: CSVRow, rowIndex: number) => {
      if (value && typeof value === 'string') {
        // Basic UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value.trim())) {
          return 'Stop ID should be a valid UUID format';
        }
      }
      return null;
    }
  },
  {
    column: 'stop_name_english',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'stop_name_sinhala',
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  {
    column: 'distance_from_start_km',
    type: 'number',
    min: 0,
    max: 1000
  }
];

export function validateCSVData(data: CSVData, rules: ValidationRule[] = BUS_STOP_VALIDATION_RULES): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate headers
  const requiredColumns = rules.filter(rule => rule.required).map(rule => rule.column);
  const missingRequiredColumns = requiredColumns.filter(col => !data.headers.includes(col));
  
  if (missingRequiredColumns.length > 0) {
    missingRequiredColumns.forEach(column => {
      errors.push({
        row: -1, // Header row
        column,
        message: `Required column '${column}' is missing`,
        severity: 'error'
      });
    });
  }

  // Check for unknown columns (warning only)
  const knownColumns = rules.map(rule => rule.column);
  const unknownColumns = data.headers.filter(header => !knownColumns.includes(header));
  unknownColumns.forEach(column => {
    warnings.push({
      row: -1,
      column,
      message: `Unknown column '${column}' will be ignored during import`,
      severity: 'warning'
    });
  });

  // Validate rows
  data.rows.forEach((row, rowIndex) => {
    rules.forEach(rule => {
      const value = row[rule.column];
      const columnErrors = validateValue(value, rule, row, rowIndex);
      errors.push(...columnErrors.filter(e => e.severity === 'error'));
      warnings.push(...columnErrors.filter(e => e.severity === 'warning'));
    });

    // Additional row-level validations
    validateRowIntegrity(row, rowIndex, rules).forEach(error => {
      if (error.severity === 'error') {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function validateValue(value: any, rule: ValidationRule, row: CSVRow, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Skip validation for empty values unless required
  if (value === '' || value === null || value === undefined) {
    if (rule.required) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} is required`,
        severity: 'error'
      });
    }
    return errors;
  }

  // Type validation
  if (rule.type) {
    const typeError = validateType(value, rule.type);
    if (typeError) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: typeError,
        severity: 'error'
      });
      return errors; // Don't continue if type is wrong
    }
  }

  // String validations
  if (rule.type === 'string' && typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} must be at least ${rule.minLength} characters`,
        severity: 'error'
      });
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} must not exceed ${rule.maxLength} characters`,
        severity: 'error'
      });
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} format is invalid`,
        severity: 'error'
      });
    }
  }

  // Number validations
  if (rule.type === 'number' && typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} must be at least ${rule.min}`,
        severity: 'error'
      });
    }
    
    if (rule.max !== undefined && value > rule.max) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: `${rule.column} must not exceed ${rule.max}`,
        severity: 'error'
      });
    }
  }

  // Custom validation
  if (rule.customValidator) {
    const customError = rule.customValidator(value, row, rowIndex);
    if (customError) {
      errors.push({
        row: rowIndex,
        column: rule.column,
        message: customError,
        severity: 'error'
      });
    }
  }

  return errors;
}

function validateType(value: any, expectedType: string): string | null {
  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        return 'Must be a text value';
      }
      break;
    
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Must be a valid number';
      }
      break;
    
    case 'boolean':
      if (typeof value !== 'boolean') {
        return 'Must be true or false';
      }
      break;
    
    case 'email':
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Must be a valid email address';
      }
      break;
    
    case 'url':
      if (typeof value !== 'string') {
        return 'Must be a valid URL';
      }
      try {
        new URL(value);
      } catch {
        return 'Must be a valid URL';
      }
      break;
  }
  
  return null;
}

function validateRowIntegrity(row: CSVRow, rowIndex: number, rules: ValidationRule[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Determine the validation context based on rules
  const ruleColumns = rules.map(rule => rule.column);
  const isBusStopValidation = ruleColumns.includes('name') || ruleColumns.includes('latitude');
  const isRouteValidation = ruleColumns.includes('route_group_name') || ruleColumns.includes('route_name');

  if (isBusStopValidation) {
    // Bus stop specific validations
    
    // Check for coordinate consistency
    const hasLatitude = row.latitude !== undefined && row.latitude !== '';
    const hasLongitude = row.longitude !== undefined && row.longitude !== '';
    
    if (hasLatitude && !hasLongitude) {
      errors.push({
        row: rowIndex,
        column: 'longitude',
        message: 'Longitude is required when latitude is provided',
        severity: 'error'
      });
    }
    
    if (hasLongitude && !hasLatitude) {
      errors.push({
        row: rowIndex,
        column: 'latitude',
        message: 'Latitude is required when longitude is provided',
        severity: 'error'
      });
    }

    // Check for name requirement (at least one name field)
    const hasAnyName = row.name || row.name_sinhala || row.name_tamil;
    if (!hasAnyName) {
      errors.push({
        row: rowIndex,
        column: 'name',
        message: 'At least one name field (name, name_sinhala, or name_tamil) is required',
        severity: 'error'
      });
    }

    // Warn about missing location information
    if (!hasLatitude && !hasLongitude && !row.address && !row.city) {
      errors.push({
        row: rowIndex,
        column: 'address',
        message: 'Consider providing either coordinates (lat/lng) or address information for better location accuracy',
        severity: 'warning'
      });
    }
  } else if (isRouteValidation) {
    // Route specific validations
    
    // Validate that route data has required route fields
    if (!row.route_group_name) {
      errors.push({
        row: rowIndex,
        column: 'route_group_name',
        message: 'Route group name is required for route import',
        severity: 'error'
      });
    }
    
    if (!row.route_name) {
      errors.push({
        row: rowIndex,
        column: 'route_name',
        message: 'Route name is required for route import',
        severity: 'error'
      });
    }
    
    if (!row.stop_name_english) {
      errors.push({
        row: rowIndex,
        column: 'stop_name_english',
        message: 'Stop name (English) is required for route import',
        severity: 'error'
      });
    }
    
    // Check for logical consistency in route data
    if (row.stop_order !== undefined && typeof row.stop_order === 'number' && row.stop_order < 0) {
      errors.push({
        row: rowIndex,
        column: 'stop_order',
        message: 'Stop order cannot be negative',
        severity: 'error'
      });
    }
    
    if (row.distance_from_start_km !== undefined && typeof row.distance_from_start_km === 'number' && row.distance_from_start_km < 0) {
      errors.push({
        row: rowIndex,
        column: 'distance_from_start_km',
        message: 'Distance from start cannot be negative',
        severity: 'error'
      });
    }
    
    // Warn about missing optional route information
    if (!row.route_description && !row.route_through) {
      errors.push({
        row: rowIndex,
        column: 'route_description',
        message: 'Consider providing route description or route through information for better route details',
        severity: 'warning'
      });
    }
  }

  return errors;
}

// Utility function to get validation summary
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'All data is valid and ready for import';
  }
  
  const parts = [];
  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`);
  }
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' and ') + ' found';
}