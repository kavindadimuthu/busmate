import { authApi } from '@/services/api/auth';
import { BiometricAuthResult, User } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useEffect, useState } from 'react';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  isBiometricSupported: boolean;
  hasBiometricCredentials: boolean;
  authenticateWithBiometrics: () => Promise<BiometricAuthResult>;
  // Keep the old method for backward compatibility
  fetchEmployeeDetails: () => Promise<void>;
  saveUserData: (userData: User, accessToken?: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  // Initialize auth on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await Promise.all([
        loadUserData(),
        checkBiometricSupport(),
      ]);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      setIsBiometricSupported(compatible && enrolled);
      setHasBiometricCredentials(enrolled);
      
      console.log('Biometric support:', { compatible, enrolled });
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsBiometricSupported(false);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const [userData, authToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('authToken'),
      ]);
      
      if (userData && authToken) {
        const parsedUser = JSON.parse(userData);
        // Only allow conductor role
        if (parsedUser.role === 'conductor') {
          setUser(parsedUser);
        } else {
          // Clear invalid role data
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('authToken'),
      ]);
      setUser(null);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  };

const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    setIsLoading(true);
    const data = await authApi.login({ email, password });
    
    // Only allow login if app_role is 'Conductor' and access_token exists
    if (data.access_token && data.user?.user_metadata?.user_role === 'Conductor') {
      // Map backend user to frontend User type
      const userData: User = {
        id: data.user.id,
        name: data.user.email, // Use email as name for now, can be updated later
        email: data.user.email,
        role: 'conductor',
        busId: data.user.user_metadata?.busId,
        route: data.user.user_metadata?.route,
        contactNumber: data.user.user_metadata?.contactNumber,
      };
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', data.access_token);
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials or unauthorized role' };
  } catch (error) {
    console.error('Login failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Login failed' 
    };
  } finally {
    setIsLoading(false);
  }
};


  const updateUser = async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API if needed
      // await authApi.logout();
      await clearAuthData();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if API call fails, clear local data
      await clearAuthData();
    }
  };

  const authenticateWithBiometrics = async (): Promise<BiometricAuthResult> => {
    try {
      if (!isBiometricSupported) {
        return { success: false, error: 'Biometric authentication not supported' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Biometric authentication failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Biometric authentication error' 
      };
    }
  };

  // Keep old fetchEmployeeDetails for backward compatibility 
  const fetchEmployeeDetails = async (): Promise<void> => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      
      if (!authToken || !userData) {
        console.error('No auth token or user data found');
        return;
      }

      const parsedUser = JSON.parse(userData);
      
      const response = await fetch(`http://10.22.162.220:8080/api/conductor/profile?userId=${parsedUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const employeeData = await response.json();
        console.log('Employee details:', employeeData);
        
        // Update user with employee details
        const updatedUser: User = {
          ...parsedUser,
          employeeId: employeeData.employee_id,
          fullName: employeeData.fullName,
          name: employeeData.fullName || parsedUser.name,
          username: employeeData.username, 
          busId: employeeData.assign_operator_id,
          route: parsedUser.route,
          contactNumber: employeeData.phoneNumber,
        };
        
        // Save updated user data
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        console.error('Failed to fetch employee details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
    }
  };

  // Backward compatibility method (keep for existing code)
  const saveUserData = async (userData: User, accessToken?: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      if (accessToken) {
        await AsyncStorage.setItem('authToken', accessToken);
      }
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  };

  // Initialize auth on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const isAuthenticated = !!user && user.role === 'conductor';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        isBiometricSupported,
        hasBiometricCredentials,
        authenticateWithBiometrics,
        fetchEmployeeDetails,
        saveUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};