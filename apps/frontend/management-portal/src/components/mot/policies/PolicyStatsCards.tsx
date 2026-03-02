'use client';

import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { StatsCardMetric } from '@/components/shared/StatsCard';
import { PolicyStatistics } from '@/data/mot/policies';

interface PolicyStatsCardsProps {
    stats: PolicyStatistics | null;
    loading?: boolean;
}

export function PolicyStatsCards({ stats, loading }: PolicyStatsCardsProps) {
    const metrics: StatsCardMetric[] = [
        {
            label: 'Total Policies',
            value: stats?.totalPolicies ?? 0,
            color: 'blue',
            trend: 'neutral',
        },
        {
            label: 'Published',
            value: stats?.publishedPolicies ?? 0,
            color: 'green',
            trend: 'neutral',
        },
        {
            label: 'Drafts',
            value: stats?.draftPolicies ?? 0,
            color: 'amber',
            trend: 'neutral',
        },
        {
            label: 'Under Review',
            value: stats?.underReviewPolicies ?? 0,
            color: 'purple',
            trend: 'neutral',
        },
        {
            label: 'Archived',
            value: stats?.archivedPolicies ?? 0,
            color: 'teal',
            trend: 'neutral',
        },
    ];

    return (
        <StatsCardsContainer
            metrics={metrics}
            loading={loading}
            columns={5}
            skeletonCount={5}
        />
    );
}
