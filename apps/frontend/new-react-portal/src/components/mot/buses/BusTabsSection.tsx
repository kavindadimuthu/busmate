'use client';

import { useState } from 'react';
import { 
  RouteIcon, 
  FileText, 
  Activity, 
  MapPin, 
  MoreHorizontal, 
  Building2,
  RefreshCw,
  ExternalLink,
  Calendar,
  Clock,
  Bus,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { BusResponse, OperatorResponse, TripResponse } from '@busmate/api-client-route';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface BusTabsSectionProps {
  bus: BusResponse;
  operator?: OperatorResponse | null;
  trips: TripResponse[];
  tripsLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function BusTabsSection({ 
  bus, 
  operator,
  trips,
  tripsLoading,
  onRefresh 
}: BusTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>('trips');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Trip filters
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'tripDate' | 'scheduledDepartureTime' | 'status'>('tripDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const tabs: TabType[] = [
    { 
      id: 'trips', 
      label: 'Trips & Schedules', 
      icon: <RouteIcon className="w-4 h-4" />, 
      count: trips.length
    },
    { 
      id: 'operator', 
      label: 'Operator Details', 
      icon: <Building2 className="w-4 h-4" />
    },
    { 
      id: 'permits', 
      label: 'Service Permits', 
      icon: <FileText className="w-4 h-4" />,
      count: 0 // TODO: Get from API
    },
    { 
      id: 'tracking', 
      label: 'Tracking & Location', 
      icon: <MapPin className="w-4 h-4" />
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance', 
      icon: <Activity className="w-4 h-4" />
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      // Handle both full datetime and time-only strings
      const date = timeString.includes('T') ? new Date(timeString) : new Date(`1970-01-01T${timeString}`);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-success/15 text-success`;
      case 'completed':
        return `${baseClasses} bg-primary/15 text-primary`;
      case 'pending':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'cancelled':
        return `${baseClasses} bg-destructive/15 text-destructive`;
      case 'delayed':
        return `${baseClasses} bg-warning/15 text-warning`;
      case 'in_transit':
        return `${baseClasses} bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]`;
      case 'boarding':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'departed':
        return `${baseClasses} bg-teal-100 text-teal-800`;
      default:
        return `${baseClasses} bg-muted text-foreground`;
    }
  };

  // Filter and sort trips
  const filteredAndSortedTrips = trips
    .filter(trip => {
      const matchesSearch = !tripSearch || 
        trip.routeName?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        trip.routeId?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        trip.scheduleName?.toLowerCase().includes(tripSearch.toLowerCase());
      
      const matchesStatus = tripStatusFilter === 'all' || trip.status === tripStatusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'tripDate':
          aValue = new Date(a.tripDate || 0);
          bValue = new Date(b.tripDate || 0);
          break;
        case 'scheduledDepartureTime':
          aValue = new Date(`${a.tripDate}T${a.scheduledDepartureTime}` || 0);
          bValue = new Date(`${b.tripDate}T${b.scheduledDepartureTime}` || 0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.tripDate || '';
          bValue = b.tripDate || '';
      }
      
      if (sortDir === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: 'tripDate' | 'scheduledDepartureTime' | 'status') => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const renderTripsTab = () => (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trip Assignments</h3>
          <p className="text-sm text-muted-foreground">
            {trips.length} trips assigned to this bus
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || tripsLoading}
          className="flex items-center bg-muted hover:bg-secondary text-foreground/80 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isRefreshing || tripsLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-muted rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by route, schedule..."
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={tripStatusFilter}
            onChange={(e) => setTripStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="delayed">Delayed</option>
            <option value="in_transit">In Transit</option>
            <option value="boarding">Boarding</option>
            <option value="departed">Departed</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortBy(field as 'tripDate' | 'scheduledDepartureTime' | 'status');
              setSortDir(direction as 'asc' | 'desc');
            }}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="tripDate-desc">Date (Newest)</option>
            <option value="tripDate-asc">Date (Oldest)</option>
            <option value="scheduledDepartureTime-asc">Departure (Early)</option>
            <option value="scheduledDepartureTime-desc">Departure (Late)</option>
            <option value="status-asc">Status (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Trips List */}
      {tripsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading trips...</span>
        </div>
      ) : filteredAndSortedTrips.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg border border-border">
          <RouteIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {trips.length === 0 ? 'No Trips Assigned' : 'No Trips Match Filters'}
          </h3>
          <p className="text-muted-foreground">
            {trips.length === 0 
              ? 'This bus has no trips assigned yet.' 
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('tripDate')}
                  >
                    <div className="flex items-center gap-1">
                      Trip Date
                      {getSortIcon('tripDate')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Route & Schedule
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('scheduledDepartureTime')}
                  >
                    <div className="flex items-center gap-1">
                      Schedule
                      {getSortIcon('scheduledDepartureTime')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {filteredAndSortedTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-muted-foreground/70 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {formatDate(trip.tripDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {trip.id?.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {trip.routeName || 'Route ' + trip.routeId?.slice(-8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.scheduleName || 'Schedule ' + trip.scheduleId?.slice(-8)}
                        </div>
                        {trip.permitNumber && (
                          <div className="text-xs text-muted-foreground/70">
                            Permit: {trip.permitNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground/70 mr-1" />
                          <span className="text-muted-foreground">Dep:</span>
                          <span className="ml-1 font-medium">
                            {formatTime(trip.scheduledDepartureTime)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="w-3 h-3 text-muted-foreground/70 mr-1" />
                          <span className="text-muted-foreground">Arr:</span>
                          <span className="ml-1 font-medium">
                            {formatTime(trip.scheduledArrivalTime)}
                          </span>
                        </div>
                        {trip.actualDepartureTime && (
                          <div className="text-xs text-primary">
                            Actual dep: {formatTime(trip.actualDepartureTime)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(trip.status)}>
                        {trip.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {/* TODO: View trip details */}}
                          className="text-primary hover:text-primary p-1 rounded hover:bg-primary/10"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Edit trip */}}
                          className="text-success hover:text-success p-1 rounded hover:bg-success/10"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trip Statistics */}
      {trips.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-foreground mb-3">Trip Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Trips', value: trips.length, color: 'blue' },
              { label: 'Completed', value: trips.filter(t => t.status === 'completed').length, color: 'green' },
              { label: 'Active', value: trips.filter(t => t.status === 'active' || t.status === 'in_transit').length, color: 'purple' },
              { label: 'Pending', value: trips.filter(t => t.status === 'pending').length, color: 'yellow' },
            ].map((stat, index) => (
              <div key={index} className={`bg-${stat.color}-50 rounded-lg p-3`}>
                <div className={`text-sm font-medium text-${stat.color}-600`}>{stat.label}</div>
                <div className={`text-lg font-bold text-${stat.color}-900`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOperatorTab = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Operator Information</h3>
          <p className="text-sm text-muted-foreground">Details about the bus owner/operator</p>
        </div>
        {operator && (
          <button
            onClick={() => window.open(`/mot/operators/${operator.id}`, '_blank')}
            className="flex items-center bg-primary/15 hover:bg-primary/20 text-primary px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Profile
          </button>
        )}
      </div>

      {operator ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[hsl(var(--purple-100))] rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[hsl(var(--purple-600))]" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{operator.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {operator.operatorType} Operator
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator ID:</span>
                  <span className="font-medium">{operator.id?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    operator.operatorType === 'PRIVATE' 
                      ? 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-800))]' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {operator.operatorType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={getStatusBadge(operator.status)}>
                    {operator.status?.charAt(0).toUpperCase() + (operator.status?.slice(1) || '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Region:</span>
                  <span className="font-medium">{operator.region || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Contact & Additional Info */}
            <div className="space-y-4">
              <h5 className="font-medium text-foreground">Contact Information</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <span className="font-medium">{operator.contactPerson || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{operator.phoneNumber || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{operator.email || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium text-right max-w-48">
                    {operator.address || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Date:</span>
                <span className="font-medium">{formatDate(operator.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{formatDate(operator.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License Number:</span>
                <span className="font-medium">{operator.licenseNumber || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted rounded-lg border border-border">
          <AlertCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Operator Information</h3>
          <p className="text-muted-foreground">
            Operator details are not available for this bus.
          </p>
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
        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="text-sm text-muted-foreground">
          <p>Features coming soon:</p>
          <ul className="mt-2 space-y-1">
            {features.map((feature, index) => (
              <li key={index}>• {feature}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trips':
        return renderTripsTab();
      case 'operator':
        return renderOperatorTab();
      case 'permits':
        return renderPlaceholderTab(
          'Service Permit Assignments',
          'View and manage passenger service permit assignments for this bus.',
          <FileText className="w-8 h-8 text-muted-foreground/70" />,
          [
            'Active permit assignments',
            'Permit history',
            'Route authorizations',
            'Compliance status'
          ]
        );
      case 'tracking':
        return renderPlaceholderTab(
          'GPS Tracking & Location',
          'Real-time location tracking and route monitoring for this bus.',
          <MapPin className="w-8 h-8 text-muted-foreground/70" />,
          [
            'Real-time GPS location',
            'Route tracking',
            'Geofencing alerts',
            'Location history'
          ]
        );
      case 'maintenance':
        return renderPlaceholderTab(
          'Maintenance Records',
          'Track maintenance schedules, repairs, and vehicle health status.',
          <Activity className="w-8 h-8 text-muted-foreground/70" />,
          [
            'Maintenance schedules',
            'Repair history',
            'Vehicle health monitoring',
            'Cost tracking'
          ]
        );
      case 'more':
        return renderPlaceholderTab(
          'Additional Features',
          'Extended functionality and detailed analytics for bus management.',
          <MoreHorizontal className="w-8 h-8 text-muted-foreground/70" />,
          [
            'Revenue analytics',
            'Performance reports',
            'Driver assignments',
            'Insurance details'
          ]
        );
      default:
        return renderTripsTab();
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:bg-muted'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-primary/15 text-primary' 
                    : 'bg-muted text-muted-foreground'
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
        {renderTabContent()}
      </div>
    </div>
  );
}