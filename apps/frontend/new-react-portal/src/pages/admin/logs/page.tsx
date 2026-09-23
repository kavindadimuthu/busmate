'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { OperationsNotWired } from '@/components/admin/OperationsNotWired';

export default function LogsPage() {
  useSetPageMetadata({
    title: 'System Logs',
    description: 'Application and audit logs',
    activeItem: 'logs',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Logs' }],
  });

  return (
    <OperationsNotWired what="Application logs are searchable in Grafana against Loki, correlated by request ID. An audit trail of who changed what belongs here instead, and does not exist yet." />
  );
}
