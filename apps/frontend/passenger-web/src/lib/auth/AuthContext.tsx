import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthControllerService, type AuthMeResponse, type RegisterRequest } from "@busmate/api-client-user";
import { clearSession, getAccessToken, hasStoredSession, saveSession } from "./tokenStore";

interface AuthContextValue {
  user: AuthMeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await AuthControllerService.me();
    setUser(me);
  }, []);

  useEffect(() => {
    if (!hasStoredSession()) {
      setIsLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await AuthControllerService.login({ email, password });
      saveSession(result.accessToken!, result.refreshToken!, Number(result.expiresIn));
      await refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(async (data: RegisterRequest) => {
    await AuthControllerService.register(data);
  }, []);

  const logout = useCallback(async () => {
    if (getAccessToken()) {
      // Must start before the session is cleared: the client reads the token from storage when it
      // builds the request, so clearing first sends the logout unauthenticated and the server
      // session survives. Bounded so a dead network cannot keep the passenger signed in here.
      const revoke = AuthControllerService.logout().catch(() => undefined);
      await Promise.race([revoke, new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
