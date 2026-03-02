'use client';

import { 
  Building2, 
  MapPin, 
  Calendar, 
  User, 
  Bus, 
  Activity,
  FileText,
  Clock
} from 'lucide-react';
import type { OperatorResponse, BusResponse } from '../../../../generated/api-clients/route-management';

interface OperatorSummaryProps {
  operator: OperatorResponse;
  buses: BusResponse[];
}

export function OperatorSummary({ operator, buses }: OperatorSummaryProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return undefined;
    
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
    if (!operatorType) return undefined;
    
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

  // Calculate bus statistics
  const busStats = {
    total: buses.length,
    active: buses.filter(bus => bus.status === 'active').length,
    inactive: buses.filter(bus => bus.status === 'inactive').length,
    pending: buses.filter(bus => bus.status === 'pending').length,
    totalCapacity: buses.reduce((sum, bus) => sum + (bus.capacity || 0), 0),
    avgCapacity: buses.length > 0 ? Math.round(buses.reduce((sum, bus) => sum + (bus.capacity || 0), 0) / buses.length) : 0,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {operator.name || 'Unnamed Operator'}
              </h1>
              <div className="flex items-center gap-2">
                {operator.status && (
                  <span className={getStatusBadge(operator.status)}>
                    {operator.status.charAt(0).toUpperCase() + operator.status.slice(1)}
                  </span>
                )}
                {operator.operatorType && (
                  <span className={getOperatorTypeBadge(operator.operatorType)}>
                    {operator.operatorType}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Operator ID: {operator.id?.slice(-8) || 'N/A'}</span>
              </div>
              {operator.region && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{operator.region}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Buses */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600 mb-1">Total Buses</div>
                <div className="text-2xl font-bold text-blue-900">{busStats.total}</div>
                <div className="text-xs text-blue-600">Fleet size</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Buses */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-600 mb-1">Active Buses</div>
                <div className="text-2xl font-bold text-green-900">{busStats.active}</div>
                <div className="text-xs text-green-600">
                  {busStats.total > 0 ? ((busStats.active / busStats.total) * 100).toFixed(1) : 0}% of fleet
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Capacity */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-600 mb-1">Total Capacity</div>
                <div className="text-2xl font-bold text-purple-900">{busStats.totalCapacity}</div>
                <div className="text-xs text-purple-600">Passenger seats</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Service Permits */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-600 mb-1">Service Permits</div>
                <div className="text-2xl font-bold text-orange-900">--</div>
                <div className="text-xs text-orange-600">Active permits</div>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operator Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Operator Type:</span>
                  <span className="ml-2 text-gray-900">{operator.operatorType || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Operating Region:</span>
                  <span className="ml-2 text-gray-900">{operator.region || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{operator.status || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Fleet Statistics */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Bus className="w-4 h-4" />
                Fleet Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Total Buses:</span>
                  <span className="ml-2 text-gray-900">{busStats.total}</span>
                </div>
                <div>
                  <span className="text-gray-500">Average Capacity:</span>
                  <span className="ml-2 text-gray-900">{busStats.avgCapacity} seats</span>
                </div>
                <div>
                  <span className="text-gray-500">Pending:</span>
                  <span className="ml-2 text-gray-900">{busStats.pending} buses</span>
                </div>
              </div>
            </div>

            {/* Record Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Record Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(operator.createdAt)}
                    {operator.createdBy && (
                      <div className="text-xs text-gray-500">by {operator.createdBy}</div>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(operator.updatedAt)}
                    {operator.updatedBy && (
                      <div className="text-xs text-gray-500">by {operator.updatedBy}</div>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}