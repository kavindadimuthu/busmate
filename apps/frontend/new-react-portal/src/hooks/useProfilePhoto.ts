'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProfilePhotoBlob, uploadProfilePhoto } from '@/lib/api/profilePhoto';

interface UseProfilePhotoResult {
  /** An object URL to render, or null when this user has no photo. */
  src: string | null;
  loading: boolean;
  /** Only ever set by an upload the user just attempted — a missing photo is not an error. */
  error: string | null;
  uploading: boolean;
  upload: (file: File) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Loads a user's profile photo for display (INC-005).
 *
 * <p>Media is proxied through the gateway and needs an Authorization header, which an
 * {@code <img src>} cannot send — the session lives in an httpOnly cookie the browser will not
 * attach to an image request either. So the bytes are fetched and handed to the image as an
 * object URL instead.
 *
 * <p>Exactly one object URL is alive at a time. The previous one is revoked only once its
 * replacement has arrived, so replacing a photo never blinks back to the initials fallback,
 * and the last one is revoked on unmount so a long-lived session cannot accumulate blobs.
 */
export function useProfilePhoto(userId: string | null): UseProfilePhotoResult {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const liveObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchProfilePhotoBlob(userId)
      .then((blob) => {
        if (cancelled) return;
        const next = blob ? URL.createObjectURL(blob) : null;
        if (liveObjectUrl.current) URL.revokeObjectURL(liveObjectUrl.current);
        liveObjectUrl.current = next;
        setSrc(next);
      })
      .catch(() => {
        // A photo that fails to load falls back to initials rather than surfacing an error:
        // the user did not cause it and there is nothing for them to act on.
        if (!cancelled) setSrc(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  useEffect(
    () => () => {
      if (liveObjectUrl.current) URL.revokeObjectURL(liveObjectUrl.current);
      liveObjectUrl.current = null;
    },
    [],
  );

  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!userId) return false;
      setUploading(true);
      setError(null);
      try {
        await uploadProfilePhoto(userId, file);
        // Re-fetch rather than rendering the chosen file: the server stores a re-encoded copy,
        // so this shows what everyone else will actually see.
        setReloadToken((token) => token + 1);
        return true;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'The photo could not be uploaded.');
        return false;
      } finally {
        setUploading(false);
      }
    },
    [userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { src, loading, error, uploading, upload, clearError };
}
