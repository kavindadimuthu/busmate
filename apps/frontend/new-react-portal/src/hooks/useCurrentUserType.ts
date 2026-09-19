'use client';

import { useEffect, useState } from 'react';
import { fetchAccessToken } from '@/lib/api/setup';

/**
 * The signed-in user's role (JWT `app_metadata.user_type`), lower-cased, decoded client-side from the
 * same access token the API clients use. UI-convenience only — it decides what to show, never what is
 * allowed: the backend enforces every rule (for example, only MOT may mark a record official).
 */
export function useCurrentUserType(): string | null {
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAccessToken()
      .then((token) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const type = payload?.app_metadata?.user_type;
          setUserType(typeof type === 'string' ? type.toLowerCase() : null);
        } catch {
          setUserType(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUserType(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return userType;
}
