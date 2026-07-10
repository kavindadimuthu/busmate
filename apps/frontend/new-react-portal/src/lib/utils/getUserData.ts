import UserData from "@/types/UserData";
import { fetchCurrentUser } from "@/lib/auth/session";

export async function getUserData(): Promise<UserData | null> {
  try {
    const me = await fetchCurrentUser();
    const nameParts = String(me.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || undefined;

    return {
      id: me.userId,
      email: me.email,
      user_role: me.userType,
      username: me.username || me.email || "Unknown User",
      firstName,
      lastName,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
