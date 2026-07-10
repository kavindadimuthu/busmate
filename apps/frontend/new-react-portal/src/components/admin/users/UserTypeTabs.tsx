'use client';

import { Crown, Shield, Clock, Truck, CircleDot, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import { USER_TYPE_CONFIG, USER_TYPE_ORDER } from '@/data/admin/users';
import type { UserType } from '@/data/admin/users';

// ── Icon map ──────────────────────────────────────────────────────

const USER_TYPE_ICONS: Record<UserType, React.ComponentType<{ className?: string }>> = {
  admin: Crown,
  mot: Shield,
  timekeeper: Clock,
  operator: Truck,
  conductor: CircleDot,
  passenger: Users,
};

// ── Types ─────────────────────────────────────────────────────────

interface UserTypeTabsProps {
  activeTab: UserType;
  onTabChange: (tab: UserType) => void;
  counts: Record<UserType, number> | null;
}

// ── Component ─────────────────────────────────────────────────────

export function UserTypeTabs({ activeTab, onTabChange, counts }: UserTypeTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as UserType)}>
      <TabsList className="w-2/3">
        {USER_TYPE_ORDER.map((type) => {
          const Icon = USER_TYPE_ICONS[type];
          const config = USER_TYPE_CONFIG[type];
          const count = counts?.[type] ?? 0;
          return (
            <TabsTrigger key={type} value={type}>
              <Icon className="h-4 w-4" />
              {config.label}
              {count > 0 && (
                <span className="ml-1 text-xs font-semibold">{count}</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
