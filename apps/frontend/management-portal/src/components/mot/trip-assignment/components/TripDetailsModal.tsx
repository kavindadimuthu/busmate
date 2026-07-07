'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, Bus, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import type { TripResponse } from '@busmate/api-client-route';

interface TripDetailsModalProps {
  trip: TripResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TripDetailsModal({
  trip,
  isOpen,
  onClose,
}: TripDetailsModalProps) {
  if (!isOpen || !trip) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTripStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-warning/15 text-warning border-warning/20';
      case 'active':
        return 'bg-success/15 text-success border-success/20';
      case 'completed':
        return 'bg-primary/15 text-primary border-primary/20';
      case 'cancelled':
        return 'bg-destructive/15 text-destructive border-destructive/20';
      case 'delayed':
        return 'bg-warning/15 text-warning border-orange-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Trip Details</h2>
              <p className="text-sm text-muted-foreground">#{trip.id?.slice(-12)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getTripStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Trip Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{formatDate(trip.tripDate)}</span>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Schedule Information</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Scheduled Departure</label>
                  <div className="text-foreground font-medium">{formatTime(trip.scheduledDepartureTime)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Scheduled Arrival</label>
                  <div className="text-foreground font-medium">{formatTime(trip.scheduledArrivalTime)}</div>
                </div>
                {trip.actualDepartureTime && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Actual Departure</label>
                    <div className="text-foreground">{formatTime(trip.actualDepartureTime)}</div>
                  </div>
                )}
                {trip.actualArrivalTime && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Actual Arrival</label>
                    <div className="text-foreground">{formatTime(trip.actualArrivalTime)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Route Information</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Route</label>
                  <div className="text-foreground">{trip.routeName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Route Group</label>
                  <div className="text-foreground">{trip.routeGroupName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Schedule</label>
                  <div className="text-foreground">{trip.scheduleName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Operator</label>
                  <div className="text-foreground">{trip.operatorName || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="bg-success/10 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Assignment Information</span>
              </h3>
              <div className="space-y-3">
                {/* PSP Assignment */}
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground/70" />
                    <div>
                      <div className="font-medium text-foreground">Passenger Service Permit</div>
                      <div className="text-sm text-muted-foreground">
                        {trip.passengerServicePermitNumber ? (
                          <span className="text-success font-medium">
                            {trip.passengerServicePermitNumber}
                          </span>
                        ) : (
                          'Not assigned'
                        )}
                      </div>
                    </div>
                  </div>
                  {trip.passengerServicePermitNumber ? (
                    <CheckCircle className="h-5 w-5 text-success/80" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                </div>

                {/* Bus Assignment */}
                <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Bus className="h-5 w-5 text-muted-foreground/70" />
                    <div>
                      <div className="font-medium text-foreground">Bus Assignment</div>
                      <div className="text-sm text-muted-foreground">
                        {trip.busPlateNumber ? (
                          <span className="font-medium">
                            {trip.busPlateNumber} {trip.busModel && `(${trip.busModel})`}
                          </span>
                        ) : (
                          'Not assigned'
                        )}
                      </div>
                    </div>
                  </div>
                  {trip.busPlateNumber ? (
                    <CheckCircle className="h-5 w-5 text-success/80" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-warning" />
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {trip.notes && (
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-2">Notes</label>
                <div className="bg-muted rounded-lg p-3 text-foreground">
                  {trip.notes}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-border pt-4">
              <h3 className="font-medium text-foreground mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-foreground/80 font-medium mb-1">Created At</label>
                  <div className="text-muted-foreground">
                    {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-foreground/80 font-medium mb-1">Updated At</label>
                  <div className="text-muted-foreground">
                    {trip.updatedAt ? new Date(trip.updatedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-foreground/80 font-medium mb-1">Created By</label>
                  <div className="text-muted-foreground">{trip.createdBy || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-foreground/80 font-medium mb-1">Updated By</label>
                  <div className="text-muted-foreground">{trip.updatedBy || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted-foreground/30 text-white rounded-lg hover:bg-muted-foreground/50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}