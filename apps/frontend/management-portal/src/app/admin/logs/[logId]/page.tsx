'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { LogDetailPanel } from '@/components/admin/logs';
import { getLogById, getLogType } from '@/data/admin';
import { FileWarning } from 'lucide-react';

export default function LogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const logId = params.logId as string;

  useSetPageMetadata({
    title: 'Log Detail',
    description: 'View detailed information about a log entry',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Logs', href: '/admin/logs' },
      { label: 'Explorer', href: '/admin/logs/listing' },
      { label: logId },
    ],
  });

  const log = useMemo(() => getLogById(logId), [logId]);
  const logType = useMemo(() => getLogType(logId), [logId]);

  if (!log || !logType) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="p-4 bg-muted rounded-full mb-4">
          <FileWarning className="h-8 w-8 text-muted-foreground/70" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Log Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The log entry with ID &quot;{logId}&quot; could not be found.
        </p>
        <button
          onClick={() => router.push('/admin/logs')}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary transition-colors"
        >
          Back to Logs
        </button>
      </div>
    );
  }

  return (
    <LogDetailPanel
      log={log}
      logType={logType}
      onBack={() => router.back()}
    />
  );
}
