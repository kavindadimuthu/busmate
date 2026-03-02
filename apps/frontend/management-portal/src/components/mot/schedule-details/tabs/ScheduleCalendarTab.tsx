'use client';

import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ScheduleResponse } from '../../../../../generated/api-clients/route-management';

interface ScheduleCalendarTabProps {
  schedule: ScheduleResponse;
  onRefresh?: () => void;
}

export function ScheduleCalendarTab({ schedule, onRefresh }: ScheduleCalendarTabProps) {
  const calendars = schedule.scheduleCalendars || [];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (calendars.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Calendar Rules</h3>
        <p className="text-gray-500 mb-6">
          This schedule doesn't have any calendar rules configured yet.
        </p>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Calendar Rule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Calendar Rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            {calendars.length} calendar rules configured for this schedule
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Calendar Rules List */}
      <div className="space-y-4">
        {calendars.map((calendar, index) => {
          const operatingDays = [];
          if (calendar.monday) operatingDays.push('Monday');
          if (calendar.tuesday) operatingDays.push('Tuesday');
          if (calendar.wednesday) operatingDays.push('Wednesday');
          if (calendar.thursday) operatingDays.push('Thursday');
          if (calendar.friday) operatingDays.push('Friday');
          if (calendar.saturday) operatingDays.push('Saturday');
          if (calendar.sunday) operatingDays.push('Sunday');

          return (
            <div key={calendar.id || index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-base font-medium text-gray-900">
                      Calendar Rule #{index + 1}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </div>

                  {/* Days of Week */}
                  {operatingDays.length > 0 && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-gray-500 mb-2">Operating Days</dt>
                      <div className="flex flex-wrap gap-2">
                        {operatingDays.map((day) => (
                          <span
                            key={day}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar ID */}
                  {calendar.id && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-gray-500">Calendar ID</dt>
                      <dd className="text-sm text-gray-900">{calendar.id}</dd>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}