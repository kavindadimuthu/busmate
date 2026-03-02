'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { ScheduleTabs } from './ScheduleTabs';
import ScheduleMetadata from './ScheduleMetadata';
import ScheduleExceptions from './ScheduleExceptions';
import ScheduleGrid from './ScheduleGrid';
import TimeStopGraph from './TimeStopGraph';
import { Grid3X3, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'graph';

export default function ScheduleFormMode() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data, setSelectedRoute, isLoading, activeScheduleIndex } = useScheduleWorkspace();
    const { availableRoutes, selectedRouteId, selectedRouteName, selectedRouteGroupName, schedules } = data;

    // Prevent hydration mismatch by tracking mount state
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const routeId = e.target.value;
        if (routeId) {
            setSelectedRoute(routeId);
            // Update URL query param
            const params = new URLSearchParams(searchParams.toString());
            params.set('routeId', routeId);
            router.push(`?${params.toString()}`);
        } else {
            // Clear query param if route is deselected
            const params = new URLSearchParams(searchParams.toString());
            params.delete('routeId');
            router.push(`?${params.toString()}`);
        }
    };

    const hasActiveSchedule = activeScheduleIndex !== null && schedules.length > 0;

    return (
        <div className="space-y-5">
            {/* Route selector */}
            <div className='flex items-center gap-4  '>
                <label htmlFor="route" className="pl-2 text-sm font-medium text-slate-700 whitespace-nowrap">
                    Select Route:
                </label>
                <select
                    id="route"
                    name="route"
                    value={selectedRouteId || ''}
                    onChange={handleRouteChange}
                    disabled={isLoading && mounted}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                    <option value="">-- Select a Route --</option>
                    {availableRoutes.map(route => (
                        <option key={route.id} value={route.id}>
                            {route.routeGroupName} - {route.name}
                            {route.direction && ` (${route.direction})`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Schedule Tabs - Horizontal list of all schedules */}
            {selectedRouteId && <ScheduleTabs />}

            {/* Schedule Metadata and Exceptions for Active Schedule */}
            {hasActiveSchedule && (
                <div className='flex gap-6'>
                    <ScheduleMetadata />
                    <ScheduleExceptions />
                </div>
            )}

            {/* View Toggle and Schedule Display */}
            {selectedRouteId && (
                <>
                    {/* View mode toggle */}
                    <div className="flex items-center justify-end gap-3">
                        <span className="text-sm text-slate-500 mr-1">View:</span>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                    viewMode === 'grid'
                                        ? "bg-blue-700 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                                title="Grid View"
                            >
                                <Grid3X3 className="h-4 w-4" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('graph')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                    viewMode === 'graph'
                                        ? "bg-blue-700 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                                title="Time-Stop Graph"
                            >
                                <LineChart className="h-4 w-4" />
                                Graph
                            </button>
                        </div>
                    </div>

                    {/* Conditional view rendering */}
                    {viewMode === 'grid' ? <ScheduleGrid /> : <TimeStopGraph />}
                </>
            )}
        </div>
    );
}
