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
import { ScheduleResponse, RouteResponse } from '@busmate/api-client-route';

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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success/15 text-success">
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground">
            <Pause className="w-4 h-4 mr-1" />
            Inactive
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning/15 text-warning">
            <AlertCircle className="w-4 h-4 mr-1" />
            Draft
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-destructive/15 text-destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
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
    <div className="bg-card shadow rounded-lg">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {schedule.name || 'Unnamed Schedule'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
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
            <h3 className="text-lg font-medium text-foreground mb-4">Schedule Information</h3>
            <div className="space-y-4">
              {/* Description */}
              {schedule.description && (
                <div className='bg-muted p-4 rounded-lg'>
                  <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm text-foreground">{schedule.description}</dd>
                </div>
              )}

              {/* Route Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <Route className="w-4 h-4 mr-2" />
                    Route
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {route ? (
                      <div>
                        <div className="font-medium">{route.name}</div>
                      </div>
                    ) : schedule.routeName ? (
                      <div className="font-medium">{schedule.routeName}</div>
                    ) : schedule.routeId ? (
                      <span className="text-muted-foreground">Route ID: {schedule.routeId}</span>
                    ) : (
                      <span className="text-muted-foreground/70">No route assigned</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Route Group
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {schedule.routeGroupName || 'Not specified'}
                  </dd>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Effective From
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDate(schedule.effectiveStartDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Effective To
                  </dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDate(schedule.effectiveEndDate)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-foreground mb-4">Key Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Trips */}
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center">
                  <Bus className="w-8 h-8 text-primary" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-primary">Total Trips</p>
                    <p className="text-2xl font-bold text-primary">{tripsCount}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Type */}
              {schedule.scheduleType && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-muted-foreground" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p className="text-lg font-bold text-foreground capitalize">
                        {schedule.scheduleType.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Stops Count */}
              {schedule.scheduleStops && (
                <div className="bg-success/10 rounded-lg p-4">
                  <div className="flex items-center">
                    <MapPin className="w-8 h-8 text-success" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-success">Stops</p>
                      <p className="text-2xl font-bold text-success">
                        {schedule.scheduleStops.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Rules */}
              {schedule.scheduleCalendars && (
                <div className="bg-[hsl(var(--purple-50))] rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-[hsl(var(--purple-600))]" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-[hsl(var(--purple-600))]">Calendar Rules</p>
                      <p className="text-2xl font-bold text-[hsl(var(--purple-900))]">
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
        <div className="px-6 py-4 bg-muted border-t border-border">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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