'use client';

import { Calendar, Settings, Filter, Plus } from 'lucide-react';
import type { WorkspaceState } from '../TripAssignmentWorkspace';

interface WorkspaceHeaderProps {
  workspace: WorkspaceState;
  activeSection: 'planning' | 'assignments' | 'monitoring';
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
}

export function WorkspaceHeader({
  workspace,
  activeSection,
  onDateRangeChange,
}: WorkspaceHeaderProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    onDateRangeChange(newStartDate, workspace.selectedDateRange.endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    onDateRangeChange(workspace.selectedDateRange.startDate, newEndDate);
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'planning':
        return 'Trip Planning & Generation';
      case 'assignments':
        return 'PSP Assignment Management';
      case 'monitoring':
        return 'Trip Monitoring & Status';
      default:
        return 'Trip Assignment Workspace';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'planning':
        return 'Plan schedules and generate trips for selected routes';
      case 'assignments':
        return 'Assign passenger service permits to generated trips';
      case 'monitoring':
        return 'Monitor trip status and performance metrics';
      default:
        return 'Professional workspace for trip management';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Title and Description */}
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {activeSection === 'planning' && <Calendar className="h-5 w-5 text-blue-600" />}
              {activeSection === 'assignments' && <Settings className="h-5 w-5 text-blue-600" />}
              {activeSection === 'monitoring' && <Filter className="h-5 w-5 text-blue-600" />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{getSectionTitle()}</h1>
              <p className="text-sm text-gray-600">{getSectionDescription()}</p>
            </div>
          </div>
        </div>

        {/* Right Section - Date Range and Actions */}
        <div className="flex items-center space-x-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={workspace.selectedDateRange.startDate.toISOString().split('T')[0]}
                onChange={handleStartDateChange}
                className="text-sm border-none bg-transparent focus:outline-none"
              />
              <span className="text-gray-400">–</span>
              <input
                type="date"
                value={workspace.selectedDateRange.endDate.toISOString().split('T')[0]}
                onChange={handleEndDateChange}
                className="text-sm border-none bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Active Context Display */}
          {workspace.selectedRouteGroup && (
            <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">
                {workspace.routeGroups.find(rg => rg.id === workspace.selectedRouteGroup)?.name || 'Route Group'}
              </span>
              {workspace.selectedRoute && (
                <>
                  <span className="text-blue-400">→</span>
                  <span className="text-sm text-blue-600">
                    {workspace.routeGroups
                      .find(rg => rg.id === workspace.selectedRouteGroup)
                      ?.routes?.find(r => r.id === workspace.selectedRoute)?.name || 'Route'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action Indicators */}
          <div className="flex items-center space-x-2">
            {(workspace.isGeneratingTrips || workspace.isAssigningPsps) && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">
                  {workspace.isGeneratingTrips ? 'Generating trips...' : 'Assigning PSPs...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {workspace.selectedRoute && (
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">Total Trips</div>
            <div className="text-2xl font-bold text-gray-700">{workspace.trips.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-900">Assigned</div>
            <div className="text-2xl font-bold text-green-700">
              {workspace.trips.filter(trip => trip.passengerServicePermitId).length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm font-medium text-orange-900">Pending</div>
            <div className="text-2xl font-bold text-orange-700">
              {workspace.trips.filter(trip => !trip.passengerServicePermitId).length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-900">Available PSPs</div>
            <div className="text-2xl font-bold text-blue-700">{workspace.permits.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}