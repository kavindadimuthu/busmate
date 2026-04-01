'use client';

import {
  DollarSign,
  Users,
  Clock,
  Award,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { SalaryStats } from '@/data/operator/salary';

interface SalaryStatsCardsProps {
  stats: SalaryStats | null;
  loading: boolean;
}

export function SalaryStatsCards({ stats, loading }: SalaryStatsCardsProps) {
  if (loading || !stats) {
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
        title="Total Paid"
        value={`Rs ${stats.totalPaid.toLocaleString()}`}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`${stats.paidCount} payments`}
      />
      <StatsCard
        title="Pending Payments"
        value={`Rs ${stats.totalPending.toLocaleString()}`}
        icon={<Clock className="h-5 w-5" />}
        description={`${stats.pendingCount} pending`}
      />
      <StatsCard
        title="Total Staff"
        value={stats.totalStaff.toString()}
        icon={<Users className="h-5 w-5" />}
        description="Active employees"
      />
      <StatsCard
        title="Average Salary"
        value={`Rs ${stats.avgSalary.toLocaleString()}`}
        icon={<DollarSign className="h-5 w-5" />}
        trend={{ value: 3.2, direction: 'up', label: 'vs last month' }}
      />
      <StatsCard
        title="Total Bonuses"
        value={`Rs ${stats.totalBonuses.toLocaleString()}`}
        icon={<Award className="h-5 w-5" />}
        description="Performance + trips"
      />
      <StatsCard
        title="Total Deductions"
        value={`Rs ${stats.totalDeductions.toLocaleString()}`}
        icon={<TrendingDown className="h-5 w-5" />}
        trend={stats.totalDeductions > 0 ? { value: 1.5, direction: 'down', label: 'vs last month' } : undefined}
      />
    </StatsCardGrid>
  );
}
