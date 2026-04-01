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
} from '@busmate/api-client-route';

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
        return `${baseClasses} bg-success/15 text-success`;
      case 'pending':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'expired':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      case 'suspended':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'cancelled':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
    }
  };

  const getPermitTypeBadge = (permitType?: string) => {
    if (!permitType) return undefined;
    
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (permitType.toUpperCase()) {
      case 'REGULAR':
        return `${baseClasses} bg-primary/15 text-primary`;
      case 'EXPRESS':
        return `${baseClasses} bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]`;
      case 'INTERCITY':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
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
    if (!permit.expiryDate) return { text: 'No expiry date', color: 'text-muted-foreground', icon: Clock };
    
    if (isExpired(permit.expiryDate)) {
      return { text: 'Expired', color: 'text-destructive', icon: XCircle };
    }
    
    if (isExpiringSoon(permit.expiryDate)) {
      return { text: 'Expires soon', color: 'text-warning', icon: AlertTriangle };
    }
    
    return { text: 'Valid', color: 'text-success', icon: CheckCircle };
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
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">
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
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        <div className={`p-4 border-b border-border ${
          isExpired(permit.expiryDate) ? 'bg-destructive/10' : 'bg-warning/10'
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
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary mb-1">Assigned Buses</div>
                <div className="text-2xl font-bold text-primary">{permitStats.totalBusesAssigned}</div>
                <div className="text-xs text-primary">
                  of {permitStats.maxBusesAllowed} allowed
                </div>
              </div>
              <div className="p-3 bg-primary/15 rounded-lg">
                <Bus className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* Active Buses */}
          <div className="bg-success/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-success mb-1">Active Buses</div>
                <div className="text-2xl font-bold text-success">{permitStats.activeBuses}</div>
                <div className="text-xs text-success">
                  {permitStats.totalBusesAssigned > 0 
                    ? `${Math.round((permitStats.activeBuses / permitStats.totalBusesAssigned) * 100)}%`
                    : '0%'
                  } operational
                </div>
              </div>
              <div className="p-3 bg-success/15 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          {/* Bus Utilization */}
          <div className="bg-[hsl(var(--purple-50))] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[hsl(var(--purple-600))] mb-1">Utilization</div>
                <div className="text-2xl font-bold text-[hsl(var(--purple-900))]">{permitStats.busUtilization}%</div>
                <div className="text-xs text-[hsl(var(--purple-600))]">Capacity usage</div>
              </div>
              <div className="p-3 bg-[hsl(var(--purple-100))] rounded-lg">
                <User className="w-6 h-6 text-[hsl(var(--purple-600))]" />
              </div>
            </div>
          </div>

          {/* Validity Status */}
          <div className={`${
            isExpired(permit.expiryDate) ? 'bg-destructive/10' :
            isExpiringSoon(permit.expiryDate) ? 'bg-warning/10' :
            'bg-success/10'
          } rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  isExpired(permit.expiryDate) ? 'text-destructive' :
                  isExpiringSoon(permit.expiryDate) ? 'text-warning' :
                  'text-success'
                }`}>
                  Validity Status
                </div>
                <div className={`text-2xl font-bold ${
                  isExpired(permit.expiryDate) ? 'text-destructive' :
                  isExpiringSoon(permit.expiryDate) ? 'text-warning' :
                  'text-success'
                }`}>
                  {validityStatus.text}
                </div>
                <div className={`text-xs ${
                  isExpired(permit.expiryDate) ? 'text-destructive' :
                  isExpiringSoon(permit.expiryDate) ? 'text-warning' :
                  'text-success'
                }`}>
                  {permit.expiryDate ? `Until ${formatDate(permit.expiryDate)}` : 'No expiry date'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                isExpired(permit.expiryDate) ? 'bg-destructive/15' :
                isExpiringSoon(permit.expiryDate) ? 'bg-warning/15' :
                'bg-success/15'
              }`}>
                <validityStatus.icon className={`w-6 h-6 ${validityStatus.color}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Permit Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Permit Number:</span>
                  <span className="ml-2 text-foreground">{permit.permitNumber || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Permit Type:</span>
                  <span className="ml-2 text-foreground">{permit.permitType || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 text-foreground">{permit.status || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Validity Period
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="ml-2 text-foreground">{formatDate(permit.issueDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span className="ml-2 text-foreground">{formatDate(permit.expiryDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Buses:</span>
                  <span className="ml-2 text-foreground">{permit.maximumBusAssigned || 0}</span>
                </div>
              </div>
            </div>

            {/* Record Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Record Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2 text-foreground">
                    {formatDate(permit.createdAt)}
                    {permit.createdBy && (
                      <div className="text-xs text-muted-foreground">by {permit.createdBy}</div>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="ml-2 text-foreground">
                    {formatDate(permit.updatedAt)}
                    {permit.updatedBy && (
                      <div className="text-xs text-muted-foreground">by {permit.updatedBy}</div>
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