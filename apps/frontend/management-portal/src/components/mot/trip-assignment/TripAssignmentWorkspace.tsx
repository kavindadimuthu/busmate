'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Route, Users, Settings, ChevronDown, ChevronRight, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { RouteManagementService } from '../../../../generated/api-clients/route-management/services/RouteManagementService';
import { TripManagementService } from '../../../../generated/api-clients/route-management/services/TripManagementService';
import { PermitManagementService } from '../../../../generated/api-clients/route-management/services/PermitManagementService';
import { ScheduleManagementService } from '../../../../generated/api-clients/route-management/services/ScheduleManagementService';
import type { RouteGroupResponse } from '../../../../generated/api-clients/route-management/models/RouteGroupResponse';
import type { PassengerServicePermitResponse } from '../../../../generated/api-clients/route-management/models/PassengerServicePermitResponse';
import type { TripResponse } from '../../../../generated/api-clients/route-management/models/TripResponse';
import type { ScheduleResponse } from '../../../../generated/api-clients/route-management/models/ScheduleResponse';
import type { BulkPspAssignmentRequest } from '../../../../generated/api-clients/route-management/models/BulkPspAssignmentRequest';

// Workspace Sections
import { PlanningPanel } from './components/PlanningPanel';
import { TripsWorkspace } from './components/TripsWorkspace';
import { AssignmentPanel } from './components/AssignmentPanel';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';

export interface WorkspaceState {
  // Active selections
  selectedRouteGroup: string | null;
  selectedRoute: string | null;
  selectedSchedule: string | null;
  selectedDateRange: {
    startDate: Date;
    endDate: Date;
  };
  selectedTrips: string[];
  
  // Data
  routeGroups: RouteGroupResponse[];
  schedules: ScheduleResponse[];
  trips: TripResponse[];
  permits: PassengerServicePermitResponse[];
  
  // Loading states
  isLoadingRouteGroups: boolean;
  isLoadingSchedules: boolean;
  isLoadingTrips: boolean;
  isLoadingPermits: boolean;
  isGeneratingTrips: boolean;
  isAssigningPsps: boolean;
  
  // Error states
  routeGroupsError: string | null;
  schedulesError: string | null;
  tripsError: string | null;
  permitsError: string | null;
  generateTripsError: string | null;
  assignmentError: string | null;
}

export function TripAssignmentWorkspace() {
  // Workspace state
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    selectedRouteGroup: null,
    selectedRoute: null,
    selectedSchedule: null,
    selectedDateRange: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
    },
    selectedTrips: [],
    routeGroups: [],
    schedules: [],
    trips: [],
    permits: [],
    isLoadingRouteGroups: true,
    isLoadingSchedules: false,
    isLoadingTrips: false,
    isLoadingPermits: false,
    isGeneratingTrips: false,
    isAssigningPsps: false,
    routeGroupsError: null,
    schedulesError: null,
    tripsError: null,
    permitsError: null,
    generateTripsError: null,
    assignmentError: null,
  });

  // Workspace view mode
  const [activeSection, setActiveSection] = useState<'planning' | 'assignments' | 'monitoring'>('planning');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize workspace data
  useEffect(() => {
    loadRouteGroups();
  }, []);

  // Load route groups
  const loadRouteGroups = async () => {
    try {
      setWorkspace(prev => ({ ...prev, isLoadingRouteGroups: true, routeGroupsError: null }));
      const response = await RouteManagementService.getAllRouteGroupsAsList();
      setWorkspace(prev => ({ ...prev, routeGroups: response, isLoadingRouteGroups: false }));
    } catch (error) {
      console.error('Error loading route groups:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        routeGroupsError: 'Failed to load route groups', 
        isLoadingRouteGroups: false 
      }));
    }
  };

  // Load schedules for selected route
  const loadSchedules = async (routeId: string) => {
    try {
      setWorkspace(prev => ({ ...prev, isLoadingSchedules: true, schedulesError: null }));
      const response = await ScheduleManagementService.getSchedulesByRoute(routeId);
      setWorkspace(prev => ({ ...prev, schedules: response.content || [], isLoadingSchedules: false }));
    } catch (error) {
      console.error('Error loading schedules:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        schedulesError: 'Failed to load schedules', 
        isLoadingSchedules: false 
      }));
    }
  };

  // Load trips for selected route
  const loadTrips = async (routeId: string) => {
    try {
      setWorkspace(prev => ({ ...prev, isLoadingTrips: true, tripsError: null }));
      const response = await TripManagementService.getTripsByRoute(routeId);
      setWorkspace(prev => ({ ...prev, trips: response, isLoadingTrips: false }));
    } catch (error) {
      console.error('Error loading trips:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        tripsError: 'Failed to load trips', 
        isLoadingTrips: false 
      }));
    }
  };

  // Load permits for selected route group
  const loadPermits = async (routeGroupId: string) => {
    try {
      setWorkspace(prev => ({ ...prev, isLoadingPermits: true, permitsError: null }));
      const response = await PermitManagementService.getPermitsByRouteGroupId(routeGroupId);
      setWorkspace(prev => ({ ...prev, permits: response, isLoadingPermits: false }));
    } catch (error) {
      console.error('Error loading permits:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        permitsError: 'Failed to load permits', 
        isLoadingPermits: false 
      }));
    }
  };

  // Generate trips for schedule
  const generateTrips = async (scheduleId: string, startDate: Date, endDate: Date) => {
    try {
      setWorkspace(prev => ({ ...prev, isGeneratingTrips: true, generateTripsError: null }));
      
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      const response = await TripManagementService.generateTripsForSchedule(scheduleId, fromDate, toDate);
      
      // Refresh trips after generation
      if (workspace.selectedRoute) {
        await loadTrips(workspace.selectedRoute);
      }
      
      setWorkspace(prev => ({ ...prev, isGeneratingTrips: false }));
      return response;
    } catch (error) {
      console.error('Error generating trips:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        generateTripsError: 'Failed to generate trips', 
        isGeneratingTrips: false 
      }));
      throw error;
    }
  };

  // Bulk assign PSPs to trips
  const bulkAssignPsps = async (assignments: BulkPspAssignmentRequest) => {
    try {
      setWorkspace(prev => ({ ...prev, isAssigningPsps: true, assignmentError: null }));
      
      const response = await TripManagementService.bulkAssignPspsToTrips(assignments);
      
      // Refresh trips after assignment
      if (workspace.selectedRoute) {
        await loadTrips(workspace.selectedRoute);
      }
      
      setWorkspace(prev => ({ ...prev, isAssigningPsps: false, selectedTrips: [] }));
      return response;
    } catch (error) {
      console.error('Error assigning PSPs:', error);
      setWorkspace(prev => ({ 
        ...prev, 
        assignmentError: 'Failed to assign PSPs', 
        isAssigningPsps: false 
      }));
      throw error;
    }
  };

  // Handle route group selection
  const handleRouteGroupSelect = (routeGroupId: string) => {
    setWorkspace(prev => ({
      ...prev,
      selectedRouteGroup: routeGroupId,
      selectedRoute: null,
      selectedSchedule: null,
      selectedTrips: [],
      schedules: [],
      trips: [],
    }));
    loadPermits(routeGroupId);
  };

  // Handle route selection
  const handleRouteSelect = (routeId: string) => {
    setWorkspace(prev => ({
      ...prev,
      selectedRoute: routeId,
      selectedSchedule: null,
      selectedTrips: [],
    }));
    loadSchedules(routeId);
    loadTrips(routeId);
  };

  // Handle schedule selection
  const handleScheduleSelect = (scheduleId: string) => {
    setWorkspace(prev => ({
      ...prev,
      selectedSchedule: scheduleId,
      selectedTrips: [],
    }));
  };

  // Handle trip selection
  const handleTripSelect = (tripId: string, multi: boolean = false) => {
    setWorkspace(prev => {
      const selectedTrips = multi 
        ? prev.selectedTrips.includes(tripId)
          ? prev.selectedTrips.filter(id => id !== tripId)
          : [...prev.selectedTrips, tripId]
        : [tripId];
      
      return { ...prev, selectedTrips };
    });
  };

  // Handle clear all selections
  const handleClearSelection = () => {
    setWorkspace(prev => ({
      ...prev,
      selectedTrips: []
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setWorkspace(prev => ({
      ...prev,
      selectedDateRange: { startDate, endDate },
    }));
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-50 ">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar
        workspace={workspace}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onRouteGroupSelect={handleRouteGroupSelect}
        onRouteSelect={handleRouteSelect}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Workspace Header */}
        <WorkspaceHeader
          workspace={workspace}
          activeSection={activeSection}
          onDateRangeChange={handleDateRangeChange}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Planning or Assignment Management */}
          {activeSection === 'planning' && (
            <PlanningPanel
              workspace={workspace}
              onScheduleSelect={handleScheduleSelect}
              onGenerateTrips={generateTrips}
            />
          )}

          {activeSection === 'assignments' && (
            <AssignmentPanel
              workspace={workspace}
              onBulkAssign={bulkAssignPsps}
            />
          )}

          {/* Center Panel - Trips Workspace */}
          <TripsWorkspace
            workspace={workspace}
            onTripSelect={handleTripSelect}
            activeSection={activeSection}
            onRefreshTrips={() => workspace.selectedRoute && loadTrips(workspace.selectedRoute)}
            onClearSelection={handleClearSelection}
          />
        </div>
      </div>
    </div>
  );
}