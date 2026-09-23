'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { OperationsNotWired } from '@/components/admin/OperationsNotWired';

export default function MonitoringPage() {
  useSetPageMetadata({
    title: 'System Monitoring',
    description: 'Platform health and resource usage',
    activeItem: 'monitoring',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Monitoring' }],
  });

  return (
    <OperationsNotWired what="This page will show whether each BusMate capability is working — ticket validation, trip generation, sign-in, media upload — once there is a real source to read it from." />
  );
}
