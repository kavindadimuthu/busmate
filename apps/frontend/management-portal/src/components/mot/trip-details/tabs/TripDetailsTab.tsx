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
import type {
  TripResponse,
  RouteResponse,
  ScheduleResponse,
  PassengerServicePermitResponse,
} from '@busmate/api-client-route';

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
        <h3 className="text-lg font-medium text-foreground mb-4">Trip Timeline</h3>
        <div className="bg-muted rounded-lg p-6">
          <div className="space-y-6">
            {/* Departure */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-success/15 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-success" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Departure</h4>
                  <span className="text-sm text-muted-foreground">
                    {route?.startStopName || 'Start Stop'}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      Scheduled: {formatTime(trip.scheduledDepartureTime)}
                    </span>
                    {trip.actualDepartureTime && (
                      <span className="text-sm text-muted-foreground">
                        Actual: {formatTime(trip.actualDepartureTime)}
                        {departureDelay !== null && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            departureDelay > 0 ? 'bg-destructive/15 text-destructive' : 
                            departureDelay < 0 ? 'bg-success/15 text-success' : 
                            'bg-muted text-foreground'
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
                <div className="w-0.5 h-8 bg-secondary"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">
                  {route?.distanceKm && `${route.distanceKm} km`}
                  {route?.estimatedDurationMinutes && ` • ${route.estimatedDurationMinutes} min estimated`}
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-primary/15 rounded-full flex items-center justify-center">
                  <Pause className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Arrival</h4>
                  <span className="text-sm text-muted-foreground">
                    {route?.endStopName || 'End Stop'}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      Scheduled: {formatTime(trip.scheduledArrivalTime)}
                    </span>
                    {trip.actualArrivalTime && (
                      <span className="text-sm text-muted-foreground">
                        Actual: {formatTime(trip.actualArrivalTime)}
                        {arrivalDelay !== null && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            arrivalDelay > 0 ? 'bg-destructive/15 text-destructive' : 
                            arrivalDelay < 0 ? 'bg-success/15 text-success' : 
                            'bg-muted text-foreground'
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
          <h3 className="text-lg font-medium text-foreground mb-4">Basic Information</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Trip ID</label>
                <p className="mt-1 text-sm text-foreground font-mono">{trip.id || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Status</label>
                <p className="mt-1 text-sm text-foreground capitalize">{trip.status || 'Unknown'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Trip Date</label>
                <p className="mt-1 text-sm text-foreground">{formatDate(trip.tripDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Route Group</label>
                <p className="mt-1 text-sm text-foreground">{trip.routeGroupName || 'N/A'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Route</label>
              <p className="mt-1 text-sm text-foreground">{trip.routeName || 'N/A'}</p>
              {route && (
                <p className="text-xs text-muted-foreground mt-1">
                  {route.startStopName} → {route.endStopName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Schedule</label>
              <p className="mt-1 text-sm text-foreground">{trip.scheduleName || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Operator</label>
              <p className="mt-1 text-sm text-foreground">{trip.operatorName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Assignment Details</h3>
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Passenger Service Permit</label>
              <p className="mt-1 text-sm text-foreground">
                {trip.passengerServicePermitNumber || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Bus</label>
              <p className="mt-1 text-sm text-foreground">
                {trip.busPlateNumber || 'Not assigned'}
              </p>
              {trip.busModel && (
                <p className="text-xs text-muted-foreground mt-1">Model: {trip.busModel}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Driver</label>
                <p className="mt-1 text-sm text-foreground">{trip.driverId || 'Not assigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Conductor</label>
                <p className="mt-1 text-sm text-foreground">{trip.conductorId || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {trip.notes && (
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Additional Notes</h3>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex">
              <FileText className="h-5 w-5 text-warning/70 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-foreground/80">{trip.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Information */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Audit Information</h3>
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {trip.createdAt && (
              <div className="flex items-start space-x-3">
                <User className="h-4 w-4 text-muted-foreground/70 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Created</p>
                  <p className="text-muted-foreground">{formatDateTime(trip.createdAt)}</p>
                  {trip.createdBy && <p className="text-muted-foreground">by {trip.createdBy}</p>}
                </div>
              </div>
            )}
            {trip.updatedAt && (
              <div className="flex items-start space-x-3">
                <User className="h-4 w-4 text-muted-foreground/70 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Last Updated</p>
                  <p className="text-muted-foreground">{formatDateTime(trip.updatedAt)}</p>
                  {trip.updatedBy && <p className="text-muted-foreground">by {trip.updatedBy}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}