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
import type { OperatorResponse, BusResponse } from '@busmate/api-client-route';

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
    if (!operatorType) return undefined;
    
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
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">
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
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          <div className="bg-primary/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary mb-1">Total Buses</div>
                <div className="text-2xl font-bold text-primary">{busStats.total}</div>
                <div className="text-xs text-primary">Fleet size</div>
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
                <div className="text-2xl font-bold text-success">{busStats.active}</div>
                <div className="text-xs text-success">
                  {busStats.total > 0 ? ((busStats.active / busStats.total) * 100).toFixed(1) : 0}% of fleet
                </div>
              </div>
              <div className="p-3 bg-success/15 rounded-lg">
                <Activity className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          {/* Total Capacity */}
          <div className="bg-[hsl(var(--purple-50))] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[hsl(var(--purple-600))] mb-1">Total Capacity</div>
                <div className="text-2xl font-bold text-[hsl(var(--purple-900))]">{busStats.totalCapacity}</div>
                <div className="text-xs text-[hsl(var(--purple-600))]">Passenger seats</div>
              </div>
              <div className="p-3 bg-[hsl(var(--purple-100))] rounded-lg">
                <User className="w-6 h-6 text-[hsl(var(--purple-600))]" />
              </div>
            </div>
          </div>

          {/* Service Permits */}
          <div className="bg-warning/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-warning mb-1">Service Permits</div>
                <div className="text-2xl font-bold text-orange-900">--</div>
                <div className="text-xs text-warning">Active permits</div>
              </div>
              <div className="p-3 bg-warning/15 rounded-lg">
                <FileText className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Operator Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Operator Type:</span>
                  <span className="ml-2 text-foreground">{operator.operatorType || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operating Region:</span>
                  <span className="ml-2 text-foreground">{operator.region || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 text-foreground">{operator.status || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Fleet Statistics */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Bus className="w-4 h-4" />
                Fleet Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Buses:</span>
                  <span className="ml-2 text-foreground">{busStats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Average Capacity:</span>
                  <span className="ml-2 text-foreground">{busStats.avgCapacity} seats</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="ml-2 text-foreground">{busStats.pending} buses</span>
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
                    {formatDate(operator.createdAt)}
                    {operator.createdBy && (
                      <div className="text-xs text-muted-foreground">by {operator.createdBy}</div>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="ml-2 text-foreground">
                    {formatDate(operator.updatedAt)}
                    {operator.updatedBy && (
                      <div className="text-xs text-muted-foreground">by {operator.updatedBy}</div>
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