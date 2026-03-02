'use client';

import { useState } from 'react';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { cn } from '@/lib/utils';
import { Plus, Copy, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper to get start time from schedule (first stop departure time)
const getScheduleStartTime = (schedule: { scheduleStops: { departureTime?: string }[] }): string => {
    const firstStop = schedule.scheduleStops[0];
    return firstStop?.departureTime || '00:00';
};

export function ScheduleTabs() {
    const {
        data,
        activeScheduleIndex,
        setActiveScheduleIndex,
        setHighlightedScheduleIndex,
        addNewSchedule,
        removeSchedule,
        duplicateSchedule,
    } = useScheduleWorkspace();

    const { schedules, selectedRouteId } = data;
    const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

    const handleTabClick = (index: number) => {
        setActiveScheduleIndex(index);
        // Trigger highlight in grid
        setHighlightedScheduleIndex(index);
    };

    const handleAddSchedule = () => {
        addNewSchedule();
    };

    const handleDuplicateSchedule = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateSchedule(index);
    };

    const handleRemoveClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDeleteIndex(index);
    };

    const handleConfirmRemove = () => {
        if (confirmDeleteIndex !== null) {
            removeSchedule(confirmDeleteIndex);
            setConfirmDeleteIndex(null);
        }
    };

    const handleCancelRemove = () => {
        setConfirmDeleteIndex(null);
    };

    if (!selectedRouteId) {
        return (
            <div className="flex items-center justify-center p-4 text-sm text-slate-500 bg-white rounded-lg border border-slate-200">
                Select a route to view schedules
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* Delete Confirmation Modal */}
            {confirmDeleteIndex !== null && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md shadow-2xl border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Remove Schedule</h3>
                        <p className="text-slate-600 mb-4">
                            Are you sure you want to remove &quot;{schedules[confirmDeleteIndex]?.name || `Schedule ${confirmDeleteIndex + 1}`}&quot;?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={handleCancelRemove}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmRemove}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Tabs Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Schedules
                    <span className='bg-blue-700 w-6 h-6 text-xs rounded-full flex items-center justify-center text-white font-medium'>
                        {schedules.length}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddSchedule}
                    className="h-8 gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    title="Add a new schedule for this route"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Schedule
                </Button>
            </div>

            {/* Tabs Container with Horizontal Scroll */}
            <div className="flex gap-2 p-3 overflow-x-auto bg-white">
                {schedules.length === 0 ? (
                    <div className="flex items-center justify-center w-full py-4 text-sm text-slate-500">
                        No schedules. Click &quot;Add Schedule&quot; to create one.
                    </div>
                ) : (
                    schedules.map((schedule, index) => (
                        <div
                            key={index}
                            onClick={() => handleTabClick(index)}
                            className={cn(
                                'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 min-w-[170px]',
                                'border hover:shadow-sm',
                                activeScheduleIndex === index
                                    ? 'text-blue-700 border-3 border-blue-700 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            )}
                        >
                            {/* Schedule Time Badge */}
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs font-medium',
                                    activeScheduleIndex === index
                                        ? 'text-blue-700'
                                        : 'text-slate-500'
                                )}
                            >
                                <Clock className="h-3 w-3" />
                                {getScheduleStartTime(schedule)}
                            </div>

                            {/* Schedule Name */}
                            <div className="flex-1 truncate text-sm font-medium">
                                {schedule.name || `Schedule ${index + 1}`}
                            </div>

                            {/* Actions (shown on hover or when active) */}
                            <div
                                className={cn(
                                    'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                                    activeScheduleIndex === index && 'opacity-100'
                                )}
                            >
                                <button
                                    onClick={(e) => handleDuplicateSchedule(index, e)}
                                    title="Duplicate this schedule"
                                    className={cn(
                                        'p-1 rounded transition-colors',
                                        activeScheduleIndex === index
                                            ? 'text-blue-700 hover:text-blue-900 hover:bg-blue-200'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>

                                {schedules.length > 1 && (
                                    <button
                                        onClick={(e) => handleRemoveClick(index, e)}
                                        title="Remove this schedule"
                                        className={cn(
                                            'p-1 rounded transition-colors',
                                            activeScheduleIndex === index
                                                ? 'text-blue-700 hover:text-rose-600 hover:bg-rose-100'
                                                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                        )}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}