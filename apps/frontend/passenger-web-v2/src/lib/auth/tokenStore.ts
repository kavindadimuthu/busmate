import { AuthControllerService, OpenAPI as UserAPI } from "@busmate/api-client-user";
import { OpenAPI as TicketingAPI } from "@busmate/api-client-ticketing";
import { OpenAPI as RouteAPI } from "@busmate/api-client-core";

// Same keys and behaviour as passenger-web's tokenStore (INC-065): tokens in localStorage,
// refreshed shortly before they expire. Moving to httpOnly cookies is a separate, reviewed change.
const ACCESS_TOKEN_KEY = "busmate.auth.accessToken";
const REFRESH_TOKEN_KEY = "busmate.auth.refreshToken";
const EXPIRES_AT_KEY = "busmate.auth.expiresAt";

// Refresh a bit before actual expiry so an in-flight request never races an
// access token that's about to be rejected by the gateway.
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

let pendingRefresh: Promise<string> | null = null;

export function saveSession(accessToken: string, refreshToken: string, expiresInSeconds: number): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
}

export function hasStoredSession(): boolean {
  return !!localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return "";
  }

  if (!pendingRefresh) {
    pendingRefresh = AuthControllerService.refresh({ refreshToken })
      .then((response) => {
        saveSession(response.accessToken!, response.refreshToken!, Number(response.expiresIn));
        return response.accessToken!;
      })
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

/** Installed as the generated clients' TOKEN resolver, so it runs before every request and a
 * near-expiry access token is refreshed first. */
export async function resolveAccessToken(): Promise<string> {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) ?? 0);

  if (accessToken && Date.now() < expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
    return accessToken;
  }

  try {
    return await refreshAccessToken();
  } catch {
    return "";
  }
}

export function installApiTokenResolver(): void {
  UserAPI.TOKEN = resolveAccessToken;
  // Booking needs the passenger's own identity (ticketing-service reads it from the gateway's
  // x-user-id header, which only exists when a real bearer token is forwarded).
  TicketingAPI.TOKEN = resolveAccessToken;
  RouteAPI.TOKEN = resolveAccessToken;
}
