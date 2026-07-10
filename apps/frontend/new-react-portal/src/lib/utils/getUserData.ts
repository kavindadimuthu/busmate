import UserData from "@/types/UserData";
import { ACCESS_TOKEN_STORAGE_KEY, getGatewayUrl } from "@/lib/auth/session";
import { getDecodedAccessToken } from "./getDecodedAccessToken";

export async function getUserData(): Promise<UserData | null> {
  try {
    const payload = await getDecodedAccessToken();
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

    if (!payload || !accessToken) {
      return null;
    }

    const res = await fetch(`${getGatewayUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return {
        id: payload.sub,
        email: payload.email || "",
        user_role: payload.app_metadata?.user_type || "user",
        username: payload.email || "Unknown User",
      };
    }

    const me = await res.json();
    const nameParts = String(me.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || undefined;

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
