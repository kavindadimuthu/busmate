import { LoginRequest, LoginResponse } from '@/types/auth';
import { apiClient } from '../apiClient';

export const authApi = {
  // Login - User Management Service
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiClient.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, 'user');
  },

  // Refresh token - User Management Service
  refreshToken: async (): Promise<{ access_token: string }> => {
    return apiClient.authenticatedRequest<{ access_token: string }>('/auth/refresh', {
      method: 'POST',
    }, 'user');
  },

  // Logout - User Management Service
  logout: async (): Promise<void> => {
    return apiClient.authenticatedRequest<void>('/auth/logout', {
      method: 'POST',
    }, 'user');
  },

  // Validate token - User Management Service
  validateToken: async (): Promise<{ valid: boolean; user?: any }> => {
    return apiClient.authenticatedRequest<{ valid: boolean; user?: any }>('/auth/validate', {}, 'user');
  },
};
