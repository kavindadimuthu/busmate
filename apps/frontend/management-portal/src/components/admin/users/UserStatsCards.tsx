'use client';

import {
  Users,
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { UserStatsData } from '@/data/admin/users';

interface UserStatsCardsProps {
  stats: UserStatsData | null;
  loading?: boolean;
}

export function UserStatsCards({ stats, loading = false }: UserStatsCardsProps) {
  const defaultStats: UserStatsData = {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    byType: {
      mot: 0,
      timekeeper: 0,
      operator: 0,
      conductor: 0,
      driver: 0,
      passenger: 0,
    },
  };

  const s = stats || defaultStats;

  if (loading) {
    return (
      <StatsCardGrid className="lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </StatsCardGrid>
    );
  }

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Users"
        value={s.total.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={s.active.toLocaleString()}
        icon={<UserCheck className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={s.inactive.toLocaleString()}
        icon={<UserX className="h-5 w-5" />}
      />
      <StatsCard
        title="Suspended"
        value={s.suspended.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <StatsCard
        title="Pending"
        value={s.pending.toLocaleString()}
        icon={<UserPlus className="h-5 w-5" />}
      />
      <StatsCard
        title="MOT Officers"
        value={s.byType.mot.toLocaleString()}
        icon={<Shield className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
