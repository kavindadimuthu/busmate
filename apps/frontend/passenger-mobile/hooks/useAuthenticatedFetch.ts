import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

export const useAuthenticatedFetch = () => {
  const { accessToken, signOut } = useAuth();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle unauthorized responses
    if (response.status === 401) {
      await signOut();
      throw new Error('Authentication expired. Please login again.');
    }

    return response;
  }, [accessToken, signOut]);

  return { authenticatedFetch };
};