import { ACCESS_TOKEN_STORAGE_KEY, clearSession, logoutSession } from "@/lib/auth/session";

export default async function signOut() {
    try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
        if (accessToken) {
            await logoutSession(accessToken);
        }
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        clearSession();
        window.location.href = '/';
    }
}
