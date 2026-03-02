'use client';

import { useState } from 'react';
import {
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { ScheduleResponse, RouteResponse } from '../../../../../generated/api-clients/route-management';
import { useRouter } from 'next/navigation';

interface ScheduleStopsTabProps {
  schedule: ScheduleResponse;
  route?: RouteResponse | null;
}

export function ScheduleStopsTab({ schedule, route }: ScheduleStopsTabProps) {
  const router = useRouter();
  const scheduleStops = schedule.scheduleStops || [];
  const [showOnlyWithTimings, setShowOnlyWithTimings] = useState(false);

  // Helper function to format time
  const formatTime = (timeString?: string | null) => {
    if (!timeString) return '--:--';
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return timeString;
    }
  };

  // Helper function to calculate duration between stops
  const calculateDuration = (arrivalTime?: string | null, departureTime?: string | null) => {
    if (!arrivalTime || !departureTime) return null;

    try {
      const arrival = new Date(`1970-01-01T${arrivalTime}`);
      const departure = new Date(`1970-01-01T${departureTime}`);
      const diffMs = departure.getTime() - arrival.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));

      if (diffMins > 0) {
        return `${diffMins}m`;
      }
      return null;
    } catch {
      return null;
    }
  };

  if (scheduleStops.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Stops</h3>
        <p className="text-gray-500 mb-6">
          This schedule doesn't have any stops configured yet.
        </p>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule Stops
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Schedule Stops</h3>
          <p className="mt-1 text-sm text-gray-500">
            {scheduleStops.length} stops configured for this schedule
          </p>
        </div>
        <div className="flex items-center space-x-3  border border-blue-200 rounded-lg px-4 py-2">
          <input
            type="checkbox"
            id="showOnlyWithTimings"
            checked={showOnlyWithTimings}
            onChange={(e) => setShowOnlyWithTimings(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
          <label htmlFor="showOnlyWithTimings" className="flex-1 cursor-pointer text-sm text-gray-700">
            <span className="font-medium">Show only stops with timings</span>
          </label>
        </div>
      </div>

      {/* Stops List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {scheduleStops
            .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0))
            .filter(stop => {
              if (showOnlyWithTimings) {
                return stop.arrivalTime || stop.departureTime;
              }
              return true;
            })
            .map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === scheduleStops.length - 1;

              return (
                <div
                  key={stop.id || index}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Stop Number Badge */}
                  <div className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                    {stop.stopOrder || index + 1}
                  </div>

                  {/* Stop Name */}
                  <div className="flex-1 min-w-0 ml-4">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {stop.stopName || `Stop ${stop.stopOrder || index + 1}`}
                    </h4>
                  </div>

                  {/* Arrival Time */}
                  <div className="shrink-0 ml-4 text-center min-w-[80px]">
                    <div className="text-xs text-gray-500 mb-1">Arrival</div>
                    <div className="text-sm font-mono text-gray-900">
                      {formatTime(stop.arrivalTime)}
                    </div>
                  </div>

                  {/* Departure Time */}
                  <div className="shrink-0 ml-4 text-center min-w-[80px]">
                    <div className="text-xs text-gray-500 mb-1">Departure</div>
                    <div className="text-sm font-mono text-gray-900">
                      {formatTime(stop.departureTime)}
                    </div>
                  </div>

                  {/* Dwell Time */}
                  <div className="shrink-0 ml-4 text-center min-w-[70px]">
                    <div className="text-xs text-gray-500 mb-1">Dwell</div>
                    <div className="text-sm text-gray-900">
                      {calculateDuration(stop.arrivalTime, stop.departureTime) || '--'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="shrink-0 ml-6 flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/mot/bus-stops/${stop.stopId}`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View stop details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/mot/bus-stops/${stop.stopId}/edit`)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Edit stop"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">{scheduleStops.length}</div>
            <div className="text-blue-600">Total Stops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {formatTime(scheduleStops[0]?.departureTime)}
            </div>
            <div className="text-blue-600">Departure from start</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-900">
              {formatTime(scheduleStops[scheduleStops.length - 1]?.arrivalTime)}
            </div>
            <div className="text-blue-600">Arrival at end</div>
          </div>
        </div>
      </div>
    </div>
  );
}