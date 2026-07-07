'use client';

import { Users, Car, UserCheck, CheckCircle, Clock, Calendar } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { StaffStats } from '@/data/operator/staff';

interface StaffStatsCardsProps {
  stats?: StaffStats | null;
  loading?: boolean;
}

const EMPTY_STATS: StaffStats = {
  totalStaff: 0,
  totalDrivers: 0,
  totalConductors: 0,
  activeStaff: 0,
  availableNow: 0,
  assignedNow: 0,
  onLeave: 0,
};

export function StaffStatsCards({ stats, loading = false }: StaffStatsCardsProps) {
  const s = stats ?? EMPTY_STATS;

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
        title="Total Staff"
        value={s.totalStaff.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Drivers"
        value={s.totalDrivers.toLocaleString()}
        icon={<Car className="h-5 w-5" />}
      />
      <StatsCard
        title="Conductors"
        value={s.totalConductors.toLocaleString()}
        icon={<UserCheck className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={s.activeStaff.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Assigned Now"
        value={s.assignedNow.toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="On Leave"
        value={s.onLeave.toLocaleString()}
        icon={<Calendar className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
