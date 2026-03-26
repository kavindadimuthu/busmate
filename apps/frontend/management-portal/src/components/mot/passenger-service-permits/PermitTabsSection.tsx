'use client';

import { useState } from 'react';
import { 
  Building2, 
  Route as RouteIcon, 
  Bus, 
  Calendar,
  MoreHorizontal, 
  RefreshCw,
  Settings,
  Activity,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Clock,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import type { 
  PassengerServicePermitResponse, 
  OperatorResponse, 
  RouteGroupResponse,
  BusResponse 
} from '@busmate/api-client-route';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface PermitTabsSectionProps {
  permit: PassengerServicePermitResponse;
  operator: OperatorResponse | null;
  routeGroup: RouteGroupResponse | null;
  assignedBuses: BusResponse[];
  operatorLoading: boolean;
  routeGroupLoading: boolean;
  busesLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function PermitTabsSection({ 
  permit, 
  operator, 
  routeGroup, 
  assignedBuses,
  operatorLoading,
  routeGroupLoading,
  busesLoading,
  onRefresh 
}: PermitTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('operator');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tabs: TabType[] = [
    { 
      id: 'operator', 
      label: 'Owner Operator', 
      icon: <Building2 className="w-4 h-4" />
    },
    { 
      id: 'routes', 
      label: 'Route Groups & Routes', 
      icon: <RouteIcon className="w-4 h-4" />,
      count: routeGroup?.routes?.length || 0
    },
    { 
      id: 'buses', 
      label: 'Assigned Buses', 
      icon: <Bus className="w-4 h-4" />, 
      count: assignedBuses.length 
    },
    { 
      id: 'schedules', 
      label: 'Schedule Assignments', 
      icon: <Calendar className="w-4 h-4" />,
      count: 0 // TODO: Get from API
    },
    { 
      id: 'trips', 
      label: 'Trips & Operations', 
      icon: <Activity className="w-4 h-4" />,
      count: 0 // TODO: Get from API
    },
    { 
      id: 'more', 
      label: 'More', 
      icon: <MoreHorizontal className="w-4 h-4" />
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
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
    
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-success/15 text-success`;
      case 'inactive':
        return `${baseClasses} bg-muted text-foreground`;
      case 'pending':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'cancelled':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
    }
  };

  const renderOperatorTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Owner Operator Details</h3>
          <p className="text-sm text-muted-foreground">
            Information about the operator who owns this permit
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || operatorLoading}
          className="flex items-center gap-2 px-3 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {operatorLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading operator details...</span>
        </div>
      ) : !operator ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
          <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Operator Not Found</h3>
          <p className="text-muted-foreground">
            Could not load operator details for this permit.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground/70" />
                    <span className="font-medium">{operator.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Operator ID:</span>
                    <span className="ml-2">{operator.id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{operator.operatorType || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Region:</span>
                    <span className="ml-2">{operator.region || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2">
                      <span className={getStatusBadge(operator.status)}>
                        {operator.status?.charAt(0).toUpperCase() + (operator.status?.slice(1) || '')}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Actions</h4>
                <div className="space-y-2">
                  <Link
                    href={`/mot/operators/${operator.id}`}
                    className="flex items-center gap-2 text-primary hover:text-primary text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Operator Profile
                  </Link>
                  <Link
                    href={`/mot/operators/${operator.id}/edit`}
                    className="flex items-center gap-2 text-success hover:text-success text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Operator Details
                  </Link>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Record Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Created: {formatDate(operator.createdAt)}</div>
                  <div>Updated: {formatDate(operator.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRoutesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Route Groups & Routes</h3>
          <p className="text-sm text-muted-foreground">
            Route information associated with this permit
          </p>
        </div>
      </div>

      {routeGroupLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading route details...</span>
        </div>
      ) : !routeGroup ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
          <RouteIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Route Group Found</h3>
          <p className="text-muted-foreground">
            This permit is not associated with any route group.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Route Group Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-foreground flex items-center gap-2">
                  <RouteIcon className="w-5 h-5" />
                  {routeGroup.name}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {routeGroup.description || 'No description available'}
                </p>
              </div>
              <Link
                href={`/mot/routes/groups/${routeGroup.id}`}
                className="text-primary hover:text-primary text-sm flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>
            </div>
            
            {/* Routes List */}
            {routeGroup.routes && routeGroup.routes.length > 0 ? (
              <div>
                <h5 className="font-medium text-foreground mb-3">Routes in this Group</h5>
                <div className="space-y-2">
                  {routeGroup.routes.map((route, index) => (
                    <div key={route.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{route.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {route.startStopName} → {route.endStopName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {route.distanceKm}km • {route.estimatedDurationMinutes}min • {route.direction}
                        </div>
                      </div>
                      <Link
                        href={`/mot/routes/${route.id}`}
                        className="text-primary hover:text-primary p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <RouteIcon className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>No routes defined in this group</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderBusesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Assigned Buses</h3>
          <p className="text-sm text-muted-foreground">
            Buses assigned to operate under this permit
          </p>
        </div>
        <Link
          href={`/mot/buses?operatorId=${permit.operatorId}`}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary"
        >
          <Bus className="w-4 h-4" />
          View All Operator Buses
        </Link>
      </div>

      {busesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading buses...</span>
        </div>
      ) : assignedBuses.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
          <Bus className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Buses Assigned</h3>
          <p className="text-muted-foreground">
            No buses are currently assigned to this permit.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Bus Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Capacity & Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {assignedBuses.map((bus) => (
                  <tr key={bus.id} className="hover:bg-muted">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">
                          {bus.plateNumber || 'Unknown Plate'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {bus.id?.slice(-8) || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {bus.ntcRegistrationNumber || 'Not registered'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-foreground">
                          {bus.capacity || 0} seats
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {bus.model || 'Model not specified'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(bus.status)}>
                        {bus.status?.charAt(0).toUpperCase() + (bus.status?.slice(1) || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mot/buses/${bus.id}`}
                          className="text-primary hover:text-primary p-1 rounded hover:bg-primary/10"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/mot/buses/${bus.id}/edit`}
                          className="text-success hover:text-success p-1 rounded hover:bg-success/10"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlaceholderTab = (
    title: string, 
    description: string, 
    icon: React.ReactNode,
    features: string[]
  ) => (
    <div className="space-y-4">
      <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
        <div className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="text-sm text-muted-foreground space-y-1 max-w-md mx-auto">
          {features.map((feature, index) => (
            <p key={index}>• {feature}</p>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex flex-wrap gap-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'operator' && renderOperatorTab()}
        {activeTab === 'routes' && renderRoutesTab()}
        {activeTab === 'buses' && renderBusesTab()}
        
        {activeTab === 'schedules' && renderPlaceholderTab(
          'Schedule Assignments',
          '🔌 API Integration Point: Implement schedule assignments functionality',
          <Calendar className="w-16 h-16" />,
          [
            'View permit-schedule assignments',
            'Track service schedules and timetables',
            'Manage schedule validity periods',
            'Monitor schedule compliance'
          ]
        )}

        {activeTab === 'trips' && renderPlaceholderTab(
          'Trips & Operations',
          '🔌 API Integration Point: Implement trips and operations tracking',
          <Activity className="w-16 h-16" />,
          [
            'Track completed and ongoing trips',
            'Monitor route adherence and delays',
            'View operational performance metrics',
            'Manage trip assignments and scheduling'
          ]
        )}

        {activeTab === 'more' && renderPlaceholderTab(
          'Additional Features',
          '🔌 API Integration Point: Add more permit-related features',
          <Settings className="w-16 h-16" />,
          [
            'Compliance and regulatory tracking',
            'Permit renewal and extension management',
            'Financial and fee tracking',
            'Audit logs and permit history'
          ]
        )}
      </div>
    </div>
  );
}