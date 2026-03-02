'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  FileText,
  User
} from 'lucide-react';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import type { RouteResponse } from '../../../../../generated/api-clients/route-management/models/RouteResponse';
import type { ScheduleResponse } from '../../../../../generated/api-clients/route-management/models/ScheduleResponse';
import type { PassengerServicePermitResponse } from '../../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';

interface TripDetailsTabProps {
  trip: TripResponse;
  route?: RouteResponse | null;
  schedule?: ScheduleResponse | null;
  permit?: PassengerServicePermitResponse | null;
}

export function TripDetailsTab({ trip, route, schedule, permit }: TripDetailsTabProps) {
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

  // Helper function to format datetime
  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return 'Not set';
    try {
      return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Calculate delays
  const calculateDelay = (scheduled?: string, actual?: string) => {
    if (!scheduled || !actual) return null;
    
    try {
      const scheduledTime = new Date(`1970-01-01T${scheduled}`);
      const actualTime = new Date(`1970-01-01T${actual}`);
      const diffMs = actualTime.getTime() - scheduledTime.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      return diffMins;
    } catch {
      return null;
    }
  };

  const departureDelay = calculateDelay(trip.scheduledDepartureTime, trip.actualDepartureTime);
  const arrivalDelay = calculateDelay(trip.scheduledArrivalTime, trip.actualArrivalTime);

  return (
    <div className="space-y-8">
      {/* Trip Timeline */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Timeline</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="space-y-6">
            {/* Departure */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Departure</h4>
                  <span className="text-sm text-gray-500">
                    {route?.startStopName || 'Start Stop'}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Scheduled: {formatTime(trip.scheduledDepartureTime)}
                    </span>
                    {trip.actualDepartureTime && (
                      <span className="text-sm text-gray-600">
                        Actual: {formatTime(trip.actualDepartureTime)}
                        {departureDelay !== null && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            departureDelay > 0 ? 'bg-red-100 text-red-800' : 
                            departureDelay < 0 ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {departureDelay > 0 && '+'}
                            {departureDelay} min
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Line */}
            <div className="flex items-center space-x-4">
              <div className="shrink-0 w-8 flex justify-center">
                <div className="w-0.5 h-8 bg-gray-300"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">
                  {route?.distanceKm && `${route.distanceKm} km`}
                  {route?.estimatedDurationMinutes && ` • ${route.estimatedDurationMinutes} min estimated`}
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Pause className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Arrival</h4>
                  <span className="text-sm text-gray-500">
                    {route?.endStopName || 'End Stop'}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Scheduled: {formatTime(trip.scheduledArrivalTime)}
                    </span>
                    {trip.actualArrivalTime && (
                      <span className="text-sm text-gray-600">
                        Actual: {formatTime(trip.actualArrivalTime)}
                        {arrivalDelay !== null && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            arrivalDelay > 0 ? 'bg-red-100 text-red-800' : 
                            arrivalDelay < 0 ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {arrivalDelay > 0 && '+'}
                            {arrivalDelay} min
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Trip ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{trip.id || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{trip.status || 'Unknown'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Trip Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(trip.tripDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Route Group</label>
                <p className="mt-1 text-sm text-gray-900">{trip.routeGroupName || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Route</label>
              <p className="mt-1 text-sm text-gray-900">{trip.routeName || 'N/A'}</p>
              {route && (
                <p className="text-xs text-gray-500 mt-1">
                  {route.startStopName} → {route.endStopName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Schedule</label>
              <p className="mt-1 text-sm text-gray-900">{trip.scheduleName || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Operator</label>
              <p className="mt-1 text-sm text-gray-900">{trip.operatorName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Passenger Service Permit</label>
              <p className="mt-1 text-sm text-gray-900">
                {trip.passengerServicePermitNumber || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Bus</label>
              <p className="mt-1 text-sm text-gray-900">
                {trip.busPlateNumber || 'Not assigned'}
              </p>
              {trip.busModel && (
                <p className="text-xs text-gray-500 mt-1">Model: {trip.busModel}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Driver</label>
                <p className="mt-1 text-sm text-gray-900">{trip.driverId || 'Not assigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Conductor</label>
                <p className="mt-1 text-sm text-gray-900">{trip.conductorId || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {trip.notes && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <FileText className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-gray-700">{trip.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Information</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {trip.createdAt && (
              <div className="flex items-start space-x-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Created</p>
                  <p className="text-gray-600">{formatDateTime(trip.createdAt)}</p>
                  {trip.createdBy && <p className="text-gray-500">by {trip.createdBy}</p>}
                </div>
              </div>
            )}
            {trip.updatedAt && (
              <div className="flex items-start space-x-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Last Updated</p>
                  <p className="text-gray-600">{formatDateTime(trip.updatedAt)}</p>
                  {trip.updatedBy && <p className="text-gray-500">by {trip.updatedBy}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}