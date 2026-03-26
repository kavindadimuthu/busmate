'use client';

import { Bus, Plus, RefreshCw, Eye, Edit, Play, Square } from 'lucide-react';
import { ScheduleResponse, TripResponse } from '@busmate/api-client-route';

interface ScheduleTripsTabProps {
  schedule: ScheduleResponse;
  trips: TripResponse[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onGenerateTrips?: () => void;
  onAssignBuses?: () => void;
}

export function ScheduleTripsTab({ 
  schedule, 
  trips, 
  isLoading = false,
  onRefresh,
  onGenerateTrips,
  onAssignBuses 
}: ScheduleTripsTabProps) {
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

  const getStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">
            Scheduled
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading trips...</span>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Bus className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Trips Generated</h3>
        <p className="text-muted-foreground mb-6">
          No trips have been generated from this schedule yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button 
            onClick={onGenerateTrips}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Trips
          </button>
          <button 
            onClick={onAssignBuses}
            className="inline-flex items-center px-4 py-2 border border-border text-foreground/80 rounded-md hover:bg-muted"
          >
            <Bus className="w-4 h-4 mr-2" />
            Assign Buses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Generated Trips</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {trips.length} trips generated from this schedule
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button 
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 border border-border text-foreground/80 rounded-md hover:bg-muted text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={onGenerateTrips}
            className="inline-flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate More
          </button>
          <button 
            onClick={onAssignBuses}
            className="inline-flex items-center px-3 py-2 border border-border text-foreground/80 rounded-md hover:bg-muted text-sm"
          >
            <Bus className="w-4 h-4 mr-2" />
            Assign Buses
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trip ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-muted">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  {trip.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(trip.tripDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                  {formatTime(trip.scheduledDepartureTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">
                  {formatTime(trip.scheduledArrivalTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(trip.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {trip.busId || (
                    <span className="text-muted-foreground/70">Not assigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="text-primary hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground hover:text-foreground">
                      <Edit className="w-4 h-4" />
                    </button>
                    {trip.status === 'SCHEDULED' && (
                      <button className="text-success hover:text-success">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {trip.status === 'ACTIVE' && (
                      <button className="text-destructive hover:text-destructive">
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((status) => {
          const count = trips.filter(trip => trip.status?.toUpperCase() === status).length;
          const percentage = trips.length > 0 ? Math.round((count / trips.length) * 100) : 0;
          
          return (
            <div key={status} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">{status.toLowerCase()}</div>
              <div className="text-xs text-muted-foreground/70">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}