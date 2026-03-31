'use client';

import { Users, Car, UserCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';

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
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as StaffTabValue)}>
      <TabsList>
        <TabsTrigger value="all">
          <Users className="h-4 w-4" /> All Staff
          {counts.all > 0 && <span className="ml-1 text-xs font-semibold">{counts.all.toLocaleString()}</span>}
        </TabsTrigger>
        <TabsTrigger value="drivers">
          <Car className="h-4 w-4" /> Drivers
          {counts.drivers > 0 && <span className="ml-1 text-xs font-semibold">{counts.drivers.toLocaleString()}</span>}
        </TabsTrigger>
        <TabsTrigger value="conductors">
          <UserCheck className="h-4 w-4" /> Conductors
          {counts.conductors > 0 && <span className="ml-1 text-xs font-semibold">{counts.conductors.toLocaleString()}</span>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
