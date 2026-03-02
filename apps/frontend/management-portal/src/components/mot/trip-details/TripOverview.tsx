'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Bus, 
  User, 
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Users,
  Route
} from 'lucide-react';
import type { TripResponse } from '../../../../generated/api-clients/route-management/models/TripResponse';
import type { RouteResponse } from '../../../../generated/api-clients/route-management/models/RouteResponse';
import type { ScheduleResponse } from '../../../../generated/api-clients/route-management/models/ScheduleResponse';
import type { PassengerServicePermitResponse } from '../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';

interface TripOverviewProps {
  trip: TripResponse;
  route?: RouteResponse | null;
  schedule?: ScheduleResponse | null;
  permit?: PassengerServicePermitResponse | null;
}

export function TripOverview({ trip, route, schedule, permit }: TripOverviewProps) {
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'ACTIVE':
      case 'IN_TRANSIT':
      case 'BOARDING':
      case 'DEPARTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Play className="w-4 h-4 mr-1" />
            {status.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-4 h-4 mr-1" />
            Cancelled
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
            <AlertCircle className="w-4 h-4 mr-1" />
            Delayed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <Clock className="w-4 h-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
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

  // Helper function to calculate duration
  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return null;
    
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins > 0) {
        const hours = Math.floor(diffMins / 60);
        const minutes = diffMins % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const duration = calculateDuration(trip.scheduledDepartureTime, trip.scheduledArrivalTime);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trip Overview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Complete details and current status of this trip
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge(trip.status || 'PENDING')}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Trip Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Trip Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Trip Date</p>
                  <p className="text-sm text-gray-900">{formatDate(trip.tripDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Scheduled Times</p>
                  <div className="text-sm text-gray-900">
                    <div>Departure: {formatTime(trip.scheduledDepartureTime)}</div>
                    <div>Arrival: {formatTime(trip.scheduledArrivalTime)}</div>
                    {duration && <div className="text-gray-500">Duration: {duration}</div>}
                  </div>
                </div>
              </div>

              {(trip.actualDepartureTime || trip.actualArrivalTime) && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Actual Times</p>
                    <div className="text-sm text-gray-900">
                      <div>Departure: {formatTime(trip.actualDepartureTime) || 'Not recorded'}</div>
                      <div>Arrival: {formatTime(trip.actualArrivalTime) || 'Not recorded'}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Route className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Route</p>
                  <p className="text-sm text-gray-900">
                    {trip.routeName || 'Unknown Route'}
                  </p>
                  {route && (
                    <p className="text-xs text-gray-500 mt-1">
                      {route.startStopName} → {route.endStopName}
                      {route.distanceKm && ` • ${route.distanceKm}km`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Assignments
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Passenger Service Permit</p>
                  <p className="text-sm text-gray-900">
                    {trip.passengerServicePermitNumber || 'Not assigned'}
                  </p>
                  {permit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Operator: {permit.operatorName || 'Unknown'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Bus className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Bus</p>
                  <p className="text-sm text-gray-900">
                    {trip.busPlateNumber || 'Not assigned'}
                  </p>
                  {trip.busModel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Model: {trip.busModel}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Driver</p>
                  <p className="text-sm text-gray-900">
                    {trip.driverId || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Conductor</p>
                  <p className="text-sm text-gray-900">
                    {trip.conductorId || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Operator Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Schedule & Operator
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Schedule</p>
                  <p className="text-sm text-gray-900">
                    {trip.scheduleName || 'Unknown Schedule'}
                  </p>
                  {schedule && (
                    <p className="text-xs text-gray-500 mt-1">
                      Status: {schedule.status || 'Unknown'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Route Group</p>
                  <p className="text-sm text-gray-900">
                    {trip.routeGroupName || 'Unknown Route Group'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500">Operator</p>
                  <p className="text-sm text-gray-900">
                    {trip.operatorName || 'Unknown Operator'}
                  </p>
                </div>
              </div>

              {trip.notes && (
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900">{trip.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {(trip.createdAt || trip.updatedAt) && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {trip.createdAt && (
              <div>
                <span className="font-medium">Created:</span>{' '}
                {formatDate(trip.createdAt)}
                {trip.createdBy && <span className="text-gray-500"> by {trip.createdBy}</span>}
              </div>
            )}
            {trip.updatedAt && (
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {formatDate(trip.updatedAt)}
                {trip.updatedBy && <span className="text-gray-500"> by {trip.updatedBy}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}