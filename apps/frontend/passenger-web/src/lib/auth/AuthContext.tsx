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
    const accessToken = getAccessToken();
    clearSession();
    setUser(null);
    if (accessToken) {
      try {
        await AuthControllerService.logout(`Bearer ${accessToken}`);
      } catch {
        // Best-effort — the local session is already cleared either way.
      }
    }
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
