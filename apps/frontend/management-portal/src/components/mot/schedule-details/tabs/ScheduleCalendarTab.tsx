'use client';

import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ScheduleResponse } from '@busmate/api-client-route';

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
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Calendar Rules</h3>
        <p className="text-muted-foreground mb-6">
          This schedule doesn't have any calendar rules configured yet.
        </p>
        <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary">
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
          <h3 className="text-lg font-medium text-foreground">Calendar Rules</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {calendars.length} calendar rules configured for this schedule
          </p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm">
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
            <div key={calendar.id || index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-base font-medium text-foreground">
                      Calendar Rule #{index + 1}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </div>

                  {/* Days of Week */}
                  {operatingDays.length > 0 && (
                    <div className="mt-3">
                      <dt className="text-sm font-medium text-muted-foreground mb-2">Operating Days</dt>
                      <div className="flex flex-wrap gap-2">
                        {operatingDays.map((day) => (
                          <span
                            key={day}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary"
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
                      <dt className="text-sm font-medium text-muted-foreground">Calendar ID</dt>
                      <dd className="text-sm text-foreground">{calendar.id}</dd>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-1 text-muted-foreground/70 hover:text-muted-foreground">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-muted-foreground/70 hover:text-destructive">
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