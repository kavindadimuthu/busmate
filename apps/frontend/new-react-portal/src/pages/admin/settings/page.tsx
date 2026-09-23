'use client';

import { useSetPageMetadata } from '@/context/PageContext';
import { OperationsNotWired } from '@/components/admin/OperationsNotWired';

export default function SettingsPage() {
  useSetPageMetadata({
    title: 'System Settings',
    description: 'Platform configuration',
    activeItem: 'settings',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Settings' }],
  });

  return (
    <OperationsNotWired
      what="Platform configuration, a maintenance-mode switch and backup status will live here once each one has something behind it."
      where="Nothing on this page was ever connected, including the panels that appeared to schedule downtime and to trigger a backup."
    />
  );
}
