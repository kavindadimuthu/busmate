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
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import type { ScheduleResponse } from '../../../../../generated/api-clients/route-management/models/ScheduleResponse';

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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (!schedule) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Information</h3>
        <p className="text-gray-500 mb-6">
          Schedule details are not available for this trip.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Schedule Overview</h3>
          {getStatusBadge(schedule.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Schedule Name</label>
            <p className="text-sm text-gray-900">{schedule.name || 'Unnamed Schedule'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Effective Period</label>
            <div className="text-sm text-gray-900">
              <div>From: {formatDate(schedule.effectiveStartDate)}</div>
              <div>To: {formatDate(schedule.effectiveEndDate)}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Schedule Type</label>
            <p className="text-sm text-gray-900">
              {schedule.scheduleType || 'Regular'}
            </p>
          </div>
        </div>

        {schedule.description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
            <p className="text-sm text-gray-700">{schedule.description}</p>
          </div>
        )}
      </div>

      {/* Schedule Stops */}
      {schedule.scheduleStops && schedule.scheduleStops.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Schedule Stops ({schedule.scheduleStops.length})
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="max-h-96 overflow-y-auto">
              {schedule.scheduleStops
                .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
                .map((stop, index) => (
                  <div key={stop.id || index} className="border-b border-gray-200 last:border-b-0">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {stop.stopName || 'Unnamed Stop'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              {stop.stopOrder !== undefined && (
                                <span>Order: {stop.stopOrder}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="text-gray-500">Arrival:</span>
                              <span className="ml-2 text-gray-900">{formatTime(stop.arrivalTime)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Departure:</span>
                              <span className="ml-2 text-gray-900">{formatTime(stop.departureTime)}</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
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
                <div key={calendar.id || index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Calendar Rule {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Operating Days:</span>
                          <div className="text-gray-600 mt-1">
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Schedule Exceptions ({schedule.scheduleExceptions.length})
          </h3>
          <div className="space-y-4">
            {schedule.scheduleExceptions.map((exception, index) => (
              <div key={exception.id || index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
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
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Schedule Details
          </button>
        )}
      </div>
    </div>
  );
}