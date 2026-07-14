import { logoutSession } from "@/lib/auth/session";
import { clearCachedAccessToken } from "@/lib/api/setup";

export default async function signOut() {
    try {
        await logoutSession();
    } finally {
        clearCachedAccessToken();
        window.location.href = '/';
    }
}
