'use client';

import { Bus, User, Building2, Calendar, MapPin, Settings, ExternalLink } from 'lucide-react';
import type { BusResponse, OperatorResponse } from '@busmate/api-client-route';

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
        return `${baseClasses} bg-success/15 text-success`;
      case 'inactive':
        return `${baseClasses} bg-muted text-foreground`;
      case 'pending':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'suspended':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      case 'cancelled':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
    }
  };

  const getOperatorTypeBadge = (operatorType?: string) => {
    if (!operatorType) return null;
    
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (operatorType.toUpperCase()) {
      case 'PRIVATE':
        return `${baseClasses} bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]`;
      case 'CTB':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
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
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary/15 rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">
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
                <p className="text-muted-foreground">
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
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Passenger Capacity</p>
                <p className="text-2xl font-bold text-primary">
                  {bus.capacity || 0}
                </p>
                <p className="text-xs text-primary">
                  Total seats
                </p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-success/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success mb-1">Bus Model</p>
                <p className="text-lg font-bold text-success">
                  {bus.model || 'Not specified'}
                </p>
                <p className="text-xs text-success">
                  Vehicle model
                </p>
              </div>
              <Settings className="w-8 h-8 text-success" />
            </div>
          </div>

          {/* Operator Info */}
          <div className="bg-[hsl(var(--purple-50))] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[hsl(var(--purple-600))] mb-1">Operator</p>
                <p className="text-lg font-bold text-[hsl(var(--purple-900))]">
                  {operator?.name || bus.operatorName || 'Unknown'}
                </p>
                <p className="text-xs text-[hsl(var(--purple-700))]">
                  Owner operator
                </p>
              </div>
              <Building2 className="w-8 h-8 text-[hsl(var(--purple-600))]" />
            </div>
          </div>

          {/* Facilities Count */}
          <div className="bg-warning/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warning mb-1">Facilities</p>
                <p className="text-2xl font-bold text-orange-900">
                  {enabledFacilities.length}
                </p>
                <p className="text-xs text-orange-700">
                  Available features
                </p>
              </div>
              <Settings className="w-8 h-8 text-warning" />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Bus Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Registration Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Registration Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NTC Registration:</span>
                  <span className="font-medium">{bus.ntcRegistrationNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plate Number:</span>
                  <span className="font-medium">{bus.plateNumber || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getStatusBadge(bus.status)}>
                    {bus.status?.charAt(0).toUpperCase() + (bus.status?.slice(1) || '')}
                  </span>
                </div>
              </div>
            </div>

            {/* Operator Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Operator Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator Name:</span>
                  <span className="font-medium">{operator?.name || bus.operatorName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator ID:</span>
                  <span className="font-medium">{bus.operatorId?.slice(-8) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  {operator?.operatorType && (
                    <span className={getOperatorTypeBadge(operator.operatorType)}>
                      {operator.operatorType}
                    </span>
                  )}
                </div>
                {operator && onViewOperator && (
                  <button
                    onClick={onViewOperator}
                    className="flex items-center text-primary hover:text-primary text-sm"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Operator Details
                  </button>
                )}
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">System Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(bus.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="font-medium">{formatDate(bus.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By:</span>
                  <span className="font-medium">{bus.createdBy || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated By:</span>
                  <span className="font-medium">{bus.updatedBy || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enabled Facilities */}
          {enabledFacilities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-3">Available Facilities</h4>
              <div className="flex flex-wrap gap-2">
                {enabledFacilities.map((facility, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* No Facilities Message */}
          {enabledFacilities.length === 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-medium text-foreground mb-3">Available Facilities</h4>
              <p className="text-muted-foreground text-sm">No facilities have been configured for this bus.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}