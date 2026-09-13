'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { ensurePhotoLoaded, readPhotoSnapshot, subscribePhoto } from '@/lib/api/profilePhotoCache';

/**
 * The object URL of a user's photo from the session cache, or null while unknown or when they have
 * none. Rendering this for the same person in many places costs one request in total.
 */
export function useUserPhotoSrc(userId?: string | null): string | null {
  const subscribe = useCallback(
    (listener: () => void) => (userId ? subscribePhoto(userId, listener) : () => {}),
    [userId],
  );
  const src = useSyncExternalStore(
    subscribe,
    () => (userId ? readPhotoSnapshot(userId) : null),
    () => null,
  );

  useEffect(() => {
    if (userId) ensurePhotoLoaded(userId);
  }, [userId]);

  return src;
}
