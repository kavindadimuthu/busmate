'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, RefreshCw, Trash2 } from 'lucide-react';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { formatTimeForDisplay } from '@/types/ScheduleWorkspaceData';
import { cn } from '@/lib/utils';

// Helper to get start time from schedule (first stop departure time)
const getScheduleStartTime = (schedule: { scheduleStops: { departureTime?: string }[] }): string => {
    const firstStop = schedule.scheduleStops[0];
    return firstStop?.departureTime || '--:--';
};

export default function ScheduleGrid() {
    const {
        data,
        updateScheduleStopByScheduleIndex,
        setActiveScheduleIndex,
        activeScheduleIndex,
        highlightedScheduleIndex,
        setHighlightedScheduleIndex,
    } = useScheduleWorkspace();
    const { schedules, routeStops, selectedRouteId } = data;

    const [editingCell, setEditingCell] = useState<{ scheduleIndex: number, stopIndex: number, field: 'arrivalTime' | 'departureTime' } | null>(null);

    // Ref for highlighted column animation
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Clear highlight after animation
    useEffect(() => {
        if (highlightedScheduleIndex !== null) {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = setTimeout(() => {
                setHighlightedScheduleIndex(null);
            }, 1500);
        }
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, [highlightedScheduleIndex, setHighlightedScheduleIndex]);

    const handleTimeChange = (scheduleIndex: number, stopIndex: number, field: 'arrivalTime' | 'departureTime', value: string) => {
        updateScheduleStopByScheduleIndex(scheduleIndex, stopIndex, { [field]: value });
    };

    const handleCellClick = (scheduleIndex: number, stopIndex: number, field: 'arrivalTime' | 'departureTime') => {
        setEditingCell({ scheduleIndex, stopIndex, field });
    };

    const handleCellBlur = () => {
        setEditingCell(null);
    };

    const handleColumnHeaderDoubleClick = (scheduleIndex: number) => {
        setActiveScheduleIndex(scheduleIndex);
    };

    if (!selectedRouteId) {
        return (
            <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-muted border-b border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground">Schedule Grid</h3>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-base font-medium text-muted-foreground">Select a Route</p>
                    <p className="text-sm mt-2 text-muted-foreground">Choose a route above to view and edit schedules</p>
                </div>
            </div>
        );
    }

    if (routeStops.length === 0) {
        return (
            <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-muted border-b border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground">Schedule Grid</h3>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-base font-medium text-muted-foreground">No Stops Available</p>
                    <p className="text-sm mt-2 text-muted-foreground">This route has no stops defined</p>
                </div>
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-muted border-b border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground">Schedule Grid</h3>
                </div>
                <div className="p-8 text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-base font-medium text-muted-foreground">No Schedules</p>
                    <p className="text-sm mt-2 text-muted-foreground">Add a schedule using the button above to start editing</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-muted border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground">
                    Schedule Grid
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-card border border-border  overflow-hidden">
                    <thead>
                        {/* First header row: Schedule names */}
                        <tr className="bg-muted">
                            <th className="px-3 py-2.5 border-b border-r border-border text-left text-xs font-semibold text-muted-foreground w-10" rowSpan={2}>
                                #
                            </th>
                            <th className="px-4 py-2.5 border-b border-r border-border text-left text-xs font-semibold text-muted-foreground min-w-[150px]" rowSpan={2}>
                                Stop Name
                            </th>
                            {schedules.map((schedule, scheduleIndex) => (
                                <th
                                    key={scheduleIndex}
                                    colSpan={2}
                                    onDoubleClick={() => handleColumnHeaderDoubleClick(scheduleIndex)}
                                    className={cn(
                                        'px-2 py-2.5 border-b border-r border-border text-center text-xs font-semibold cursor-pointer transition-all duration-200',
                                        activeScheduleIndex === scheduleIndex
                                            ? 'border-3 border-primary text-primary'
                                            : 'text-muted-foreground hover:bg-secondary',
                                        highlightedScheduleIndex === scheduleIndex && 'animate-pulse bg-warning/15'
                                    )}
                                >
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-sm">
                                            {getScheduleStartTime(schedule)}
                                        </span>
                                        <span className="text-[10px] truncate max-w-[100px] opacity-80" title={schedule.name}>
                                            {schedule.name || `Schedule ${scheduleIndex + 1}`}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                        {/* Second header row: Arr/Dep labels */}
                        <tr className="bg-muted">
                            {schedules.map((_, scheduleIndex) => (
                                <th
                                    key={`${scheduleIndex}-arr`}
                                    className={cn(
                                        'px-1 py-1.5 border-b border-border text-center text-[10px] font-medium w-[70px] text-muted-foreground',
                                        activeScheduleIndex === scheduleIndex && 'bg-primary/10 text-primary',
                                        highlightedScheduleIndex === scheduleIndex && 'bg-warning/10'
                                    )}
                                >
                                    Arr
                                </th>
                            )).flatMap((el, idx) => [
                                el,
                                <th
                                    key={`${idx}-dep`}
                                    className={cn(
                                        'px-1 py-1.5 border-b border-r border-border text-center text-[10px] font-medium w-[70px] text-muted-foreground',
                                        activeScheduleIndex === idx && 'bg-primary/10 text-primary',
                                        highlightedScheduleIndex === idx && 'bg-warning/10'
                                    )}
                                >
                                    Dep
                                </th>
                            ])}
                        </tr>
                    </thead>
                    <tbody>
                        {routeStops.map((stop, stopIndex) => {
                            const isFirst = stopIndex === 0;
                            const isLast = stopIndex === routeStops.length - 1;

                            return (
                                <tr
                                    key={stop.id}
                                    className={cn(
                                        'transition-colors hover:bg-muted',
                                        isFirst && 'bg-success/10/50',
                                        isLast && 'bg-destructive/10/50'
                                    )}
                                >
                                    {/* Stop order */}
                                    <td className="px-3 py-2 border-b border-r border-border text-xs font-medium text-muted-foreground text-center">
                                        {stopIndex + 1}
                                    </td>
                                    {/* Stop name */}
                                    <td className="px-4 py-2 border-b border-r border-border">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-medium text-foreground truncate">{stop.name}</span>
                                            {isFirst && (
                                                <span className="text-[10px] bg-success text-white px-1.5 py-0.5 rounded-md shrink-0 font-medium">START</span>
                                            )}
                                            {isLast && (
                                                <span className="text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-md shrink-0 font-medium">END</span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Time cells for each schedule */}
                                    {schedules.map((schedule, scheduleIndex) => {
                                        const scheduleStop = schedule.scheduleStops[stopIndex];
                                        const isActive = activeScheduleIndex === scheduleIndex;
                                        const isHighlighted = highlightedScheduleIndex === scheduleIndex;

                                        const arrivalTime = scheduleStop?.arrivalTime || '';
                                        const departureTime = scheduleStop?.departureTime || '';

                                        const isEditingArr = editingCell?.scheduleIndex === scheduleIndex &&
                                            editingCell?.stopIndex === stopIndex &&
                                            editingCell?.field === 'arrivalTime';
                                        const isEditingDep = editingCell?.scheduleIndex === scheduleIndex &&
                                            editingCell?.stopIndex === stopIndex &&
                                            editingCell?.field === 'departureTime';

                                        return (
                                            <React.Fragment key={`${scheduleIndex}-${stopIndex}`}>
                                                {/* Arrival time */}
                                                <td
                                                    onClick={() => handleCellClick(scheduleIndex, stopIndex, 'arrivalTime')}
                                                    className={cn(
                                                        'px-1 py-1.5 border-b border-border text-center cursor-pointer transition-colors',
                                                        isActive && 'bg-primary/10/50',
                                                        isHighlighted && 'bg-warning/10 animate-pulse'
                                                    )}
                                                >
                                                    {isEditingArr ? (
                                                        <input
                                                            type="time"
                                                            value={formatTimeForDisplay(arrivalTime)}
                                                            onChange={(e) => handleTimeChange(scheduleIndex, stopIndex, 'arrivalTime', e.target.value)}
                                                            onBlur={handleCellBlur}
                                                            autoFocus
                                                            className="w-[65px] text-xs border border-primary/40 rounded-md px-1 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    ) : (
                                                        <span className={cn(
                                                            'text-xs',
                                                            arrivalTime ? 'text-muted-foreground' : 'text-muted-foreground/50'
                                                        )}>
                                                            {arrivalTime ? formatTimeForDisplay(arrivalTime) : '--:--'}
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Departure time */}
                                                <td
                                                    key={`${scheduleIndex}-${stopIndex}-dep`}
                                                    onClick={() => handleCellClick(scheduleIndex, stopIndex, 'departureTime')}
                                                    className={cn(
                                                        'px-1 py-1.5 border-b border-r border-border text-center cursor-pointer transition-colors',
                                                        isActive && 'bg-primary/10/50',
                                                        isHighlighted && 'bg-warning/10 animate-pulse'
                                                    )}
                                                >
                                                    {isEditingDep ? (
                                                        <input
                                                            type="time"
                                                            value={formatTimeForDisplay(departureTime)}
                                                            onChange={(e) => handleTimeChange(scheduleIndex, stopIndex, 'departureTime', e.target.value)}
                                                            onBlur={handleCellBlur}
                                                            autoFocus
                                                            className="w-[65px] text-xs border border-primary/40 rounded-md px-1 py-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    ) : (
                                                        <span className={cn(
                                                            'text-xs',
                                                            departureTime ? 'text-muted-foreground' : 'text-muted-foreground/50'
                                                        )}>
                                                            {departureTime ? formatTimeForDisplay(departureTime) : '--:--'}
                                                        </span>
                                                    )}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}