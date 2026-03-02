'use client';

import { Users, Car, UserCheck } from 'lucide-react';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import type { TabItem } from '@/components/shared/SwitchableTabs';

// ── Types ─────────────────────────────────────────────────────────

export type StaffTabValue = 'all' | 'drivers' | 'conductors';

interface StaffTypeTabsProps {
  activeTab: StaffTabValue;
  onTabChange: (tab: StaffTabValue) => void;
  counts: {
    all: number;
    drivers: number;
    conductors: number;
  };
}

// ── Component ─────────────────────────────────────────────────────

export function StaffTypeTabs({ activeTab, onTabChange, counts }: StaffTypeTabsProps) {
  const tabs: TabItem<StaffTabValue>[] = [
    { id: 'all',        label: 'All Staff',  icon: Users,      count: counts.all },
    { id: 'drivers',    label: 'Drivers',    icon: Car,        count: counts.drivers },
    { id: 'conductors', label: 'Conductors', icon: UserCheck,  count: counts.conductors },
  ];

  return (
    <SwitchableTabs<StaffTabValue>
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      ariaLabel="Staff role filter"
    />
  );
}
