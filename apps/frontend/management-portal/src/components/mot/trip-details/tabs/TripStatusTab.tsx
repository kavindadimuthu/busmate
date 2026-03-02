'use client';

import React from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  Square,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';

interface TripStatusTabProps {
  trip: TripResponse;
  onRefresh?: () => void;
}

export function TripStatusTab({ trip, onRefresh }: TripStatusTabProps) {
  // Helper function to format datetime
  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return 'Not recorded';
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

  // Helper function to get status icon and color
  const getStatusDisplay = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: 'Pending'
        };
      case 'active':
      case 'in_transit':
      case 'boarding':
      case 'departed':
        return {
          icon: Play,
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: status.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Cancelled'
        };
      case 'delayed':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200',
          label: 'Delayed'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
          label: status || 'Unknown'
        };
    }
  };

  const statusDisplay = getStatusDisplay(trip.status);
  const StatusIcon = statusDisplay.icon;

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

  // Mock status history - in a real app, this would come from the API
  const statusHistory = [
    {
      status: 'pending',
      timestamp: trip.createdAt,
      user: trip.createdBy,
      description: 'Trip created and scheduled'
    },
    ...(trip.actualDepartureTime ? [{
      status: 'departed',
      timestamp: trip.actualDepartureTime,
      user: 'System',
      description: 'Trip departed from start location'
    }] : []),
    ...(trip.actualArrivalTime ? [{
      status: 'completed',
      timestamp: trip.actualArrivalTime,
      user: 'System',
      description: 'Trip completed at destination'
    }] : []),
    ...(trip.updatedAt && trip.updatedAt !== trip.createdAt ? [{
      status: trip.status,
      timestamp: trip.updatedAt,
      user: trip.updatedBy,
      description: `Trip status updated to ${trip.status}`
    }] : [])
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border rounded-lg p-6`}>
        <div className="flex items-center space-x-4">
          <div className={`${statusDisplay.bgColor} rounded-full p-3`}>
            <StatusIcon className={`h-8 w-8 ${statusDisplay.color}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Current Status</h3>
            <p className={`text-lg font-medium ${statusDisplay.color}`}>
              {statusDisplay.label}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Trip Progress</h3>
        
        <div className="space-y-6">
          {/* Scheduled vs Actual Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departure */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Departure</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatTime(trip.scheduledDepartureTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actual:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(trip.actualDepartureTime) || 'Not recorded'}
                    </span>
                    {departureDelay !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        departureDelay > 0 ? 'bg-red-100 text-red-800' : 
                        departureDelay < 0 ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {departureDelay > 0 && '+'}
                        {departureDelay}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Arrival</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Scheduled:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatTime(trip.scheduledArrivalTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actual:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTime(trip.actualArrivalTime) || 'Not recorded'}
                    </span>
                    {arrivalDelay !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        arrivalDelay > 0 ? 'bg-red-100 text-red-800' : 
                        arrivalDelay < 0 ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {arrivalDelay > 0 && '+'}
                        {arrivalDelay}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {(departureDelay !== null || arrivalDelay !== null) && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-3">Performance Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departureDelay !== null && (
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Departure Variance</p>
                    <p className={`text-lg font-semibold ${
                      departureDelay > 0 ? 'text-red-600' : 
                      departureDelay < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {departureDelay > 0 && '+'}
                      {departureDelay} minutes
                    </p>
                  </div>
                )}
                {arrivalDelay !== null && (
                  <div className="text-center p-3 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-600">Arrival Variance</p>
                    <p className={`text-lg font-semibold ${
                      arrivalDelay > 0 ? 'text-red-600' : 
                      arrivalDelay < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {arrivalDelay > 0 && '+'}
                      {arrivalDelay} minutes
                    </p>
                  </div>
                )}
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600">On-Time Performance</p>
                  <p className={`text-lg font-semibold ${
                    (departureDelay || 0) <= 5 && (arrivalDelay || 0) <= 5 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(departureDelay || 0) <= 5 && (arrivalDelay || 0) <= 5 ? 'On Time' : 'Delayed'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Status History</h3>
        
        {statusHistory.length > 0 ? (
          <div className="space-y-4">
            {statusHistory.map((entry, index) => {
              const entryStatusDisplay = getStatusDisplay(entry.status);
              const EntryIcon = entryStatusDisplay.icon;
              
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="shrink-0">
                    <div className={`w-8 h-8 ${entryStatusDisplay.bgColor} rounded-full flex items-center justify-center`}>
                      <EntryIcon className={`w-4 h-4 ${entryStatusDisplay.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {entryStatusDisplay.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    {entry.user && (
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">by {entry.user}</p>
                      </div>
                    )}
                  </div>
                  {index < statusHistory.length - 1 && (
                    <div className="absolute ml-4 mt-8 w-0.5 h-4 bg-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Status History</h4>
            <p className="text-gray-500">Status changes will appear here as the trip progresses.</p>
          </div>
        )}
      </div>

      {/* Trip Notes */}
      {trip.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Notes</h3>
              <p className="text-gray-700">{trip.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {onRefresh && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status Information
          </button>
        </div>
      )}
    </div>
  );
}