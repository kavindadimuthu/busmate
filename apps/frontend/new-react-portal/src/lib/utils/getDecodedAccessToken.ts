import { ACCESS_TOKEN_STORAGE_KEY } from "@/lib/auth/session";
import type { AccessTokenPayload } from "@/types/AccessTokenPayload";

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

export async function getDecodedAccessToken(): Promise<AccessTokenPayload | null> {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const payload = token?.split(".")[1];
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as AccessTokenPayload;
  } catch (error) {
    console.error("Error decoding access token:", error);
    return null;
  }
}
