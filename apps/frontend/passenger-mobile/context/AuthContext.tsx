import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthControllerService,
  type AuthMeResponse,
  type RegisterRequest,
} from '@/lib/api-client/user-management';
import { clearSession, getAccessToken, hasStoredSession, saveSession } from '@/lib/auth/tokenStore';
import { extractErrorMessage } from '@/lib/auth/errorMessage';

// App User type. Identity fields (name/email/phone/role/accountStatus/
// emailVerified) are real, sourced from user-management via the API gateway.
// The trip/wallet/route fields are local placeholders — those services
// aren't wired up yet, matching this app's pre-existing behavior.
type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  role: string;
  app_role: string;
  accountStatus: string;
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

type AuthResult = { success: boolean; error?: string };

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterRequest) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function toAppUser(me: AuthMeResponse, previous?: User | null): User {
  return {
    id: me.userId!,
    email: me.email || '',
    name: me.fullName || me.username || me.email?.split('@')[0] || 'User',
    phone: me.phoneNumber || '',
    role: me.userType || 'passenger',
    app_role: me.userType || 'passenger',
    accountStatus: me.accountStatus || 'unknown',
    emailVerified: !!me.isEmailVerified,
    memberSince: previous?.memberSince || new Date().toISOString(),
    profileImage: previous?.profileImage,
    dob: previous?.dob,
    address: previous?.address,
    city: previous?.city,
    totalTrips: previous?.totalTrips ?? 0,
    savedRoutes: previous?.savedRoutes ?? 0,
    walletBalance: previous?.walletBalance ?? 0,
    travelCardNumber: previous?.travelCardNumber,
    travelCardStatus: previous?.travelCardStatus ?? 'none',
    language: previous?.language ?? 'en',
    upcomingTrips: previous?.upcomingTrips ?? [],
    recentTickets: previous?.recentTickets ?? [],
    favoriteRoutes: previous?.favoriteRoutes ?? [],
    recentRoutes: previous?.recentRoutes ?? [],
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const me = await AuthControllerService.me();
    setUser((previous) => toAppUser(me, previous));
  }, []);

  useEffect(() => {
    // Restore an existing session on app start.
    (async () => {
      try {
        if (!(await hasStoredSession())) {
          return;
        }
        await refreshUser();
        setAccessToken(await getAccessToken());
      } catch (error) {
        console.error('Failed to restore session:', error);
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      const result = await AuthControllerService.login({ email, password });
      await saveSession(result.accessToken!, result.refreshToken!, Number(result.expiresIn));
      setAccessToken(result.accessToken!);
      await refreshUser();
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: extractErrorMessage(error, 'Invalid email or password. Please try again.') };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<AuthResult> => {
    try {
      await AuthControllerService.register(data);
      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: extractErrorMessage(error, 'Could not create your account. Please try again.') };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      await clearSession();
      setAccessToken(null);
      setUser(null);

      if (token) {
        try {
          await AuthControllerService.logout(`Bearer ${token}`);
        } catch {
          // Best-effort — the local session is already cleared either way.
        }
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    // The token resolver in lib/auth/tokenStore.ts refreshes the access
    // token transparently before every request, so this just confirms a
    // usable session still exists (used by screens that want to check
    // up-front rather than wait for a request to fail).
    if (!(await hasStoredSession())) {
      return false;
    }
    try {
      await refreshUser();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await signOut();
      return false;
    }
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<void> => {
    if (!user) return;
    setUser({ ...user, ...profileData });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        accessToken,
        signIn,
        register,
        signOut,
        refreshToken,
        refreshUser,
        updateUserProfile,
      }}
    >
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
