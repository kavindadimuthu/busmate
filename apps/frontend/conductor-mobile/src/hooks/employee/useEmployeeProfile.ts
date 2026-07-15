import { useAuth } from '@/hooks/auth/useAuth';
import { UsersControllerService } from '@busmate/api-client-user';
import { extractErrorMessage } from '@/lib/auth/errorMessage';
import { useCallback, useState } from 'react';

type UpdateProfileData = {
  fullName?: string;
  phoneNumber?: string;
};

export const useEmployeeProfile = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setError('No user ID found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await refreshUser();
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to load profile');
      setError(errorMessage);
      console.error('Error fetching conductor profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    if (!user?.id) {
      setError('No user ID found');
      return { success: false, error: 'No user ID found' };
    }

    try {
      setIsLoading(true);
      setError(null);

      await UsersControllerService.updateUser(user.id, data);
      await refreshUser();

      return { success: true };
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Failed to update profile');
      setError(errorMessage);
      console.error('Error updating conductor profile:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    fetchProfile,
    updateProfile,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
