import UserData from "@/types/UserData";
import { cookies } from "next/headers";
import { getDecodedAccessToken } from "./getDecodedAccessToken";
import { ACCESS_TOKEN_COOKIE, getGatewayUrl } from "@/lib/auth/session";

/**
 * Utility function to fetch user data for the authenticated session.
 * This is used in server components to get user information for rendering.
 */
export async function getUserData(): Promise<UserData | null> {
  try {
    const payload = await getDecodedAccessToken();
    if (!payload) {
      return null;
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!accessToken) {
      return null;
    }

    const res = await fetch(`${getGatewayUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }

    const me = await res.json();
    const nameParts = String(me.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;

    return {
      id: me.userId ?? payload.sub,
      email: me.email || payload.email || "",
      user_role: me.userType || payload.app_metadata?.user_type || "user",
      username: me.username || me.email || "Unknown User",
      firstName,
      lastName,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
