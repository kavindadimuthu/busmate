'use client';

import { 
  Clock, 
  Calendar, 
  MapPin, 
  Route, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Pause,
  Bus,
  Users
} from 'lucide-react';
import { ScheduleResponse, RouteResponse } from '../../../../generated/api-clients/route-management';

interface ScheduleOverviewProps {
  schedule: ScheduleResponse;
  route?: RouteResponse | null;
  tripsCount?: number;
}

export function ScheduleOverview({ schedule, route, tripsCount = 0 }: ScheduleOverviewProps) {
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <Pause className="w-4 h-4 mr-1" />
            Inactive
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Draft
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {status || 'Unknown'}
          </span>
        );
    }
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Not set';
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {schedule.name || 'Unnamed Schedule'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Schedule ID: {schedule.id}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {getStatusBadge(schedule.status || '')}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Information */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Information</h3>
            <div className="space-y-4">
              {/* Description */}
              {schedule.description && (
                <div className='bg-gray-50 p-4 rounded-lg'>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{schedule.description}</dd>
                </div>
              )}

              {/* Route Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Route className="w-4 h-4 mr-2" />
                    Route
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {route ? (
                      <div>
                        <div className="font-medium">{route.name}</div>
                      </div>
                    ) : schedule.routeName ? (
                      <div className="font-medium">{schedule.routeName}</div>
                    ) : schedule.routeId ? (
                      <span className="text-gray-500">Route ID: {schedule.routeId}</span>
                    ) : (
                      <span className="text-gray-400">No route assigned</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Route Group
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {schedule.routeGroupName || 'Not specified'}
                  </dd>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Effective From
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(schedule.effectiveStartDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Effective To
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(schedule.effectiveEndDate)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Trips */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Bus className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Trips</p>
                    <p className="text-2xl font-bold text-blue-900">{tripsCount}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Type */}
              {schedule.scheduleType && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-gray-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">
                        {schedule.scheduleType.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Stops Count */}
              {schedule.scheduleStops && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Stops</p>
                      <p className="text-2xl font-bold text-green-900">
                        {schedule.scheduleStops.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Rules */}
              {schedule.scheduleCalendars && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Calendar Rules</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {schedule.scheduleCalendars.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes or Metadata */}
      {(schedule.createdAt || schedule.updatedAt) && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {schedule.createdAt && (
              <div>
                Created: {formatDate(schedule.createdAt)}
              </div>
            )}
            {schedule.updatedAt && (
              <div>
                Last Updated: {formatDate(schedule.updatedAt)}
              </div>
            )}
            {schedule.createdBy && (
              <div>
                Created By: {schedule.createdBy}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}