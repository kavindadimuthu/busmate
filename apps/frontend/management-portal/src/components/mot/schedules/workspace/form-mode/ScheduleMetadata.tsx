'use client';

import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { ScheduleTypeEnum, ScheduleStatusEnum, ScheduleCalendar } from '@/types/ScheduleWorkspaceData';

export default function ScheduleMetadata() {
    const {
        getActiveSchedule,
        updateActiveSchedule,
        updateCalendar,
        setWeekdaysOnly,
        setWeekendsOnly,
        setAllDays,
        activeScheduleIndex,
    } = useScheduleWorkspace();

    const activeSchedule = getActiveSchedule();

    // Don't render if no active schedule
    if (!activeSchedule || activeScheduleIndex === null) {
        return (
            <div className="flex flex-col rounded-lg p-5 bg-white border border-slate-200 shadow-sm w-3/5">
                <span className="text-sm text-slate-500">No schedule selected</span>
            </div>
        );
    }

    const { calendar } = activeSchedule;

    const daysOfWeek = [
        { key: 'monday', label: 'Monday', short: 'Mon' },
        { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
        { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
        { key: 'thursday', label: 'Thursday', short: 'Thu' },
        { key: 'friday', label: 'Friday', short: 'Fri' },
        { key: 'saturday', label: 'Saturday', short: 'Sat' },
        { key: 'sunday', label: 'Sunday', short: 'Sun' },
    ] as const;

    const handleDayToggle = (day: keyof ScheduleCalendar) => {
        updateCalendar({ [day]: !calendar[day] });
    };

    return (
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm w-3/5 overflow-hidden">
            {/* Section Header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">
                    Schedule Metadata
                </h3>
                <span className="text-xs text-slate-500">
                    Editing: {activeSchedule.name || `Schedule ${activeScheduleIndex + 1}`}
                </span>
            </div>

            <form className="flex flex-col gap-5 p-5" onSubmit={(e) => e.preventDefault()}>
                {/* First row: Name, Schedule Type, Status */}
                <div className="flex flex-row gap-4">
                    {/* Schedule name */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Schedule Name *</label>
                        <input
                            type="text"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={activeSchedule.name}
                            onChange={(e) => updateActiveSchedule({ name: e.target.value })}
                            placeholder="Enter schedule name"
                        />
                    </div>
                    {/* scheduleType */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Schedule Type</label>
                        <select
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={activeSchedule.scheduleType}
                            onChange={(e) => updateActiveSchedule({ scheduleType: e.target.value as ScheduleTypeEnum })}
                        >
                            <option value={ScheduleTypeEnum.REGULAR}>Regular</option>
                            <option value={ScheduleTypeEnum.SPECIAL}>Special</option>
                        </select>
                    </div>
                    {/* ScheduleStatus */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                        <select
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={activeSchedule.status}
                            onChange={(e) => updateActiveSchedule({ status: e.target.value as ScheduleStatusEnum })}
                        >
                            <option value={ScheduleStatusEnum.PENDING}>Pending</option>
                            <option value={ScheduleStatusEnum.ACTIVE}>Active</option>
                            <option value={ScheduleStatusEnum.INACTIVE}>Inactive</option>
                            <option value={ScheduleStatusEnum.CANCELLED}>Cancelled</option>
                        </select>
                    </div>
                </div>
                {/* Second row: Start Date, End Date, Description */}
                <div className="flex flex-row gap-4">
                    {/* Start Date */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date *</label>
                        <input
                            type="date"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={activeSchedule.effectiveStartDate}
                            onChange={(e) => updateActiveSchedule({ effectiveStartDate: e.target.value })}
                        />
                    </div>
                    {/* End Date */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
                        <input
                            type="date"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={activeSchedule.effectiveEndDate || ''}
                            onChange={(e) => updateActiveSchedule({ effectiveEndDate: e.target.value })}
                        />
                    </div>
                    {/* Description */}
                    <div className="flex flex-col flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
                        <textarea
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                            value={activeSchedule.description || ''}
                            onChange={(e) => updateActiveSchedule({ description: e.target.value })}
                            rows={1}
                            placeholder="Optional description"
                        />
                    </div>
                </div>
                {/* Third row: Operating Days with quick actions */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-slate-600">Operating Days</label>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={setWeekdaysOnly}
                                className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
                            >
                                Weekdays
                            </button>
                            <button
                                type="button"
                                onClick={setWeekendsOnly}
                                className="text-xs px-2.5 py-1 bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors font-medium"
                            >
                                Weekends
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllDays(true)}
                                className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors font-medium"
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setAllDays(false)}
                                className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors font-medium"
                            >
                                None
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                        {daysOfWeek.map(day => (
                            <label key={day.key} className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={calendar[day.key]}
                                    onChange={() => handleDayToggle(day.key)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer transition-colors"
                                />
                                <span className="text-sm text-slate-600 ml-2 group-hover:text-slate-900 transition-colors">{day.short}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {/* Generate Trips toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                        type="checkbox"
                        id="generateTrips"
                        checked={activeSchedule.generateTrips ?? false}
                        onChange={(e) => updateActiveSchedule({ generateTrips: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="generateTrips" className="text-sm text-slate-600 cursor-pointer">
                        Automatically generate trips for this schedule
                    </label>
                </div>
            </form>
        </div>
    );
}