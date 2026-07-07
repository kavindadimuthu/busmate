'use client';

import { Settings, Zap, Wrench, Database } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';

// ── Types ────────────────────────────────────────────────────────

export type SettingsTab = 'general' | 'api' | 'maintenance' | 'backup';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

// ── Component ────────────────────────────────────────────────────

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as SettingsTab)}>
      <TabsList className="w-1/2">
        <TabsTrigger value="general">
          <Settings className="h-4 w-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="api">
          <Zap className="h-4 w-4" />
          API Settings
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <Wrench className="h-4 w-4" />
          Maintenance
        </TabsTrigger>
        <TabsTrigger value="backup">
          <Database className="h-4 w-4" />
          Backup &amp; Restore
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
