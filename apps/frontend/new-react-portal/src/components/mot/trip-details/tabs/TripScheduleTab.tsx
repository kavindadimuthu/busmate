'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { TripResponse, ScheduleResponse } from '@busmate/api-client-route';

interface TripScheduleTabProps {
  trip: TripResponse;
  schedule?: ScheduleResponse | null;
  onRefresh?: () => void;
}

export function TripScheduleTab({ trip, schedule, onRefresh }: TripScheduleTabProps) {
  // Helper function to format date
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

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timeString || '--:--';
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (!schedule) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Schedule Information</h3>
        <p className="text-muted-foreground mb-6">
          Schedule details are not available for this trip.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">Schedule Overview</h3>
          {getStatusBadge(schedule.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Schedule Name</label>
            <p className="text-sm text-foreground">{schedule.name || 'Unnamed Schedule'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Effective Period</label>
            <div className="text-sm text-foreground">
              <div>From: {formatDate(schedule.effectiveStartDate)}</div>
              <div>To: {formatDate(schedule.effectiveEndDate)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Schedule Type</label>
            <p className="text-sm text-foreground">
              {schedule.scheduleType || 'Regular'}
            </p>
          </div>
        </div>

        {schedule.description && (
          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
            <p className="text-sm text-foreground/80">{schedule.description}</p>
          </div>
        )}
      </div>

      {/* Schedule Stops */}
      {schedule.scheduleStops && schedule.scheduleStops.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            Schedule Stops ({schedule.scheduleStops.length})
          </h3>
          <div className="bg-card border border-border rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              {schedule.scheduleStops
                .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
                .map((stop, index) => (
                  <div key={stop.id || index} className="border-b border-border last:border-b-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="shrink-0">
                            <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{index + 1}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {stop.stopName || 'Unnamed Stop'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                              {stop.stopOrder !== undefined && (
                                <span>Order: {stop.stopOrder}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Arrival:</span>
                              <span className="ml-2 text-foreground">{formatTime(stop.arrivalTime)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Departure:</span>
                              <span className="ml-2 text-foreground">{formatTime(stop.departureTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Rules */}
      {schedule.scheduleCalendars && schedule.scheduleCalendars.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            Calendar Rules ({schedule.scheduleCalendars.length})
          </h3>
          <div className="space-y-4">
            {schedule.scheduleCalendars.map((calendar, index) => {
              const operatingDays = [];
              if (calendar.monday) operatingDays.push('Mon');
              if (calendar.tuesday) operatingDays.push('Tue');
              if (calendar.wednesday) operatingDays.push('Wed');
              if (calendar.thursday) operatingDays.push('Thu');
              if (calendar.friday) operatingDays.push('Fri');
              if (calendar.saturday) operatingDays.push('Sat');
              if (calendar.sunday) operatingDays.push('Sun');

              return (
                <div key={calendar.id || index} className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Calendar Rule {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-foreground/80">Operating Days:</span>
                          <div className="text-muted-foreground mt-1">
                            {operatingDays.length > 0 ? operatingDays.join(', ') : 'None'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Exceptions */}
      {schedule.scheduleExceptions && schedule.scheduleExceptions.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">
            Schedule Exceptions ({schedule.scheduleExceptions.length})
          </h3>
          <div className="space-y-4">
            {schedule.scheduleExceptions.map((exception, index) => (
              <div key={exception.id || index} className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-warning/70 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">
                        {exception.exceptionType || 'Exception'} - {formatDate(exception.exceptionDate)}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-muted text-foreground/80 text-sm font-medium rounded-md hover:bg-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Schedule Details
          </button>
        )}
      </div>
    </div>
  );
}