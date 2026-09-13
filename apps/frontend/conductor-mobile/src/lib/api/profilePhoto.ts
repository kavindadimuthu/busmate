import { API_GATEWAY_URL } from '@/config/apiConfig';
import { resolveAccessToken } from '@/lib/auth/tokenStore';

export interface PickedPhoto {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  /** Present only on web, where the picker hands back a real browser file. */
  file?: File | null;
}

function photoUrl(userId: string): string {
  return `${API_GATEWAY_URL}/api/users/${userId}/profile/photo`;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await resolveAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * The photo as a data URI. React Native's Image cannot read a blob URL, and per-request headers
 * work only on a device and not in the web preview, so the bytes are carried inline instead.
 * Returns null when this conductor has no photo, which is an ordinary state rather than a failure.
 */
export async function fetchPhotoDataUri(userId: string): Promise<string | null> {
  const response = await fetch(photoUrl(userId), { headers: await authHeader() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The photo could not be loaded.');

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The photo could not be read.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

/**
 * Written by hand rather than through the generated client: the generator builds multipart bodies
 * only from web file objects and would serialise a phone's file reference as JSON. The endpoint and
 * its rules are the same ones the portal uses.
 */
export async function uploadPhoto(userId: string, photo: PickedPhoto): Promise<void> {
  const form = new FormData();
  if (photo.file) {
    // Web: the picker returns a real file, and appending the phone's shape would send the string
    // "[object Object]" instead.
    form.append('file', photo.file, photo.fileName || photo.file.name || 'profile-photo.jpg');
  } else {
    // React Native takes a file reference in this shape; the cast is what the platform requires,
    // and it is what makes this call impossible to express through the generated client.
    form.append('file', {
      uri: photo.uri,
      name: photo.fileName || 'profile-photo.jpg',
      type: photo.mimeType || 'image/jpeg',
    } as unknown as Blob);
  }

  // Content-Type is deliberately unset so the runtime adds the multipart boundary itself.
  const response = await fetch(photoUrl(userId), {
    method: 'PUT',
    headers: await authHeader(),
    body: form,
  });

  if (!response.ok) {
    throw new Error(await backendMessage(response));
  }
}

async function backendMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = body && typeof body === 'object' ? (body as Record<string, unknown>).error : undefined;
    if (typeof message === 'string') return message;
  } catch {
    // Fall through to the generic message below.
  }
  return response.status === 413
    ? 'That photo is too large.'
    : 'The photo could not be uploaded. Please try again.';
}
