'use client';

import { Users, CheckCircle, XCircle, Clock, Search, MapPin } from 'lucide-react';
import { StatsCardsContainer } from '@/components/shared/StatsCardsContainer';
import { StatsCardMetric } from '@/components/shared/StatsCard';

interface StaffStatsCardsProps {
    stats: {
        totalStaff: { count: number };
        activeStaff: { count: number };
        inactiveStaff: { count: number };
        totalTimekeepers: { count: number };
        totalInspectors: { count: number };
        provincesCount: { count: number };
    };
    loading?: boolean;
}

export function StaffStatsCards({ stats, loading }: StaffStatsCardsProps) {
    const metrics: StatsCardMetric[] = [
        {
            label: 'Total Staff',
            value: String(stats.totalStaff.count),
            color: 'blue',
            icon: Users,
        },
        {
            label: 'Active',
            value: String(stats.activeStaff.count),
            color: 'green',
            icon: CheckCircle,
        },
        {
            label: 'Inactive',
            value: String(stats.inactiveStaff.count),
            color: 'red',
            icon: XCircle,
        },
        {
            label: 'Timekeepers',
            value: String(stats.totalTimekeepers.count),
            color: 'purple',
            icon: Clock,
        },
        {
            label: 'Inspectors',
            value: String(stats.totalInspectors.count),
            color: 'teal',
            icon: Search,
        },
        {
            label: 'Provinces',
            value: String(stats.provincesCount.count),
            color: 'amber',
            icon: MapPin,
        },
    ];

    return <StatsCardsContainer metrics={metrics} columns={6} loading={loading} />;
}
