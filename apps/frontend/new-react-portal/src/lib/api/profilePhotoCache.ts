'use client';

// Session-wide cache of profile photos, keyed by user id (INC-006).
//
// A list re-renders on every sort, filter and page change, and the gateway allows 100 requests a
// minute per client for everything. So each person's photo is fetched at most once per session,
// concurrent requests for the same person share one fetch, and "this person has no photo" is
// remembered as firmly as a photo is — otherwise every photo-less row costs a request per render.
//
// Each person holds at most one object URL, reused wherever they appear. It is released when it is
// replaced and when the cache is cleared at sign-out, so memory is bounded by the number of distinct
// people viewed rather than by how much the user navigates.
import { fetchProfilePhotoBlob } from './profilePhoto';

type Entry = { state: 'loading' } | { state: 'ready'; url: string | null };

const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();
// Only the newest request for a person may write their entry, so a slow early fetch cannot
// overwrite a fresher one made after an upload.
const latestRequest = new Map<string, number>();
// Bumped on sign-out; a fetch started under a previous session is discarded when it lands.
let session = 0;

function notify(userId: string): void {
  listeners.get(userId)?.forEach((listener) => listener());
}

function beginRequest(userId: string): number {
  const request = (latestRequest.get(userId) ?? 0) + 1;
  latestRequest.set(userId, request);
  return request;
}

function isCurrent(userId: string, request: number, startedIn: number): boolean {
  return startedIn === session && latestRequest.get(userId) === request;
}

function setReady(userId: string, url: string | null): void {
  const previous = entries.get(userId);
  if (previous?.state === 'ready' && previous.url && previous.url !== url) {
    URL.revokeObjectURL(previous.url);
  }
  entries.set(userId, { state: 'ready', url });
  notify(userId);
}

async function fetchIntoCache(userId: string): Promise<void> {
  const request = beginRequest(userId);
  const startedIn = session;
  let blob: Blob | null;
  try {
    blob = await fetchProfilePhotoBlob(userId);
  } catch {
    // Not cached, so a later mount retries; the avatar shows its fallback meanwhile.
    if (isCurrent(userId, request, startedIn) && entries.get(userId)?.state === 'loading') {
      entries.delete(userId);
      notify(userId);
    }
    return;
  }
  // Checked before creating an object URL, so a discarded result cannot leak one.
  if (!isCurrent(userId, request, startedIn)) return;
  setReady(userId, blob ? URL.createObjectURL(blob) : null);
}

export function ensurePhotoLoaded(userId: string): void {
  if (entries.has(userId) || inflight.has(userId)) return;
  entries.set(userId, { state: 'loading' });
  const run = fetchIntoCache(userId).finally(() => {
    if (inflight.get(userId) === run) inflight.delete(userId);
  });
  inflight.set(userId, run);
}

/**
 * Re-fetches one person's photo and swaps it in only once the new one has arrived, so a
 * replacement never blinks back to the fallback. Used after an upload.
 */
export async function refreshPhoto(userId: string): Promise<void> {
  await fetchIntoCache(userId);
}

export function readPhotoSnapshot(userId: string): string | null {
  const entry = entries.get(userId);
  return entry?.state === 'ready' ? entry.url : null;
}

export function subscribePhoto(userId: string, listener: () => void): () => void {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(userId);
  };
}

/** Called at sign-out: nothing fetched under one session may be shown in the next. */
export function clearPhotoCache(): void {
  session += 1;
  const known = [...entries.keys()];
  for (const entry of entries.values()) {
    if (entry.state === 'ready' && entry.url) URL.revokeObjectURL(entry.url);
  }
  entries.clear();
  inflight.clear();
  latestRequest.clear();
  known.forEach(notify);
}
