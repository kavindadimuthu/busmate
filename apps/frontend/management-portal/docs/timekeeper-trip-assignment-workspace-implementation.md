# TimeKeeper Trip Assignment Workspace - Implementation Guide

## Overview

The TimeKeeper Trip Assignment system is based on the MOT Trip Assignment architecture but customized for TimeKeeper-specific requirements:

1. **No Trip Planning**: TimeKeepers cannot create or generate trips - they only manage existing trips
2. **Bus Stop Filtering**: Only trips starting from the TimeKeeper's assigned bus stop are displayed
3. **Reassignment Focus**: Primary function is to reassign buses when needed
4. **Monitoring Capabilities**: View and monitor trips passing through their bus stop

## Architecture

### Component Structure

```
trip-assignment-workspace/
├── index.tsx                                    # Export wrapper
├── TimeKeeperTripAssignmentWorkspace.tsx       # Main workspace orchestrator
└── components/
    ├── TimeKeeperWorkspaceHeader.tsx           # Header with bus stop info
    ├── TimeKeeperWorkspaceSidebar.tsx          # Route selection sidebar
    ├── TimeKeeperAssignmentPanel.tsx           # Bus assignment panel
    └── TimeKeeperTripsWorkspace.tsx            # Trips display workspace
```

## Key Differences from MOT Version

### 1. State Management

**MOT Version:**

```typescript
interface WorkspaceState {
  selectedSchedule: string | null; // Can select schedules
  isGeneratingTrips: boolean; // Can generate trips
  // ... other planning-related state
}
```

**TimeKeeper Version:**

```typescript
interface TimeKeeperWorkspaceState {
  assignedBusStopId: string | null; // NEW: Tracks assigned stop
  assignedBusStopName: string | null; // NEW: Display name
  // NO schedule selection
  // NO trip generation
}
```

### 2. Component Differences

#### Header Component

- **MOT**: Shows planning/assignment/monitoring sections
- **TimeKeeper**: Only shows assignment/monitoring sections
- **Added**: Assigned bus stop badge prominently displayed
- **Added**: Quick stats for total/assigned/unassigned trips

#### Sidebar Component

- **MOT**: 3 sections (Planning, Assignment, Monitoring)
- **TimeKeeper**: 2 sections (Assignment, Monitoring only)
- **Added**: Info banner explaining bus stop restrictions
- **Color Scheme**: Changed from blue to indigo to differentiate roles

#### Assignment Panel

- **MOT**: Complex assignment modes (auto/manual distribution)
- **TimeKeeper**: Simplified to auto-distribution only
- **Added**: Warning about bus stop restrictions
- **Simplified**: Clearer messaging about "buses" vs "PSPs"

#### Trips Workspace

- **MOT**: 3 view modes (All List, Daily, Weekly)
- **TimeKeeper**: 2 view modes (All List, Daily only)
- **Simplified**: Removed weekly grid view
- **Added**: Bus stop origin badge on each trip card
- **Removed**: Complex trip planning features

### 3. Filtering Logic

**TimeKeeper-Specific Filter (lines 133-142 in TimeKeeperTripAssignmentWorkspace.tsx):**

```typescript
const loadTrips = async (routeId: string) => {
  const response = await TripManagementService.getTripsByRoute(routeId);

  // Filter trips that start from the timekeeper's assigned bus stop
  const filteredTrips = workspace.assignedBusStopId
    ? response.filter((trip) => {
        // TODO: Replace with actual API filtering when backend supports busStopId parameter
        // For now, showing all trips. In production, filter by:
        // trip.startingStopId === workspace.assignedBusStopId
        return true;
      })
    : response;

  setWorkspace((prev) => ({ ...prev, trips: filteredTrips }));
};
```

## Backend Integration Requirements

### 1. User Profile Enhancement

The TimeKeeper needs their assigned bus stop information:

```typescript
// GET /api/timekeeper/profile
{
  id: string;
  name: string;
  email: string;
  role: 'timekeeper';
  assignedBusStop: {
    id: string;
    name: string;
    location: {
      lat: number;
      lng: number;
    }
  }
}
```

**Current Implementation (line 97-109):**

```typescript
const loadAssignedBusStop = async () => {
  try {
    // TODO: Replace with actual API call
    // Example: const response = await TimekeeperService.getAssignedBusStop();
    setWorkspace((prev) => ({
      ...prev,
      assignedBusStopId: 'mock-bus-stop-id',
      assignedBusStopName: 'Main Terminal',
    }));
  } catch (error) {
    console.error('Error loading assigned bus stop:', error);
  }
};
```

### 2. Trip Filtering by Bus Stop

The Trip API needs to support filtering by starting bus stop:

```typescript
// GET /api/trips/by-route/{routeId}?busStopId={busStopId}
```

**Required Changes:**

1. Add `startingStopId` field to `TripResponse`
2. Add `busStopId` query parameter to trip endpoints
3. Filter trips server-side for performance

### 3. Assignment Restrictions

Backend should validate that TimeKeepers can only reassign trips starting from their assigned stop:

```typescript
// POST /api/trips/bulk-assign
// Validation: Check if trip.startingStopId === timekeeper.assignedBusStopId
```

## Features

### ✅ Implemented Features

1. **Route Selection**

   - Browse route groups and routes
   - Select specific route to view trips
   - Search functionality for routes

2. **Trip Display**

   - List all trips for selected route
   - Daily view with date navigation
   - Multi-select trips using Ctrl/Cmd + Click
   - Visual indicators for assigned/unassigned trips

3. **Bus Assignment**

   - View available PSPs (buses) for route group
   - Select multiple buses
   - Bulk assign buses to selected trips
   - Auto-distribution algorithm
   - Capacity tracking with visual indicators

4. **Filtering**

   - Filter by trip status (pending, active, completed, etc.)
   - Filter by assignment status (assigned/unassigned)
   - Date-based filtering in daily view

5. **Monitoring**
   - Real-time trip status display
   - Assignment status indicators
   - Bus stop origin tracking

### 🚧 Pending Backend Integration

1. **Bus Stop Loading**: Replace mock data with actual API call
2. **Trip Filtering**: Implement server-side filtering by bus stop
3. **Validation**: Add TimeKeeper-specific permission checks
4. **Audit Logging**: Track all reassignment actions

### 🎯 Future Enhancements

1. **Real-time Updates**: WebSocket integration for live trip status
2. **Notifications**: Alert when trips need reassignment
3. **History**: View past reassignment actions
4. **Reports**: Generate assignment reports for the day
5. **Bulk Actions**: Quick actions for common scenarios

## Usage Guide

### For TimeKeepers

1. **Select a Route**

   - Use the sidebar to browse route groups
   - Click on a specific route to view its trips
   - Only trips starting from your bus stop will appear

2. **View Trips**

   - Switch between "All" view (all trips) and "Daily" view (specific date)
   - Use filters to find specific trips (by status or assignment)
   - Select trips by clicking (Ctrl/Cmd + Click for multi-select)

3. **Assign Buses**

   - In the left panel, view available buses (PSPs)
   - Select one or more buses
   - Click "Assign" to distribute selected buses to selected trips
   - Buses are auto-distributed evenly across trips

4. **Monitor Status**
   - Green checkmark = Bus assigned
   - Orange warning = Needs assignment
   - View real-time trip status
   - Track bus capacity utilization

## Color Scheme

To differentiate from MOT, the TimeKeeper interface uses:

- **Primary**: Indigo (`indigo-50`, `indigo-600`, etc.)
- **MOT Primary**: Blue (`blue-50`, `blue-600`, etc.)
- **Status Colors**: Same as MOT (green/yellow/red/orange)

## Code Examples

### Selecting Multiple Trips

```typescript
// Single select
onTripSelect('trip-id', false);

// Multi-select (with Ctrl/Cmd held)
onTripSelect('trip-id', true);
```

### Bulk Assignment

```typescript
const handleBulkAssignment = async () => {
  const assignments: PspTripAssignment[] = [];

  // Auto-distribute selected PSPs across selected trips
  workspace.selectedTrips.forEach((tripId, index) => {
    const pspIndex = index % selectedPsps.length;
    assignments.push({
      tripId,
      passengerServicePermitId: selectedPsps[pspIndex],
      notes: assignmentNotes || undefined,
    });
  });

  await onBulkAssign({ assignments });
};
```

## Testing Checklist

- [ ] Route selection loads trips correctly
- [ ] Trips display with proper status indicators
- [ ] Multi-select works with Ctrl/Cmd + Click
- [ ] Date navigation in daily view
- [ ] Status filters work correctly
- [ ] Assignment filters work correctly
- [ ] PSP selection updates assignment panel
- [ ] Bulk assignment creates correct assignments
- [ ] Capacity tracking shows accurate percentages
- [ ] Clear selection button works
- [ ] Assigned bus stop displays correctly
- [ ] Error states display properly
- [ ] Loading states show appropriately

## File Locations

### New Components

- `src/components/timeKeeper/trip-assignment-workspace/`
- All component files and subcomponents

### Updated Files

- `src/app/timeKeeper/(authenticated)/trip-assignment/page.tsx`
  - Updated to use new workspace component

### Existing Files (Kept for Reference)

- `src/components/timeKeeper/trip-assignment/` (old implementation)
  - Can be removed once new implementation is validated

## Migration Notes

If migrating from the old trip assignment component:

1. **Import Change**:

   ```typescript
   // Old
   import { TripAssignment } from '@/components/timeKeeper/trip-assignment';

   // New
   import { TimeKeeperTripAssignment } from '@/components/timeKeeper/trip-assignment-workspace';
   ```

2. **No Props Changes**: The component is self-contained

3. **State Management**: All state is managed internally

## Support

For issues or questions:

1. Check the MOT trip assignment implementation for reference
2. Review the backend integration requirements section
3. Check console for detailed error messages
4. Ensure all required API endpoints are implemented
