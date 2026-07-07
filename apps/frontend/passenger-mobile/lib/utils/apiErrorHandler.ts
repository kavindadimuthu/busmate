import { Alert } from 'react-native';
import ENV from '../../config/env';

/**
 * Enhanced error handling for API calls
 */
export class ApiErrorHandler {
  static handle(error: any, context?: string) {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
    
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error?.message?.includes('Network request failed')) {
      userMessage = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error?.message?.includes('timeout')) {
      userMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error?.status) {
      switch (error.status) {
        case 401:
          userMessage = 'Authentication failed. Please log in again.';
          break;
        case 403:
          userMessage = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          userMessage = 'The requested resource was not found.';
          break;
        case 500:
          userMessage = 'Server error. Please try again later.';
          break;
        case 503:
          userMessage = 'Service temporarily unavailable. Please try again later.';
          break;
      }
    }
    
    return {
      userMessage,
      originalError: error,
      shouldRetry: this.shouldRetry(error)
    };
  }
  
  static shouldRetry(error: any): boolean {
    // Don't retry for authentication errors or client errors (4xx)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    
    // Retry for network errors and server errors (5xx)
    return true;
  }
  
  static showUserError(error: any, context?: string) {
    const { userMessage } = this.handle(error, context);
    Alert.alert('Error', userMessage);
  }
}

/**
 * Network connectivity checker
 */
export const checkApiConnectivity = async (): Promise<boolean> => {
  try {
    // Simple connectivity check - try to reach one of the API endpoints
    const response = await fetch(`${ENV.API_ENDPOINTS.USER_SERVICE}/health`, {
      method: 'HEAD',
      timeout: 5000,
    } as any);
    
    return response.ok;
  } catch (error) {
    console.warn('API connectivity check failed:', error);
    return false;
  }
};

/**
 * Debug network issues
 */
export const debugNetworkIssues = () => {
  console.log('=== Network Debug Info ===');
  console.log('Environment:', ENV.NODE_ENV);
  console.log('API Endpoints:', ENV.API_ENDPOINTS);
  console.log('=========================');
};