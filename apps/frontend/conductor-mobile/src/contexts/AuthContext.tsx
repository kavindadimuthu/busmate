import { AuthControllerService, type AuthMeResponse } from '@/lib/api-client/user-management';
import { clearSession, getAccessToken, hasStoredSession, saveSession } from '@/lib/auth/tokenStore';
import { extractErrorMessage } from '@/lib/auth/errorMessage';
import { BiometricAuthResult, User } from '@/types/auth';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useEffect, useState } from 'react';

type AuthResult = { success: boolean; error?: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  restoreSession: () => Promise<AuthResult>;
  isBiometricSupported: boolean;
  hasBiometricCredentials: boolean;
  authenticateWithBiometrics: () => Promise<BiometricAuthResult>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Identity fields (name/email/phone/role/accountStatus) are real, sourced
// from user-service via the API gateway. busId/route aren't part of a
// conductor's identity — they're populated per-trip via useOngoingTrip.
function toAppUser(me: AuthMeResponse, previous?: User | null): User {
  return {
    id: me.userId!,
    name: me.fullName || me.username || me.email?.split('@')[0] || 'Conductor',
    email: me.email || '',
    role: 'conductor',
    fullName: me.fullName,
    username: me.username,
    contactNumber: me.phoneNumber,
    busId: previous?.busId,
    route: previous?.route,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);

  const refreshUser = async (): Promise<void> => {
    const me = await AuthControllerService.me();
    if (me.userType !== 'conductor') {
      await clearSession();
      setUser(null);
      throw new Error('Not a conductor account');
    }
    setUser((previous) => toAppUser(me, previous));
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      setIsBiometricSupported(compatible && enrolled);
      setHasBiometricCredentials(enrolled);
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setIsBiometricSupported(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          (async () => {
            if (await hasStoredSession()) {
              await refreshUser();
            }
          })(),
          checkBiometricSupport(),
        ]);
      } catch (error) {
        console.error('Failed to restore session:', error);
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const result = await AuthControllerService.login({ email, password });
      if (result.userType !== 'conductor') {
        return { success: false, error: 'This app is for conductors only. Please contact your operator if you believe this is a mistake.' };
      }
      await saveSession(result.accessToken!, result.refreshToken!, Number(result.expiresIn));
      await refreshUser();
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: extractErrorMessage(error, 'Invalid email or password.') };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const token = await getAccessToken();
    await clearSession();
    setUser(null);

    if (token) {
      try {
        await AuthControllerService.logout(`Bearer ${token}`);
      } catch {
        // Best-effort — the local session is already cleared either way.
      }
    }
  };

  // Used after biometric device-level authentication succeeds: restores the
  // previously saved session rather than re-collecting a password.
  const restoreSession = async (): Promise<AuthResult> => {
    try {
      if (!(await hasStoredSession())) {
        return { success: false, error: 'No saved session found. Please login with email and password first.' };
      }
      await refreshUser();
      return { success: true };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return { success: false, error: 'Your saved session is no longer valid. Please login again.' };
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
      }
      return { success: false, error: 'Biometric authentication failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Biometric authentication error',
      };
    }
  };

  const isAuthenticated = !!user && user.role === 'conductor';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        restoreSession,
        isBiometricSupported,
        hasBiometricCredentials,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
