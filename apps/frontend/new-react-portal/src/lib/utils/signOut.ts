import { logoutSession } from "@/lib/auth/session";
import { clearCachedAccessToken } from "@/lib/api/setup";
import { clearPhotoCache } from "@/lib/api/profilePhotoCache";

export default async function signOut() {
    try {
        await logoutSession();
    } finally {
        clearCachedAccessToken();
        // The reload below also discards it; cleared explicitly so photos fetched under this
        // session cannot outlive it if sign-out ever stops reloading the page.
        clearPhotoCache();
        window.location.href = '/';
    }
}
