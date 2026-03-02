'use client';

import { Bus, User, Building2, Calendar, MapPin, Settings, ExternalLink } from 'lucide-react';
import type { BusResponse, OperatorResponse } from '../../../../generated/api-clients/route-management';

interface BusSummaryProps {
  bus: BusResponse;
  operator?: OperatorResponse | null;
  onViewOperator?: () => void;
}

export function BusSummary({ bus, operator, onViewOperator }: BusSummaryProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return '';
    
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getOperatorTypeBadge = (operatorType?: string) => {
    if (!operatorType) return null;
    
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (operatorType.toUpperCase()) {
      case 'PRIVATE':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'CTB':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Parse facilities and show only enabled ones (true values)
  const parseFacilities = (facilities: any): string[] => {
    if (!facilities) return [];
    
    try {
      let facilitiesObj: { [key: string]: boolean } = {};
      
      if (typeof facilities === 'string') {
        facilitiesObj = JSON.parse(facilities);
      } else if (typeof facilities === 'object' && facilities !== null) {
        facilitiesObj = facilities;
      }
      
      // Return only facilities that are true
      return Object.entries(facilitiesObj)
        .filter(([key, value]) => Boolean(value))
        .map(([key, value]) => formatFacilityName(key));
    } catch (error) {
      console.warn('Error parsing facilities:', error);
      return [];
    }
  };

  // Format facility key to readable name
  const formatFacilityName = (key: string): string => {
    const facilityLabels: { [key: string]: string } = {
      'ac': 'Air Conditioning',
      'wifi': 'WiFi',
      'cctv': 'CCTV Cameras',
      'gps': 'GPS Tracking',
      'audio_system': 'Audio System',
      'charging_ports': 'Charging Ports',
      'wheelchair_accessible': 'Wheelchair Accessible',
      'air_suspension': 'Air Suspension',
      'toilet': 'Toilet',
      'tv_screens': 'TV Screens',
      'reading_lights': 'Reading Lights',
      'seat_belts': 'Seat Belts',
      'emergency_exits': 'Emergency Exits',
      'fire_extinguisher': 'Fire Extinguisher'
    };
    
    return facilityLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const enabledFacilities = parseFacilities(bus.facilities);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {bus.plateNumber || 'No Plate Number'}
                  </h1>
                  {bus.status && (
                    <span className={getStatusBadge(bus.status)}>
                      {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
                    </span>
                  )}
                  {operator?.operatorType && (
                    <span className={getOperatorTypeBadge(operator.operatorType) || ''}>
                      {operator.operatorType}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  NTC Registration: {bus.ntcRegistrationNumber || 'Not assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Capacity */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Passenger Capacity</p>
                <p className="text-2xl font-bold text-blue-900">
                  {bus.capacity || 0}
                </p>
                <p className="text-xs text-blue-700">
                  Total seats
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Bus Model</p>
                <p className="text-lg font-bold text-green-900">
                  {bus.model || 'Not specified'}
                </p>
                <p className="text-xs text-green-700">
                  Vehicle model
                </p>
              </div>
              <Settings className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Operator Info */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Operator</p>
                <p className="text-lg font-bold text-purple-900">
                  {operator?.name || bus.operatorName || 'Unknown'}
                </p>
                <p className="text-xs text-purple-700">
                  Owner operator
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          {/* Facilities Count */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Facilities</p>
                <p className="text-2xl font-bold text-orange-900">
                  {enabledFacilities.length}
                </p>
                <p className="text-xs text-orange-700">
                  Available features
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bus Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Registration Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Registration Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">NTC Registration:</span>
                  <span className="font-medium">{bus.ntcRegistrationNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plate Number:</span>
                  <span className="font-medium">{bus.plateNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={getStatusBadge(bus.status)}>
                    {bus.status?.charAt(0).toUpperCase() + (bus.status?.slice(1) || '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Operator Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Operator Name:</span>
                  <span className="font-medium">{operator?.name || bus.operatorName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Operator ID:</span>
                  <span className="font-medium">{bus.operatorId?.slice(-8) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  {operator?.operatorType && (
                    <span className={getOperatorTypeBadge(operator.operatorType)}>
                      {operator.operatorType}
                    </span>
                  )}
                </div>
                {operator && onViewOperator && (
                  <button
                    onClick={onViewOperator}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Operator Details
                  </button>
                )}
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">System Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(bus.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{formatDate(bus.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created By:</span>
                  <span className="font-medium">{bus.createdBy || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated By:</span>
                  <span className="font-medium">{bus.updatedBy || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enabled Facilities */}
          {enabledFacilities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Available Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {enabledFacilities.map((facility, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No Facilities Message */}
          {enabledFacilities.length === 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Available Facilities</h4>
              <p className="text-gray-500 text-sm">No facilities have been configured for this bus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}