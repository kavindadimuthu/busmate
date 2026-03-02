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
  const logId = params.id as string;

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
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <FileWarning className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Log Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The log entry with ID &quot;{logId}&quot; could not be found.
        </p>
        <button
          onClick={() => router.push('/admin/logs')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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
