// Base API Response structure
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Common API Error
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
