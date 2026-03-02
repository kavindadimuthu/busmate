'use client';

import { 
  FileText, 
  Building2, 
  Calendar, 
  User, 
  Bus, 
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Route as RouteIcon
} from 'lucide-react';
import type { 
  PassengerServicePermitResponse, 
  OperatorResponse, 
  RouteGroupResponse,
  BusResponse 
} from '../../../../generated/api-clients/route-management';

interface PermitSummaryProps {
  permit: PassengerServicePermitResponse;
  operator: OperatorResponse | null;
  routeGroup: RouteGroupResponse | null;
  assignedBuses: BusResponse[];
}

export function PermitSummary({ 
  permit, 
  operator, 
  routeGroup, 
  assignedBuses 
}: PermitSummaryProps) {
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
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'suspended':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPermitTypeBadge = (permitType?: string) => {
    if (!permitType) return undefined;
    
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (permitType.toUpperCase()) {
      case 'REGULAR':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'EXPRESS':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'INTERCITY':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    return expiry > now && expiry <= thirtyDaysFromNow;
  };

  const getValidityStatus = () => {
    if (!permit.expiryDate) return { text: 'No expiry date', color: 'text-gray-600', icon: Clock };
    
    if (isExpired(permit.expiryDate)) {
      return { text: 'Expired', color: 'text-red-600', icon: XCircle };
    }
    
    if (isExpiringSoon(permit.expiryDate)) {
      return { text: 'Expires soon', color: 'text-yellow-600', icon: AlertTriangle };
    }
    
    return { text: 'Valid', color: 'text-green-600', icon: CheckCircle };
  };

  const validityStatus = getValidityStatus();

  // Calculate permit statistics
  const permitStats = {
    totalBusesAssigned: assignedBuses.length,
    activeBuses: assignedBuses.filter(bus => bus.status === 'active').length,
    maxBusesAllowed: permit.maximumBusAssigned || 0,
    busUtilization: permit.maximumBusAssigned ? 
      Math.round((assignedBuses.length / permit.maximumBusAssigned) * 100) : 0,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {permit.permitNumber || 'Unknown Permit Number'}
              </h1>
              <div className="flex items-center gap-2">
                {permit.status && (
                  <span className={getStatusBadge(permit.status)}>
                    {permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                  </span>
                )}
                {permit.permitType && (
                  <span className={getPermitTypeBadge(permit.permitType)}>
                    {permit.permitType}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>Permit ID: {permit.id?.slice(-8) || 'N/A'}</span>
              </div>
              {operator && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{operator.name}</span>
                </div>
              )}
              {routeGroup && (
                <div className="flex items-center gap-1">
                  <RouteIcon className="w-4 h-4" />
                  <span>{routeGroup.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Validity Alert */}
      {permit.expiryDate && (isExpired(permit.expiryDate) || isExpiringSoon(permit.expiryDate)) && (
        <div className={`p-4 border-b border-gray-200 ${
          isExpired(permit.expiryDate) ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center gap-2">
            <validityStatus.icon className={`w-5 h-5 ${validityStatus.color}`} />
            <span className={`font-medium ${validityStatus.color}`}>
              {isExpired(permit.expiryDate) 
                ? `This permit expired on ${formatDate(permit.expiryDate)}`
                : `This permit expires on ${formatDate(permit.expiryDate)}`
              }
            </span>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Assigned Buses */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-600 mb-1">Assigned Buses</div>
                <div className="text-2xl font-bold text-blue-900">{permitStats.totalBusesAssigned}</div>
                <div className="text-xs text-blue-600">
                  of {permitStats.maxBusesAllowed} allowed
                </div>
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
                <div className="text-2xl font-bold text-green-900">{permitStats.activeBuses}</div>
                <div className="text-xs text-green-600">
                  {permitStats.totalBusesAssigned > 0 
                    ? `${Math.round((permitStats.activeBuses / permitStats.totalBusesAssigned) * 100)}%`
                    : '0%'
                  } operational
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Bus Utilization */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-600 mb-1">Utilization</div>
                <div className="text-2xl font-bold text-purple-900">{permitStats.busUtilization}%</div>
                <div className="text-xs text-purple-600">Capacity usage</div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Validity Status */}
          <div className={`${
            isExpired(permit.expiryDate) ? 'bg-red-50' :
            isExpiringSoon(permit.expiryDate) ? 'bg-yellow-50' :
            'bg-green-50'
          } rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  isExpired(permit.expiryDate) ? 'text-red-600' :
                  isExpiringSoon(permit.expiryDate) ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  Validity Status
                </div>
                <div className={`text-2xl font-bold ${
                  isExpired(permit.expiryDate) ? 'text-red-900' :
                  isExpiringSoon(permit.expiryDate) ? 'text-yellow-900' :
                  'text-green-900'
                }`}>
                  {validityStatus.text}
                </div>
                <div className={`text-xs ${
                  isExpired(permit.expiryDate) ? 'text-red-600' :
                  isExpiringSoon(permit.expiryDate) ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {permit.expiryDate ? `Until ${formatDate(permit.expiryDate)}` : 'No expiry date'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                isExpired(permit.expiryDate) ? 'bg-red-100' :
                isExpiringSoon(permit.expiryDate) ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                <validityStatus.icon className={`w-6 h-6 ${validityStatus.color}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permit Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Permit Number:</span>
                  <span className="ml-2 text-gray-900">{permit.permitNumber || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Permit Type:</span>
                  <span className="ml-2 text-gray-900">{permit.permitType || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{permit.status || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Validity Period
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(permit.issueDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="ml-2 text-gray-900">{formatDate(permit.expiryDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Max Buses:</span>
                  <span className="ml-2 text-gray-900">{permit.maximumBusAssigned || 0}</span>
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
                    {formatDate(permit.createdAt)}
                    {permit.createdBy && (
                      <div className="text-xs text-gray-500">by {permit.createdBy}</div>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(permit.updatedAt)}
                    {permit.updatedBy && (
                      <div className="text-xs text-gray-500">by {permit.updatedBy}</div>
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