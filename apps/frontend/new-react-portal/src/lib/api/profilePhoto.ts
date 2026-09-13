'use client';

// Client-side data layer for profile photos (INC-005). Goes through api-gateway like every
// other browser-facing call in this app.
import { ApiError, OpenAPI as UserManagementAPI, UsersControllerService } from '@busmate/api-client-user';
import { AdminApiError } from './adminUsers';
import { fetchAccessToken } from './setup';

/**
 * Uploads a replacement photo. Uses the generated client, which produces a correct
 * multipart body now that the endpoint declares what it actually consumes.
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<void> {
  try {
    await UsersControllerService.uploadProfilePhoto(userId, { file });
  } catch (error) {
    if (error instanceof ApiError) {
      const bodyMessage =
        error.body && typeof error.body === 'object'
          ? (error.body as Record<string, unknown>).error
          : undefined;
      throw new AdminApiError(
        error.status,
        typeof bodyMessage === 'string' ? bodyMessage : 'The photo could not be uploaded.',
      );
    }
    throw new AdminApiError(0, 'Unable to reach the server. Please check your connection.');
  }
}

/**
 * Fetches the photo itself, deliberately not through the generated client: its response
 * handling reads anything that isn't JSON with {@code response.text()}, which decodes image
 * bytes as text and corrupts them. That is a limitation of the code generator rather than of
 * the contract, so this is the one call that has to be made by hand.
 *
 * <p>Returns null when the user has no photo, which is an ordinary state rather than a
 * failure — the caller shows initials instead.
 */
export async function fetchProfilePhotoBlob(userId: string): Promise<Blob | null> {
  const token = await fetchAccessToken();

  let response: Response;
  try {
    response = await fetch(`${UserManagementAPI.BASE}/api/users/${userId}/profile/photo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AdminApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new AdminApiError(response.status, 'The photo could not be loaded.');
  }
  return response.blob();
}
