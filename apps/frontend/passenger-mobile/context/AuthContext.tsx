import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthControllerService } from '@/lib/api-client/user-management/services/AuthControllerService';
import { OpenAPI } from '@/lib/api-client/user-management/core/OpenAPI';

// Real API User type based on the actual response
type AuthUser = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    email?: string;
    email_verified?: boolean;
    phone_verified?: boolean;
    sub?: string;
    user_role?: string;
  };
  identities?: any[];
  created_at?: string;
  updated_at?: string;
  is_anonymous?: boolean;
  app_role?: string;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: AuthUser;
  weak_password?: {
    message: string;
    reasons: string[];
  } | null;
};

// App User type for internal use
type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  role: string;
  app_role: string;
  memberSince: string;
  emailVerified: boolean;
  dob?: string;
  address?: string;
  city?: string;
  totalTrips: number;
  savedRoutes: number;
  walletBalance: number;
  travelCardNumber?: string;
  travelCardStatus: string;
  language: string;
  upcomingTrips: any[];
  recentTickets: any[];
  favoriteRoutes: any[];
  recentRoutes: any[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing login
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        const storedUser = await AsyncStorage.getItem('user_data');
        const expiresAt = await AsyncStorage.getItem('token_expires_at');
        
        if (storedToken && storedUser && expiresAt) {
          // Check if token is still valid
          const isExpired = Date.now() / 1000 >= parseInt(expiresAt);
          
          if (!isExpired) {
            // Set the token for API client
            OpenAPI.TOKEN = storedToken;
            setAccessToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token expired, clear stored data
            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'token_expires_at', 'user_data']);
          }
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Clear invalid stored data
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'token_expires_at', 'user_data']);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('Login request endpoint:', `${OpenAPI.BASE}/api/auth/login`);

      // Use the OpenAPI generated client for login
      const authData = await AuthControllerService.login({
        email,
        password,
      }) as AuthResponse;
      
      // Check for weak password warning
      if (authData.weak_password) {
        console.warn('Weak password detected:', authData.weak_password.message);
      }

      // Store authentication data
      await AsyncStorage.setItem('access_token', authData.access_token);
      await AsyncStorage.setItem('refresh_token', authData.refresh_token);
      await AsyncStorage.setItem('token_expires_at', authData.expires_at.toString());
      
      // Transform auth user to our app user format
      const userData: User = {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.email?.split('@')[0] || authData.user.email.split('@')[0],
        phone: authData.user.phone || '',
        role: authData.user.role,
        app_role: authData.user.app_role || authData.user.user_metadata?.user_role || 'Passenger',
        emailVerified: authData.user.user_metadata?.email_verified || false,
        memberSince: authData.user.created_at || authData.user.email_confirmed_at || new Date().toISOString(),
        totalTrips: 0, // Initialize with default values - these would come from other API calls
        savedRoutes: 0,
        walletBalance: 0,
        travelCardStatus: 'none',
        language: 'en',
        upcomingTrips: [],
        recentTickets: [],
        favoriteRoutes: [],
        recentRoutes: []
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Set the access token for future API calls
      OpenAPI.TOKEN = authData.access_token;
      
      setAccessToken(authData.access_token);
      setUser(userData);
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Login error:', error);
      // Handle API client errors
      if (error.status) {
        switch (error.status) {
          case 400:
            return { success: false, error: 'Invalid email or password format' };
          case 401:
            return { success: false, error: 'Invalid email or password' };
          case 404:
            return { success: false, error: 'User not found' };
          case 500:
            return { success: false, error: 'Server error. Please try again later.' };
          default:
            return { success: false, error: 'Login failed. Please try again.' };
        }
      }
      
      if (
        error.message?.includes('Network') ||
        error.message?.includes('fetch') ||
        error.message?.includes('timed out') ||
        error.name === 'AbortError'
      ) {
        return {
          success: false,
          error: `Cannot reach user service at ${OpenAPI.BASE}. Check that the backend is running and reachable from this phone.`,
        };
      }
      
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
      
      if (!storedRefreshToken) {
        await signOut();
        return false;
      }

      // You would implement refresh token logic here when the API supports it
      // For now, we'll just check if the current token is still valid
      const expiresAt = await AsyncStorage.getItem('token_expires_at');
      if (expiresAt && Date.now() / 1000 < parseInt(expiresAt)) {
        return true;
      }

      // Token expired, need to re-authenticate
      await signOut();
      return false;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      await signOut();
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Clear all stored authentication data
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token', 
        'token_expires_at',
        'user_data'
      ]);
      
      // Clear the API client token
      OpenAPI.TOKEN = undefined;
      
      setAccessToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<void> => {
    try {
      if (!user) return;
      
      // Update the user state with new profile data
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      
      // Update AsyncStorage with the new user data
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Error updating user profile in context:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated,
      accessToken,
      signIn, 
      signOut,
      refreshToken,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
