'use client';

import { useState } from 'react';
import { X, Calendar, Clock, MapPin, User, Bus, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';

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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'delayed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trip Details</h2>
              <p className="text-sm text-gray-600">#{trip.id?.slice(-12)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getTripStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trip Date</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{formatDate(trip.tripDate)}</span>
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Schedule Information</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Departure</label>
                  <div className="text-gray-900 font-medium">{formatTime(trip.scheduledDepartureTime)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Arrival</label>
                  <div className="text-gray-900 font-medium">{formatTime(trip.scheduledArrivalTime)}</div>
                </div>
                {trip.actualDepartureTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Departure</label>
                    <div className="text-gray-900">{formatTime(trip.actualDepartureTime)}</div>
                  </div>
                )}
                {trip.actualArrivalTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Arrival</label>
                    <div className="text-gray-900">{formatTime(trip.actualArrivalTime)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Route Information</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                  <div className="text-gray-900">{trip.routeName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Group</label>
                  <div className="text-gray-900">{trip.routeGroupName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <div className="text-gray-900">{trip.scheduleName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <div className="text-gray-900">{trip.operatorName || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Assignment Information</span>
              </h3>
              <div className="space-y-3">
                {/* PSP Assignment */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Passenger Service Permit</div>
                      <div className="text-sm text-gray-600">
                        {trip.passengerServicePermitNumber ? (
                          <span className="text-green-600 font-medium">
                            {trip.passengerServicePermitNumber}
                          </span>
                        ) : (
                          'Not assigned'
                        )}
                      </div>
                    </div>
                  </div>
                  {trip.passengerServicePermitNumber ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>

                {/* Bus Assignment */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Bus className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Bus Assignment</div>
                      <div className="text-sm text-gray-600">
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
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {trip.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="bg-gray-50 rounded-lg p-3 text-gray-900">
                  {trip.notes}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Created At</label>
                  <div className="text-gray-600">
                    {trip.createdAt ? new Date(trip.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Updated At</label>
                  <div className="text-gray-600">
                    {trip.updatedAt ? new Date(trip.updatedAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Created By</label>
                  <div className="text-gray-600">{trip.createdBy || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Updated By</label>
                  <div className="text-gray-600">{trip.updatedBy || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}