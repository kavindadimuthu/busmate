'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  Square, 
  MapPin, 
  User, 
  Bus, 
  AlertCircle, 
  CheckCircle,
  X,
  Eye,
  Filter,
  Grid,
  List,
  CalendarDays,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { WorkspaceState } from '../TripAssignmentWorkspace';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import { TripContextMenu } from './TripContextMenu';
import { TripDetailsModal } from './TripDetailsModal';
import { TripManagementService } from '../../../../../generated/api-clients/route-management/services/TripManagementService';

interface TripsWorkspaceProps {
  workspace: WorkspaceState;
  onTripSelect: (tripId: string, multi: boolean) => void;
  activeSection: 'planning' | 'assignments' | 'monitoring';
  onRefreshTrips?: () => void;
  onClearSelection?: () => void;
}

export function TripsWorkspace({
  workspace,
  onTripSelect,
  activeSection,
  onRefreshTrips,
  onClearSelection,
}: TripsWorkspaceProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'all-list' | 'daily' | 'weekly'>('all-list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [selectedTripForDetails, setSelectedTripForDetails] = useState<TripResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  // Date navigation functions
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isDateInWeek = (date: Date, weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return date >= weekStart && date <= weekEnd;
  };

  const getFilteredTrips = () => {
    let filtered = workspace.trips;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter === 'assigned') {
      filtered = filtered.filter(trip => trip.passengerServicePermitId);
    } else if (assignmentFilter === 'unassigned') {
      filtered = filtered.filter(trip => !trip.passengerServicePermitId);
    }

    // Date filter based on view mode
    if (viewMode === 'daily') {
      filtered = filtered.filter(trip => {
        if (!trip.tripDate) return false;
        const tripDate = new Date(trip.tripDate);
        return isSameDay(tripDate, selectedDate);
      });
    } else if (viewMode === 'weekly') {
      filtered = filtered.filter(trip => {
        if (!trip.tripDate) return false;
        const tripDate = new Date(trip.tripDate);
        return isDateInWeek(tripDate, selectedWeek);
      });
    }

    return filtered;
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const isSelected = (tripId: string) => {
    return workspace.selectedTrips.includes(tripId);
  };

  // Handle individual PSP assignment
  const handleAssignPsp = async (tripId: string, pspId: string) => {
    try {
      await TripManagementService.assignPassengerServicePermitToTrip(tripId, pspId);
      onRefreshTrips?.();
    } catch (error) {
      console.error('Error assigning PSP to trip:', error);
    }
  };

  // Handle PSP removal
  const handleRemovePsp = async (tripId: string) => {
    try {
      await TripManagementService.removePassengerServicePermitFromTrip(tripId);
      onRefreshTrips?.();
    } catch (error) {
      console.error('Error removing PSP from trip:', error);
    }
  };

  // Handle view trip details
  const handleViewTripDetails = (tripId: string) => {
    router.push(`/mot/trips/${tripId}`);
  };

  const filteredTrips = getFilteredTrips();

  if (!workspace.selectedRoute) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Route Selected</h3>
          <p className="text-gray-500 max-w-md">
            Select a route from the sidebar to view and manage trips for that route
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
      {/* Trips Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Trips for {workspace.routeGroups
                .find(rg => rg.id === workspace.selectedRouteGroup)
                ?.routes?.find(r => r.id === workspace.selectedRoute)?.name}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} 
              {workspace.selectedTrips.length > 0 && (
                <span className="font-medium text-blue-600">
                  {' '}• {workspace.selectedTrips.length} selected
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
              </select>

              {/* Assignment Filter */}
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Trips</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all-list')}
                className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-sm ${
                  viewMode === 'all-list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="All Route Trips List"
              >
                <List className="h-4 w-4" />
                <span>All</span>
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-sm ${
                  viewMode === 'daily'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Daily Trips View"
              >
                <Calendar className="h-4 w-4" />
                <span>Daily</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-2 rounded-md transition-colors flex items-center space-x-2 text-sm ${
                  viewMode === 'weekly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Weekly Trips Grid"
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Weekly</span>
              </button>
            </div>

            {/* Clear Selection */}
            {workspace.selectedTrips.length > 0 && (
              <button
                onClick={onClearSelection}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Date/Week Navigation Bar */}
        {(viewMode === 'daily' || viewMode === 'weekly') && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => viewMode === 'daily' ? navigateDay('prev') : navigateWeek('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {viewMode === 'daily' 
                      ? selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : `${selectedWeek.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })} - ${new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}`
                    }
                  </span>
                </div>

                <button
                  onClick={() => viewMode === 'daily' ? navigateDay('next') : navigateWeek('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => viewMode === 'daily' ? setSelectedDate(new Date()) : setSelectedWeek(() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    return startOfWeek;
                  })}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg border border-blue-200"
                >
                  Today
                </button>
                <span className="text-sm text-gray-500">
                  {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trips Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {workspace.isLoadingTrips ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600">Loading trips...</div>
          </div>
        ) : workspace.tripsError ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-600 mb-2">Error Loading Trips</div>
            <div className="text-gray-600">{workspace.tripsError}</div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 mb-2">No trips found</div>
            <div className="text-gray-500">
              {workspace.trips.length === 0 
                ? "No trips have been generated for this route yet"
                : "No trips match the current filters"
              }
            </div>
          </div>
        ) : viewMode === 'weekly' ? (
          <WeeklyTripsGrid
            trips={filteredTrips}
            selectedTrips={workspace.selectedTrips}
            weekStart={selectedWeek}
            permits={workspace.permits}
            onTripSelect={(tripId, multi) => onTripSelect(tripId, multi)}
            onAssignPsp={handleAssignPsp}
            onRemovePsp={handleRemovePsp}
            onViewDetails={handleViewTripDetails}
          />
        ) : viewMode === 'daily' ? (
          <DailyTripsView
            trips={filteredTrips}
            selectedTrips={workspace.selectedTrips}
            selectedDate={selectedDate}
            permits={workspace.permits}
            onTripSelect={(tripId, multi) => onTripSelect(tripId, multi)}
            onAssignPsp={handleAssignPsp}
            onRemovePsp={handleRemovePsp}
            onViewDetails={handleViewTripDetails}
          />
        ) : (
          <div className="space-y-3">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isSelected={isSelected(trip.id || '')}
                onSelect={(tripId, multi) => onTripSelect(tripId, multi)}
                viewMode="list"
                activeSection={activeSection}
                permits={workspace.permits}
                onAssignPsp={handleAssignPsp}
                onRemovePsp={handleRemovePsp}
                onViewDetails={handleViewTripDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      <TripDetailsModal
        trip={selectedTripForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTripForDetails(null);
        }}
      />
    </div>
  );
}

// Daily Trips View Component
interface DailyTripsViewProps {
  trips: TripResponse[];
  selectedTrips: string[];
  selectedDate: Date;
  permits: any[];
  onTripSelect: (tripId: string, multi: boolean) => void;
  onAssignPsp: (tripId: string, pspId: string) => void;
  onRemovePsp: (tripId: string) => void;
  onViewDetails: (tripId: string) => void;
}

function DailyTripsView({ 
  trips, 
  selectedTrips, 
  selectedDate, 
  permits, 
  onTripSelect, 
  onAssignPsp, 
  onRemovePsp, 
  onViewDetails 
}: DailyTripsViewProps) {
  const groupedTrips = trips.reduce((groups, trip) => {
    if (!trip.scheduledDepartureTime) return groups;
    
    const hour = new Date(`2000-01-01T${trip.scheduledDepartureTime}`).getHours();
    const period = hour < 6 ? 'Early Morning' : 
                  hour < 12 ? 'Morning' : 
                  hour < 17 ? 'Afternoon' : 
                  hour < 21 ? 'Evening' : 'Night';
    
    if (!groups[period]) groups[period] = [];
    groups[period].push(trip);
    return groups;
  }, {} as Record<string, TripResponse[]>);

  const periods = ['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night'];
  const periodIcons = {
    'Early Morning': '🌅',
    'Morning': '🌅',
    'Afternoon': '☀️',
    'Evening': '🌆',
    'Night': '🌙'
  };

  const isSelected = (tripId: string) => selectedTrips.includes(tripId);

  return (
    <div className="space-y-6">
      {periods.map(period => {
        const periodTrips = groupedTrips[period] || [];
        if (periodTrips.length === 0) return null;

        return (
          <div key={period} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <span>{periodIcons[period as keyof typeof periodIcons]}</span>
                <span>{period}</span>
                <span className="text-gray-500">({periodTrips.length} trips)</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periodTrips.map(trip => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isSelected={isSelected(trip.id || '')}
                    onSelect={(tripId, multi) => onTripSelect(tripId, multi)}
                    viewMode="grid"
                    activeSection="monitoring"
                    permits={permits}
                    onAssignPsp={onAssignPsp}
                    onRemovePsp={onRemovePsp}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Weekly Trips Grid Component
interface WeeklyTripsGridProps {
  trips: TripResponse[];
  selectedTrips: string[];
  weekStart: Date;
  permits: any[];
  onTripSelect: (tripId: string, multi: boolean) => void;
  onAssignPsp: (tripId: string, pspId: string) => void;
  onRemovePsp: (tripId: string) => void;
  onViewDetails: (tripId: string) => void;
}

function WeeklyTripsGrid({ 
  trips, 
  selectedTrips, 
  weekStart, 
  permits, 
  onTripSelect, 
  onAssignPsp, 
  onRemovePsp, 
  onViewDetails 
}: WeeklyTripsGridProps) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const groupedTrips = trips.reduce((groups, trip) => {
    if (!trip.tripDate) return groups;
    
    const tripDate = new Date(trip.tripDate);
    const dayIndex = tripDate.getDay();
    const dayName = days[dayIndex];
    
    if (!groups[dayName]) groups[dayName] = [];
    groups[dayName].push(trip);
    return groups;
  }, {} as Record<string, TripResponse[]>);

  const isSelected = (tripId: string) => selectedTrips.includes(tripId);

  return (
    <div className="grid grid-cols-7 gap-4 h-full">
      {days.map((day, index) => {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + index);
        const dayTrips = groupedTrips[day] || [];
        const isToday = new Date().toDateString() === currentDate.toDateString();

        return (
          <div key={day} className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className={`px-3 py-2 border-b border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`text-xs font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                  {dayAbbreviations[index]}
                </div>
                <div className={`text-sm ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                  {currentDate.getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {dayTrips.length} trip{dayTrips.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-96">
              {dayTrips.map(trip => (
                <div
                  key={trip.id}
                  onClick={(e) => onTripSelect(trip.id || '', e.ctrlKey || e.metaKey)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected(trip.id || '') 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">
                        {trip.scheduledDepartureTime ? new Date(`2000-01-01T${trip.scheduledDepartureTime}`).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'N/A'}
                      </span>
                      <TripContextMenu
                        trip={trip}
                        permits={permits}
                        onAssignPsp={onAssignPsp}
                        onRemovePsp={onRemovePsp}
                        onViewDetails={onViewDetails}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600 truncate">
                        {trip.routeName || 'Unknown Route'}
                      </div>
                      
                      <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                        trip.passengerServicePermitId 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {trip.passengerServicePermitId ? 'Assigned' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {dayTrips.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-xs">No trips</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TripCardProps {
  trip: TripResponse;
  isSelected: boolean;
  onSelect: (tripId: string, multi: boolean) => void;
  viewMode: 'grid' | 'list';
  activeSection: 'planning' | 'assignments' | 'monitoring';
  permits: any[];
  onAssignPsp: (tripId: string, pspId: string) => void;
  onRemovePsp: (tripId: string) => void;
  onViewDetails: (tripId: string) => void;
}

function TripCard({ trip, isSelected, onSelect, viewMode, activeSection, permits, onAssignPsp, onRemovePsp, onViewDetails }: TripCardProps) {
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (viewMode === 'grid') {
    return (
      <div
        className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={(e) => onSelect(trip.id || '', e.ctrlKey || e.metaKey)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
            <div className="text-sm font-medium text-gray-900">
              Trip #{trip.id?.slice(-8)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTripStatusColor(trip.status)}`}>
              {trip.status}
            </span>
            <TripContextMenu
              trip={trip}
              permits={permits}
              onAssignPsp={onAssignPsp}
              onRemovePsp={onRemovePsp}
              onViewDetails={onViewDetails}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">{formatDate(trip.tripDate)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">
              {formatTime(trip.scheduledDepartureTime)} - {formatTime(trip.scheduledArrivalTime)}
            </span>
          </div>

          {trip.passengerServicePermitNumber && (
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">
                PSP: {trip.passengerServicePermitNumber}
              </span>
            </div>
          )}

          {trip.busPlateNumber && (
            <div className="flex items-center space-x-2 text-sm">
              <Bus className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">{trip.busPlateNumber}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={(e) => onSelect(trip.id || '', e.ctrlKey || e.metaKey)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
          
          <div className="flex-1 grid grid-cols-5 gap-4 items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">
                #{trip.id?.slice(-8)}
              </div>
              <div className="text-xs text-gray-500">{formatDate(trip.tripDate)}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-900">
                {formatTime(trip.scheduledDepartureTime)}
              </div>
              <div className="text-xs text-gray-500">Departure</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-900">
                {formatTime(trip.scheduledArrivalTime)}
              </div>
              <div className="text-xs text-gray-500">Arrival</div>
            </div>
            
            <div>
              {trip.passengerServicePermitNumber ? (
                <div>
                  <div className="text-sm text-green-600 font-medium">
                    {trip.passengerServicePermitNumber}
                  </div>
                  <div className="text-xs text-gray-500">Assigned PSP</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-400">Unassigned</div>
                  <div className="text-xs text-gray-400">No PSP</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTripStatusColor(trip.status)}`}>
                {trip.status}
              </span>
              <TripContextMenu
                trip={trip}
                permits={permits}
                onAssignPsp={onAssignPsp}
                onRemovePsp={onRemovePsp}
                onViewDetails={onViewDetails}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}