'use client';

import { Bell, Send, Clock, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import type { TabKey } from '@/hooks/admin/notifications/useNotificationsListing';

interface NotificationTypeTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

export function NotificationTypeTabs({ activeTab, onTabChange, counts }: NotificationTypeTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey)}>
      <TabsList className="w-1/2">
        <TabsTrigger value="all">
          <Bell className="h-4 w-4" /> All
          {counts.all > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.all.toLocaleString()}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent">
          <Send className="h-4 w-4" /> Sent
          {counts.sent > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.sent.toLocaleString()}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="scheduled">
          <Clock className="h-4 w-4" /> Scheduled
          {counts.scheduled > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.scheduled.toLocaleString()}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="drafts">
          <FileText className="h-4 w-4" /> Drafts
          {counts.drafts > 0 && (
            <span className="ml-1 text-xs font-semibold">{counts.drafts.toLocaleString()}</span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
