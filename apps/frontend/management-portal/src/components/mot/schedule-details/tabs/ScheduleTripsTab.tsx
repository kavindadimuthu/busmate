'use client';

import { Bus, Plus, RefreshCw, Eye, Edit, Play, Square } from 'lucide-react';
import { ScheduleResponse, TripResponse } from '../../../../../generated/api-clients/route-management';

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
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Scheduled
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">Loading trips...</span>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Bus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Trips Generated</h3>
        <p className="text-gray-500 mb-6">
          No trips have been generated from this schedule yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button 
            onClick={onGenerateTrips}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Trips
          </button>
          <button 
            onClick={onAssignBuses}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
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
          <h3 className="text-lg font-medium text-gray-900">Generated Trips</h3>
          <p className="mt-1 text-sm text-gray-500">
            {trips.length} trips generated from this schedule
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <button 
            onClick={onRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={onGenerateTrips}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate More
          </button>
          <button 
            onClick={onAssignBuses}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
          >
            <Bus className="w-4 h-4 mr-2" />
            Assign Buses
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {trip.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(trip.tripDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {formatTime(trip.scheduledDepartureTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {formatTime(trip.scheduledArrivalTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(trip.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trip.busId || (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    {trip.status === 'SCHEDULED' && (
                      <button className="text-green-600 hover:text-green-900">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {trip.status === 'ACTIVE' && (
                      <button className="text-red-600 hover:text-red-900">
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
            <div key={status} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{status.toLowerCase()}</div>
              <div className="text-xs text-gray-400">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}