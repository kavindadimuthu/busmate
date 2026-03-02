'use client';

import React from 'react';
import {
  DollarSign,
  Users,
  Clock,
  Award,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import type { StatsCardMetric } from '@/components/shared/StatsCard';
import type { SalaryStats } from '@/data/operator/salary';

// ── Props ─────────────────────────────────────────────────────────

interface SalaryStatsCardsProps {
  /** Salary summary statistics. */
  stats: SalaryStats | null;
  /** Show skeleton loading state. */
  loading: boolean;
}

// ── Component ─────────────────────────────────────────────────────

/**
 * Salary KPI stats cards row.
 *
 * Displays total paid, pending, staff count, average salary,
 * bonuses, and deductions in a responsive grid.
 */
export function SalaryStatsCards({ stats, loading }: SalaryStatsCardsProps) {
  const metrics: StatsCardMetric[] = stats
    ? [
        {
          label: 'Total Paid',
          value: `Rs ${stats.totalPaid.toLocaleString()}`,
          trend: 'up',
          trendValue: `${stats.paidCount} payments`,
          trendPositiveIsGood: true,
          color: 'green',
          sparkData: [40, 48, 52, 55, 60, 58, 65, 70],
          icon: CheckCircle,
        },
        {
          label: 'Pending Payments',
          value: `Rs ${stats.totalPending.toLocaleString()}`,
          trend: stats.pendingCount > 0 ? 'up' : 'stable',
          trendValue: `${stats.pendingCount} pending`,
          trendPositiveIsGood: false,
          color: 'amber',
          sparkData: [10, 12, 8, 15, 10, 14, 11, 13],
          icon: Clock,
        },
        {
          label: 'Total Staff',
          value: stats.totalStaff.toString(),
          trend: 'stable',
          trendValue: 'Active employees',
          trendPositiveIsGood: true,
          color: 'blue',
          sparkData: [10, 10, 10, 10, 10, 10, 10, 10],
          icon: Users,
        },
        {
          label: 'Average Salary',
          value: `Rs ${stats.avgSalary.toLocaleString()}`,
          trend: 'up',
          trendValue: '+3.2% vs last month',
          trendPositiveIsGood: true,
          color: 'purple',
          sparkData: [1200, 1250, 1280, 1300, 1350, 1380, 1400, 1420],
          icon: DollarSign,
        },
        {
          label: 'Total Bonuses',
          value: `Rs ${stats.totalBonuses.toLocaleString()}`,
          trend: 'up',
          trendValue: 'Performance + trips',
          trendPositiveIsGood: true,
          color: 'teal',
          sparkData: [20, 25, 22, 30, 28, 35, 32, 38],
          icon: Award,
        },
        {
          label: 'Total Deductions',
          value: `Rs ${stats.totalDeductions.toLocaleString()}`,
          trend: stats.totalDeductions > 0 ? 'down' : 'stable',
          trendValue: '-1.5% vs last month',
          trendPositiveIsGood: false,
          color: 'red',
          sparkData: [5, 4, 6, 3, 5, 4, 3, 2],
          icon: TrendingDown,
        },
      ]
    : [];

  return (
    <StatsCardsContainer
      metrics={metrics}
      loading={loading}
      columns={6}
      skeletonCount={6}
    />
  );
}
