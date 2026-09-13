'use client';

import { useCallback, useState } from 'react';
import { uploadProfilePhoto } from '@/lib/api/profilePhoto';
import { refreshPhoto } from '@/lib/api/profilePhotoCache';
import { useUserPhotoSrc } from '@/hooks/useUserPhoto';

interface UseProfilePhotoResult {
  /** An object URL to render, or null when this user has no photo. */
  src: string | null;
  /** Only ever set by an upload the user just attempted — a missing photo is not an error. */
  error: string | null;
  uploading: boolean;
  upload: (file: File) => Promise<boolean>;
  clearError: () => void;
}

/**
 * A user's own photo plus the ability to replace it (INC-005). Reads from the same session cache
 * as every other photo in the portal (INC-006), so the new photo also appears anywhere else that
 * person is already on screen.
 */
export function useProfilePhoto(userId: string | null): UseProfilePhotoResult {
  const src = useUserPhotoSrc(userId);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!userId) return false;
      setUploading(true);
      setError(null);
      try {
        await uploadProfilePhoto(userId, file);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'The photo could not be uploaded.');
        setUploading(false);
        return false;
      }
      // Re-fetch rather than rendering the chosen file: the server stores a re-encoded copy, so
      // this shows what everyone else will actually see.
      await refreshPhoto(userId);
      setUploading(false);
      return true;
    },
    [userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { src, error, uploading, upload, clearError };
}
