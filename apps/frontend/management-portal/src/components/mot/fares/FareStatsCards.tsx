'use client';

import { DollarSign, FileText, Layers, Hash, TrendingUp, Calendar } from 'lucide-react';
import { FareStatistics } from '@/data/mot/fares';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { StatsCardMetric } from '@/components/shared/StatsCard';

interface FareStatsCardsProps {
  stats: FareStatistics | null;
  loading?: boolean;
}

export function FareStatsCards({ stats, loading }: FareStatsCardsProps) {
  const metrics: StatsCardMetric[] = [
    {
      label: 'Total Amendments',
      value: String(stats?.totalAmendments ?? 0),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'blue',
      sparkData: [3, 3, 4, 4, 5],
      icon: FileText,
    },
    {
      label: 'Active Amendment',
      value: stats?.activeAmendment ?? 'N/A',
      trend: 'up',
      trendValue: 'Current',
      trendPositiveIsGood: true,
      color: 'green',
      sparkData: [1, 1, 1, 1, 1],
      icon: DollarSign,
    },
    {
      label: 'Permit Types',
      value: String(stats?.totalPermitTypes ?? 0),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'purple',
      sparkData: [4, 4, 4, 4, 4],
      icon: Layers,
    },
    {
      label: 'Max Stages',
      value: String(stats?.maxStages ?? 0),
      trend: 'stable',
      trendValue: '',
      trendPositiveIsGood: true,
      color: 'amber',
      sparkData: [350, 350, 350, 350, 350],
      icon: Hash,
    },
    {
      label: 'Avg Normal Fare',
      value: stats ? `Rs. ${stats.averageNormalFare.toFixed(2)}` : 'Rs. 0.00',
      trend: 'up',
      trendValue: '+8%',
      trendPositiveIsGood: false,
      color: 'teal',
      sparkData: [280, 295, 310, 320, 335],
      icon: TrendingUp,
    },
  ];

  return <StatsCardsContainer metrics={metrics} columns={5} loading={loading} />;
}
