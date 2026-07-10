// CSV Editor Types
export interface CSVRow {
  [key: string]: string | number | boolean | undefined;
}

export interface CSVData {
  headers: string[];
  rows: CSVRow[];
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}



export interface ValidationRule {
  column: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidator?: (value: any, row: CSVRow, rowIndex: number) => string | null;
}

// Bus Stop specific types
export interface BusStopCSVRow extends CSVRow {
  name?: string;
  name_sinhala?: string;
  name_tamil?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  address_sinhala?: string;
  address_tamil?: string;
  city?: string;
  city_sinhala?: string;
  city_tamil?: string;
  state?: string;
  state_sinhala?: string;
  state_tamil?: string;
  country?: string;
  country_sinhala?: string;
  country_tamil?: string;
  zipCode?: string;
  isAccessible?: boolean;
}

// Route specific types
export interface RouteCSVRow extends CSVRow {
  // Route Group fields
  route_group_name?: string;
  route_group_name_sinhala?: string;
  route_group_name_tamil?: string;
  route_group_description?: string;
  
  // Route fields
  route_name?: string;
  route_name_sinhala?: string;
  route_name_tamil?: string;
  route_number?: string;
  route_description?: string;
  road_type?: string;
  route_through?: string;
  route_through_sinhala?: string;
  route_through_tamil?: string;
  direction?: string;
  distance_km?: number;
  estimated_duration_minutes?: number;
  
  // Start and end stop references
  start_stop_id?: string;
  end_stop_id?: string;
  
  // Route stop fields (for each stop in the route)
  stop_order?: number;
  stop_id?: string;
  stop_name_english?: string;
  stop_name_sinhala?: string;
  distance_from_start_km?: number;
}

// Import configuration types
export type ImportType = 'bus-stops' | 'routes';

export interface ImportConfig {
  type: ImportType;
  validationRules: ValidationRule[];
  requiredColumns: string[];
  templateDownloadFn?: (format: string) => Promise<void>;
  importFn: (data: CSVData, options?: any) => Promise<any>;
  defaultOptions?: any;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isImporting: boolean;
  errors?: Array<{
    row: number;
    message: string;
  }>;
}