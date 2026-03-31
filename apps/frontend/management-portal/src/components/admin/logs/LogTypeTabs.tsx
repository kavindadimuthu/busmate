'use client';

import { Activity, Shield, Terminal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import type { TabKey } from '@/hooks/admin/logs/useLogsListing';

interface LogTypeTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

export function LogTypeTabs({ activeTab, onTabChange, counts }: LogTypeTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey)}>
      <TabsList className="w-1/2">
        <TabsTrigger value="user-activity">
          <Activity className="h-4 w-4" /> User Activity
          {counts['user-activity'] > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts['user-activity'].toLocaleString()}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="h-4 w-4" /> Security
          {counts.security > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.security.toLocaleString()}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="application">
          <Terminal className="h-4 w-4" /> Application
          {counts.application > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.application.toLocaleString()}</span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
