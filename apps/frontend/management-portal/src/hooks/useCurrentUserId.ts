'use client';

import { useEffect, useState } from 'react';
import { fetchAccessToken } from '@/lib/api/setup';

/**
 * The signed-in user's own userId (JWT `sub` claim), decoded client-side from the same
 * access token the API clients already use. UI-convenience only (e.g. disabling
 * "deactivate my own account") — not a security boundary, the backend enforces that.
 */
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAccessToken()
      .then((token) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserId(typeof payload.sub === 'string' ? payload.sub : null);
        } catch {
          setUserId(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUserId(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}
