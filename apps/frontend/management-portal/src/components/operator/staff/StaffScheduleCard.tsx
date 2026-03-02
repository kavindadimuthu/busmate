'use client';

import { CalendarDays } from 'lucide-react';
import type { WeeklySchedule } from '@/data/operator/staff';

interface StaffScheduleCardProps {
  schedule: WeeklySchedule[];
}

export function StaffScheduleCard({ schedule }: StaffScheduleCardProps) {
  // Sort by dayOfWeek starting Monday (1)
  const ordered = [...schedule].sort((a, b) => {
    // Convert Sunday (0) to 7 to sort last
    const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return dayA - dayB;
  });

  const workingDays   = ordered.filter(d => d.isWorkingDay).length;
  const nonWorkingDays = ordered.filter(d => !d.isWorkingDay).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-900">Weekly Schedule</h2>
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            {workingDays} working
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />
            {nonWorkingDays} off
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-2">
          {ordered.map(day => (
            <div
              key={day.dayOfWeek}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                day.isWorkingDay ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'
              }`}
            >
              {/* Day */}
              <div className="w-20 shrink-0">
                <span className={`text-sm font-medium ${day.isWorkingDay ? 'text-indigo-900' : 'text-gray-400'}`}>
                  {day.dayName}
                </span>
              </div>

              {/* Status / hours */}
              {day.isWorkingDay ? (
                <div className="flex-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-indigo-800">
                    <span className="font-mono font-medium">{day.shiftStart}</span>
                    <span className="text-indigo-400">–</span>
                    <span className="font-mono font-medium">{day.shiftEnd}</span>
                  </div>
                  {day.routeNumber && (
                    <span className="text-xs bg-white border border-indigo-200 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {day.routeNumber}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">Day off</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
