'use client';

import * as React from 'react';
import { FileText, CheckCircle, Edit, Eye, Archive } from 'lucide-react';
import { StatsCard, StatsCardGrid } from '@busmate/ui';

interface PolicyStats {
  totalPolicies?: number;
  publishedPolicies?: number;
  draftPolicies?: number;
  underReviewPolicies?: number;
  archivedPolicies?: number;
}

interface PoliciesStatsCardsProps {
  stats: PolicyStats | null;
}

export function PoliciesStatsCards({ stats }: PoliciesStatsCardsProps) {
  return (
    <StatsCardGrid className="lg:grid-cols-5">
      <StatsCard
        title="Total Policies"
        value={String(stats?.totalPolicies ?? 0)}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="Published"
        value={String(stats?.publishedPolicies ?? 0)}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Drafts"
        value={String(stats?.draftPolicies ?? 0)}
        icon={<Edit className="h-5 w-5" />}
      />
      <StatsCard
        title="Under Review"
        value={String(stats?.underReviewPolicies ?? 0)}
        icon={<Eye className="h-5 w-5" />}
      />
      <StatsCard
        title="Archived"
        value={String(stats?.archivedPolicies ?? 0)}
        icon={<Archive className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
