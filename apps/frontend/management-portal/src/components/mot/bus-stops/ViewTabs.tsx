'use client';

import React from 'react';
import { LayoutList, Map } from 'lucide-react';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import type { TabItem } from '@/components/shared/SwitchableTabs';

export type ViewType = 'table' | 'map';

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const TABS: TabItem<ViewType>[] = [
  { id: 'table', label: 'List View', icon: LayoutList },
  { id: 'map',   label: 'Map View',  icon: Map },
];

/**
 * Bus-stop view switcher — table / map.
 *
 * Wraps `<SwitchableTabs>` with bus-stop-specific tab definitions.
 * Result counts are intentionally omitted here — they are shown in the
 * search/filter bar instead.
 */
export function ViewTabs({
  activeView,
  onViewChange,
}: ViewTabsProps) {
  return (
    <SwitchableTabs<ViewType>
      tabs={TABS}
      activeTab={activeView}
      onTabChange={onViewChange}
    />
  );
}