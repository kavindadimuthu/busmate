export const ACCESS_TOKEN_STORAGE_KEY = "bm_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "bm_refresh_token";

export const ACCESS_TOKEN_COOKIE = ACCESS_TOKEN_STORAGE_KEY;
export const REFRESH_TOKEN_COOKIE = REFRESH_TOKEN_STORAGE_KEY;

const PORTAL_ROLES = ["admin", "mot", "timekeeper", "operator"] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export function isPortalRole(userType: string | null | undefined): userType is PortalRole {
  return !!userType && (PORTAL_ROLES as readonly string[]).includes(userType.toLowerCase());
}

export function getGatewayUrl(): string {
  return import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";
}

export interface GatewaySession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
  userType: string;
}

export class GatewayAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GatewayAuthError";
    this.status = status;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const err = (body as Record<string, unknown>).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && typeof (err as Record<string, unknown>).message === "string") {
      return (err as Record<string, unknown>).message as string;
    }
  }
  return fallback;
}

async function gatewayAuthRequest(path: string, body: unknown): Promise<GatewaySession> {
  let res: Response;
  try {
    res = await fetch(`${getGatewayUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GatewayAuthError(502, "Unable to reach the authentication service");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new GatewayAuthError(res.status, extractErrorMessage(data, "Authentication request failed"));
  }

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: Number(data.expiresIn) || 3600,
    userId: data.userId,
    userType: data.userType,
  };
}

export function loginWithPassword(email: string, password: string): Promise<GatewaySession> {
  return gatewayAuthRequest("/api/auth/login", { email, password });
}

export function refreshSession(refreshToken: string): Promise<GatewaySession> {
  return gatewayAuthRequest("/api/auth/refresh", { refreshToken });
}

export async function logoutSession(accessToken: string): Promise<void> {
  try {
    await fetch(`${getGatewayUrl()}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    console.error("Backend logout call failed:", error);
  }
}

export function storeSession(session: Pick<GatewaySession, "accessToken" | "refreshToken">): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refreshToken);
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}
