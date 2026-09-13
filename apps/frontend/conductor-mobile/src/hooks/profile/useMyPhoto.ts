import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/auth/useAuth';
import { uploadPhoto } from '@/lib/api/profilePhoto';
import { ensurePhotoLoaded, readPhotoSnapshot, refreshPhoto, subscribePhoto } from '@/lib/api/photoCache';

export type PhotoSource = 'library' | 'camera';

interface UseMyPhotoResult {
  /** A data URI to display, or null when this conductor has no photo yet. */
  photoUri: string | null;
  uploading: boolean;
  /** Set when a change the conductor just attempted failed — never for a missing photo. */
  error: string | null;
  clearError: () => void;
  /** Returns true when the photo was changed; false when cancelled, refused or rejected. */
  changePhoto: (source: PhotoSource) => Promise<boolean>;
}

export function useMyPhoto(): UseMyPhotoResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const subscribe = useCallback(
    (listener: () => void) => (userId ? subscribePhoto(userId, listener) : () => {}),
    [userId],
  );
  const photoUri = useSyncExternalStore(
    subscribe,
    () => (userId ? readPhotoSnapshot(userId) : null),
    () => null,
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) ensurePhotoLoaded(userId);
  }, [userId]);

  const changePhoto = useCallback(
    async (source: PhotoSource): Promise<boolean> => {
      if (!userId) return false;
      setError(null);

      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        // Said out loud rather than swallowed: a refused permission otherwise looks like a dead button.
        setError(
          source === 'camera'
            ? 'BusMate needs permission to use the camera. You can allow it in your phone settings.'
            : 'BusMate needs permission to open your photos. You can allow it in your phone settings.',
        );
        return false;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets?.[0]) return false;

      const asset = result.assets[0];
      setUploading(true);
      try {
        await uploadPhoto(userId, {
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName,
          file: (asset as { file?: File }).file,
        });
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'The photo could not be uploaded.');
        return false;
      } finally {
        setUploading(false);
      }

      // Re-read rather than showing the picked file: the server stores a re-encoded copy, and this
      // updates every screen showing this conductor at once.
      await refreshPhoto(userId);
      return true;
    },
    [userId],
  );

  const clearError = useCallback(() => setError(null), []);

  return { photoUri, uploading, error, clearError, changePhoto };
}
