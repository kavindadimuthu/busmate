'use client';

import React from 'react';
import { Users, Clock, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
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
    return (
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabValue)}>
            <TabsList>
                <TabsTrigger value="all">
                    <Users className="h-4 w-4" /> All Staff
                    {counts.all > 0 && <span className="ml-1 text-xs font-semibold">{counts.all.toLocaleString()}</span>}
                </TabsTrigger>
                <TabsTrigger value="timekeeper">
                    <Clock className="h-4 w-4" /> Timekeepers
                    {counts.timekeeper > 0 && <span className="ml-1 text-xs font-semibold">{counts.timekeeper.toLocaleString()}</span>}
                </TabsTrigger>
                <TabsTrigger value="inspector">
                    <Search className="h-4 w-4" /> Inspectors
                    {counts.inspector > 0 && <span className="ml-1 text-xs font-semibold">{counts.inspector.toLocaleString()}</span>}
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
