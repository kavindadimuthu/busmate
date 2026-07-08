'use client';

import { useEffect, useState } from 'react';
import { listUsers, MANAGED_USER_TYPES } from '@/lib/api/adminUsers';
import type { ManagedUserType } from '@/lib/api/adminUsers';

/**
 * Per-type total counts for the tab badges. Fetched once — activating/deactivating a
 * user never changes which type they belong to, so these only go stale on user
 * creation, at which point the page is navigated away from anyway.
 */
export function useUserTypeCounts(): Record<ManagedUserType, number> | null {
  const [counts, setCounts] = useState<Record<ManagedUserType, number> | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      MANAGED_USER_TYPES.map((type) => listUsers({ userType: type, size: 1 }).catch(() => null)),
    ).then((pages) => {
      if (cancelled) return;
      const next = {} as Record<ManagedUserType, number>;
      MANAGED_USER_TYPES.forEach((type, i) => {
        next[type] = pages[i]?.totalElements ?? 0;
      });
      setCounts(next);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
}
