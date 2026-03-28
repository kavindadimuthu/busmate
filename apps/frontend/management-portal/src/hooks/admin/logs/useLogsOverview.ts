'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getLogStats,
  getUserActivityLogs,
  getSecurityLogs,
  getApplicationLogs,
} from '@/data/admin';

export function useLogsOverview() {
  const router = useRouter();

  const stats = useMemo(() => getLogStats(), []);

  const recentUserActivity = useMemo(() => getUserActivityLogs(5), []);

  const recentSecurity = useMemo(
    () =>
      getSecurityLogs()
        .filter((l) => l.severity === 'critical' || l.severity === 'high')
        .slice(0, 5),
    []
  );

  const recentErrors = useMemo(
    () => getApplicationLogs().filter((l) => l.level === 'ERROR').slice(0, 5),
    []
  );

  return {
    stats,
    recentUserActivity,
    recentSecurity,
    recentErrors,
    navigateToSecurity: () => router.push('/admin/logs/listing?tab=security'),
    navigateToApplication: () => router.push('/admin/logs/listing?tab=application'),
    navigateToActivity: () => router.push('/admin/logs/listing?tab=user-activity'),
    navigateToLog: (id: string) => router.push(`/admin/logs/${id}`),
  };
}
