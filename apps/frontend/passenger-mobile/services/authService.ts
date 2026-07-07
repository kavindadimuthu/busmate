import { userServiceEndpoints } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
    app_role?: string;
    email_confirmed_at?: string;
    phone?: string;
    user_metadata?: {
      email_verified?: boolean;
      user_role?: string;
    };
  };
  weak_password?: {
    message: string;
    reasons: string[];
  };
}

export class AuthService {
  static async login(credentials: AuthRequest): Promise<AuthResponse> {
    const response = await fetch(userServiceEndpoints.login, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  static async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token');
  }

  static async isTokenExpired(): Promise<boolean> {
    const expiresAt = await AsyncStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    return Date.now() / 1000 >= parseInt(expiresAt);
  }

  static async clearStoredAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      'access_token',
      'refresh_token',
      'token_expires_at',
      'user_data'
    ]);
  }
}