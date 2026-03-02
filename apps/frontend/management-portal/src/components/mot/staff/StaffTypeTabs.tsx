'use client';

import React from 'react';
import { Users, Clock, Search } from 'lucide-react';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import type { TabItem } from '@/components/shared/SwitchableTabs';
import type { StaffType } from '@/data/mot/staff';

type TabValue = 'all' | StaffType;

interface StaffTypeTabsProps {
    activeTab: TabValue;
    onTabChange: (tab: TabValue) => void;
    counts: {
        all: number;
        timekeeper: number;
        inspector: number;
    };
}

export function StaffTypeTabs({ activeTab, onTabChange, counts }: StaffTypeTabsProps) {
    const tabs: TabItem<TabValue>[] = [
        { id: 'all', label: 'All Staff', icon: Users, count: counts.all },
        { id: 'timekeeper', label: 'Timekeepers', icon: Clock, count: counts.timekeeper },
        { id: 'inspector', label: 'Inspectors', icon: Search, count: counts.inspector },
    ];

    return (
        <SwitchableTabs<TabValue>
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        />
    );
}
