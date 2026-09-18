'use client';

import { OpenAPI as CoreAPI } from '@busmate/api-client-core';
import { fetchAccessToken } from './setup';

/**
 * A bus photo's or document's bytes. Fetched by hand for the same reason as profile photos
 * (lib/api/profilePhoto.ts): the generated client decodes non-JSON bodies as text, which corrupts
 * binary content.
 */
export async function fetchBusMediaBlob(busId: string, mediaId: string): Promise<Blob> {
  const token = await fetchAccessToken();
  const response = await fetch(`${CoreAPI.BASE}/api/buses/${busId}/media/${mediaId}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'The file is missing.' : `The file could not be loaded (${response.status}).`);
  }
  return response.blob();
}

/** Opens a document in a new tab through an object URL, so the auth token never goes in a URL. */
export async function openBusDocument(busId: string, mediaId: string, filename: string): Promise<void> {
  const blob = await fetchBusMediaBlob(busId, mediaId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
