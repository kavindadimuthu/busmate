'use client';

import React from 'react';
import { 
  Users, 
  Bus, 
  User, 
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import type { PassengerServicePermitResponse } from '../../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';

interface TripAssignmentsTabProps {
  trip: TripResponse;
  permit?: PassengerServicePermitResponse | null;
  onRefresh?: () => void;
}

export function TripAssignmentsTab({ trip, permit, onRefresh }: TripAssignmentsTabProps) {
  // Helper function to format date
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

  // Helper function to get assignment status
  const getAssignmentStatus = (value?: string) => {
    if (!value) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Not Assigned
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Assigned
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assignment Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">PSP Status</p>
              {getAssignmentStatus(trip.passengerServicePermitId)}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Bus className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Bus Status</p>
              {getAssignmentStatus(trip.busId)}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Driver Status</p>
              {getAssignmentStatus(trip.driverId)}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-500">Conductor Status</p>
              {getAssignmentStatus(trip.conductorId)}
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Service Permit Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Passenger Service Permit</h3>
          {getAssignmentStatus(trip.passengerServicePermitId)}
        </div>

        {trip.passengerServicePermitId ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Permit Number</label>
                <p className="text-sm text-gray-900 font-mono">
                  {trip.passengerServicePermitNumber || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Operator</label>
                <p className="text-sm text-gray-900">{trip.operatorName || 'N/A'}</p>
              </div>
            </div>

            {permit && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <p className="text-sm text-gray-900 capitalize">{permit.status || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Permit Type</label>
                    <p className="text-sm text-gray-900">{permit.permitType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Maximum Buses</label>
                    <p className="text-sm text-gray-900">{permit.maximumBusAssigned || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Issue Date</label>
                    <p className="text-sm text-gray-900">{formatDate(permit.issueDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Expiry Date</label>
                    <p className="text-sm text-gray-900">{formatDate(permit.expiryDate)}</p>
                  </div>
                </div>

                {permit.operatorName && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Operator Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Operator Name</label>
                        <p className="text-sm text-gray-900">{permit.operatorName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No PSP Assigned</h4>
            <p className="text-gray-500">This trip does not have a passenger service permit assigned yet.</p>
          </div>
        )}
      </div>

      {/* Bus Assignment */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Bus Assignment</h3>
          {getAssignmentStatus(trip.busId)}
        </div>

        {trip.busId ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bus ID</label>
                <p className="text-sm text-gray-900 font-mono">{trip.busId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Plate Number</label>
                <p className="text-sm text-gray-900 font-mono">{trip.busPlateNumber || 'N/A'}</p>
              </div>
            </div>

            {trip.busModel && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bus Model</label>
                <p className="text-sm text-gray-900">{trip.busModel}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Bus Assigned</h4>
            <p className="text-gray-500">This trip does not have a bus assigned yet.</p>
          </div>
        )}
      </div>

      {/* Staff Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Assignment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Driver Assignment</h3>
            {getAssignmentStatus(trip.driverId)}
          </div>

          {trip.driverId ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Driver ID</label>
                <p className="text-sm text-gray-900 font-mono">{trip.driverId}</p>
              </div>
              {/* Additional driver details could be loaded from driver service */}
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h4 className="text-md font-medium text-gray-900 mb-1">No Driver Assigned</h4>
              <p className="text-sm text-gray-500">This trip needs a driver assignment.</p>
            </div>
          )}
        </div>

        {/* Conductor Assignment */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Conductor Assignment</h3>
            {getAssignmentStatus(trip.conductorId)}
          </div>

          {trip.conductorId ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Conductor ID</label>
                <p className="text-sm text-gray-900 font-mono">{trip.conductorId}</p>
              </div>
              {/* Additional conductor details could be loaded from staff service */}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h4 className="text-md font-medium text-gray-900 mb-1">No Conductor Assigned</h4>
              <p className="text-sm text-gray-500">This trip can operate without a conductor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Assignment Status Summary</h4>
            <p className="text-sm text-blue-700 mt-1">
              {trip.passengerServicePermitId && trip.busId && trip.driverId
                ? 'This trip has all required assignments completed and is ready for operation.'
                : 'This trip is missing some required assignments. Please ensure PSP, bus, and driver are assigned before the trip date.'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {onRefresh && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Assignment Details
          </button>
        </div>
      )}
    </div>
  );
}