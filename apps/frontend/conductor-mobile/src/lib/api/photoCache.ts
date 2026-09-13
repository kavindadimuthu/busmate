import { fetchPhotoDataUri } from './profilePhoto';

// One photo per person for the life of the session (INC-007). The home header, the profile tab and
// the edit screen all show the same conductor, so they share one fetch rather than making three.
// Cleared at sign-out: a second conductor signing in on the same phone must never see the first
// one's face.

type Entry = { state: 'loading' } | { state: 'ready'; uri: string | null };

const entries = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<() => void>>();
const latestRequest = new Map<string, number>();
let session = 0;

function notify(userId: string): void {
  listeners.get(userId)?.forEach((listener) => listener());
}

async function load(userId: string): Promise<void> {
  const request = (latestRequest.get(userId) ?? 0) + 1;
  latestRequest.set(userId, request);
  const startedIn = session;

  let uri: string | null;
  try {
    uri = await fetchPhotoDataUri(userId);
  } catch {
    // Not remembered, so the next screen retries; the initials show meanwhile.
    if (startedIn === session && latestRequest.get(userId) === request) {
      entries.delete(userId);
      notify(userId);
    }
    return;
  }

  if (startedIn !== session || latestRequest.get(userId) !== request) return;
  entries.set(userId, { state: 'ready', uri });
  notify(userId);
}

export function ensurePhotoLoaded(userId: string): void {
  if (entries.has(userId) || inflight.has(userId)) return;
  entries.set(userId, { state: 'loading' });
  const run = load(userId).finally(() => {
    if (inflight.get(userId) === run) inflight.delete(userId);
  });
  inflight.set(userId, run);
}

/** Re-reads one person's photo after a change, so every screen showing them updates at once. */
export async function refreshPhoto(userId: string): Promise<void> {
  await load(userId);
}

export function readPhotoSnapshot(userId: string): string | null {
  const entry = entries.get(userId);
  return entry?.state === 'ready' ? entry.uri : null;
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

export function clearPhotoCache(): void {
  session += 1;
  const known = [...entries.keys()];
  entries.clear();
  inflight.clear();
  latestRequest.clear();
  known.forEach(notify);
}
