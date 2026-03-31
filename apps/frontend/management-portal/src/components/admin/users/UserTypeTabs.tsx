'use client';

import { Shield, Clock, Truck, CircleDot, Car, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import { USER_TYPE_CONFIG } from '@/data/admin/users';
import type { UserType } from '@/data/admin/users';

// ── Icon map ──────────────────────────────────────────────────────

const USER_TYPE_ICONS: Record<UserType, React.ComponentType<{ className?: string }>> = {
  mot: Shield,
  timekeeper: Clock,
  operator: Truck,
  conductor: CircleDot,
  driver: Car,
  passenger: Users,
};

// ── Types ─────────────────────────────────────────────────────────

interface UserTypeTabsProps {
  activeTab: UserType;
  onTabChange: (tab: UserType) => void;
  counts: Record<UserType, number>;
}

// ── Component ─────────────────────────────────────────────────────

export function UserTypeTabs({ activeTab, onTabChange, counts }: UserTypeTabsProps) {
  const userTypes: UserType[] = ['mot', 'timekeeper', 'operator', 'conductor', 'driver', 'passenger'];

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as UserType)}>
      <TabsList className="w-2/3">
        {userTypes.map((type) => {
          const Icon = USER_TYPE_ICONS[type];
          const config = USER_TYPE_CONFIG[type];
          return (
            <TabsTrigger key={type} value={type}>
              <Icon className="h-4 w-4" />
              {config.label}
              {counts[type] > 0 && (
                <span className="ml-1 text-xs font-semibold">{counts[type]}</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
