// Client-side auth bootstrap shared by both portals. On mount it calls the BFF
// /me endpoint once (which transparently refreshes an expired access token via
// the httpOnly refresh cookie), then holds the resulting user in context. This
// replaces management-portal's server-component getUserData() gating with a
// client bootstrap suitable for a static Vite SPA.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { bffLogin, bffLogout, bffMe, type AuthUser } from './api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const refresh = useCallback(async () => {
    const me = await bffMe();
    setUser(me);
    setStatus(me ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    await bffLogin(email, password);
    // Re-fetch the full profile so context matches what /me returns.
    const me = await bffMe();
    if (!me) {
      throw new Error('Login succeeded but session could not be established');
    }
    setUser(me);
    setStatus('authenticated');
    return me;
  }, []);

  const logout = useCallback(async () => {
    await bffLogout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, refresh }),
    [status, user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
