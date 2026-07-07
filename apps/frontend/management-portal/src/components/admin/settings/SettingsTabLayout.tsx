'use client';

import { useState } from 'react';
import { Settings, Zap, Wrench, Database } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@busmate/ui';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { ApiSettingsPanel } from './ApiSettingsPanel';
import { MaintenanceSettingsPanel } from './MaintenanceSettingsPanel';
import { BackupSettingsPanel } from './BackupSettingsPanel';

// ── Types ────────────────────────────────────────────────────────

export type SettingsTab = 'general' | 'api' | 'maintenance' | 'backup';

// ── Component ────────────────────────────────────────────────────

interface SettingsTabLayoutProps {
  initialTab?: SettingsTab;
}

export function SettingsTabLayout({ initialTab = 'general' }: SettingsTabLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
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
      <TabsContent value="general">
        <GeneralSettingsPanel />
      </TabsContent>
      <TabsContent value="api">
        <ApiSettingsPanel />
      </TabsContent>
      <TabsContent value="maintenance">
        <MaintenanceSettingsPanel />
      </TabsContent>
      <TabsContent value="backup">
        <BackupSettingsPanel />
      </TabsContent>
    </Tabs>
  );
}
