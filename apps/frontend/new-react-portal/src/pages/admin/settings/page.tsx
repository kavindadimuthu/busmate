'use client';

import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSetPageMetadata } from '@/context/PageContext';
import { SettingsTabs } from '@/components/admin/settings/SettingsTabs';
import type { SettingsTab } from '@/components/admin/settings/SettingsTabs';
import {
  GeneralSettingsPanel,
  ApiSettingsPanel,
  MaintenanceSettingsPanel,
  BackupSettingsPanel,
} from '@/components/admin/settings';

// ── Constants ────────────────────────────────────────────────────

const VALID_TABS = new Set<string>(['general', 'api', 'maintenance', 'backup']);
const DEFAULT_TAB: SettingsTab = 'general';

// ── Inner component (reads searchParams) ─────────────────────────

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useSetPageMetadata({
    title: 'System Settings',
    description: 'Configure general settings, API, maintenance, and backup options',
    activeItem: 'settings',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Settings' }],
  });

  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab =
    rawTab && VALID_TABS.has(rawTab) ? (rawTab as SettingsTab) : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.push(`/admin/settings?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      <SettingsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'general' && <GeneralSettingsPanel />}
      {activeTab === 'api' && <ApiSettingsPanel />}
      {activeTab === 'maintenance' && <MaintenanceSettingsPanel />}
      {activeTab === 'backup' && <BackupSettingsPanel />}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageContent />
    </Suspense>
  );
}
