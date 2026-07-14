'use client';

import * as React from 'react';
import { FileText, DollarSign, Layers, Hash, TrendingUp } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';
import type { FareStatistics } from '@/data/mot/fares';

interface FaresStatsCardsProps {
  stats: FareStatistics | null;
}

export function FaresStatsCards({ stats }: FaresStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-5">
      <StatsCard
        title="Total Amendments"
        value={String(stats?.totalAmendments ?? 0)}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="Active Amendment"
        value={stats?.activeAmendment ?? 'N/A'}
        icon={<DollarSign className="h-5 w-5" />}
      />
      <StatsCard
        title="Permit Types"
        value={String(stats?.totalPermitTypes ?? 0)}
        icon={<Layers className="h-5 w-5" />}
      />
      <StatsCard
        title="Max Stages"
        value={String(stats?.maxStages ?? 0)}
        icon={<Hash className="h-5 w-5" />}
      />
      <StatsCard
        title="Avg Normal Fare"
        value={stats ? `Rs. ${stats.averageNormalFare.toFixed(2)}` : 'Rs. 0.00'}
        icon={<TrendingUp className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
