# TimeKeeper Trip Management - Implementation Guide

## Overview

The TimeKeeper's trip management page enables timekeepers to view and manage trips passing through their assigned bus stop. TimeKeepers have read-only access to schedules but can remove/reassign buses for trips that start at their assigned location.

## Latest Implementation (v2.0)

### Key Features

1. **View Trips at Assigned Bus Stop**: All trips passing through the timekeeper's assigned stop
2. **Read-Only Schedule Access**: Can view but not edit schedules
3. **Bus Management**: Can remove/reassign buses ONLY for trips starting at their assigned stop
4. **Advanced Filtering**: Filter by status, route, operator, schedule, bus, PSP, dates
5. **Trip Notes**: Can add notes to any trip
6. **Statistics Dashboard**: View metrics for trips at their stop

## File Structure

```
src/
├── app/
│   └── timeKeeper/
│       └── (authenticated)/
│           └── trip/
│               └── page.tsx                    # Main trip management page (UPDATED)
├── components/
│   └── timeKeeper/
│       └── trips/
│           ├── TimeKeeperTripsTable.tsx       # Trips table (UPDATED - added bus mgmt)
│           ├── TripStatsCards.tsx             # Statistics cards
│           ├── TripAdvancedFilters.tsx        # Filter component
│           └── BusReassignmentModal.tsx       # Bus reassignment modal (NEW)
```

## Components

### 1. Main Page Component (`page.tsx`)

**Location**: `src/app/timeKeeper/(authenticated)/trip/page.tsx`

**New Features**:

- Bus reassignment modal integration
- Permission check for bus management (`tripStartsAtAssignedStop`)
- Assigned bus stop information banner
- Handler for bus removal/reassignment

**Key State**:

```typescript
- assignedBusStopId: string           // Timekeeper's assigned stop
- assignedBusStopName: string         // Display name
- showBusReassignmentModal: boolean   // Modal visibility
- tripForBusReassignment: TripResponse | null
```

**New Functions**:

```typescript
handleRemoveBus(tripId); // Initiates bus reassignment
handleBusReassignment(tripId, newBusId, reason); // Processes change
tripStartsAtAssignedStop(trip); // Permission check
```

6. **Statistics**: Shows trip statistics dashboard
7. **Notes**: TimeKeepers can add/edit notes on trips

### ⚠️ Temporary Solutions (TODOs)

#### **TODO #1: Get Assigned Bus Stop from User Context**

**Current Implementation:**

```typescript
// In TripManagementClient.tsx (line 64)
const assignedBusStop = 'Matara Bus Station'; // HARDCODED
```

**What Needs to Be Done:**

1. Add `assignedBusStop` or `assignedStationId` field to the User model
2. Update the backend user profile to include this information
3. Fetch it from AuthContext:

```typescript
const { user } = useAuth();
const assignedBusStop = user?.assignedBusStop || 'Unknown Station';
const assignedBusStopId = user?.assignedBusStopId;
```

#### **TODO #2: Backend API Enhancement**

**Current Limitation:** The `getAllTrips` API doesn't have a `busStopId` parameter

**Solution Option A - Backend Change (Recommended):**
Add a new query parameter to the trips API:

```typescript
// In TripManagementService.ts
public static getAllTrips(
    page?: number,
    size: number = 10,
    sortBy: string = 'tripDate',
    sortDir: string = 'desc',
    search?: string,
    status?: string,
    routeId?: string,
    operatorId?: string,
    scheduleId?: string,
    passengerServicePermitId?: string,
    busId?: string,
    busStopId?: string,  // NEW PARAMETER
    fromDate?: string,
    toDate?: string,
    // ... other parameters
): CancelablePromise<PageTripResponse>
```

Backend should:

- Filter trips where the route includes the specified bus stop
- Only return trips that serve that particular station

**Solution Option B - Client-side Filtering (Current):**

```typescript
// In TripManagementClient.tsx (lines 154-163)
// Current temporary solution
const response: PageTripResponse =
  await TripManagementService.getAllTrips(/* ... */);

// Client-side filtering by route name
const filteredTrips =
  response.content?.filter((trip) =>
    trip.routeName?.toLowerCase().includes('matara')
  ) || [];
```

**Problem with Option B:**

- Inefficient (fetches all trips then filters)
- Pagination counts may be incorrect
- Doesn't scale well

#### **TODO #3: Filter Routes by Bus Stop**

**Current Implementation:**

```typescript
// In TripManagementClient.tsx (lines 149-151)
const filteredRoutes =
  response.routes?.filter(
    (route) =>
      route.name?.toLowerCase().includes('matara') ||
      route.routeGroupName?.toLowerCase().includes('matara')
  ) || [];
```

**What Needs to Be Done:**

1. Backend should provide an endpoint to get routes serving a specific bus stop:

```typescript
GET / api / routes / by - bus - stop / { busStopId };
```

2. Or enhance the existing filter options endpoint:

```typescript
GET /api/trips/filter-options?busStopId={busStopId}
```

#### **TODO #4: Statistics Filtering**

**Current Implementation:**

```typescript
// In TripManagementClient.tsx (lines 180-192)
// Stats are NOT filtered by bus stop
const response: TripStatisticsResponse =
  await TripManagementService.getTripStatistics();
```

**What Needs to Be Done:**
Backend should support filtered statistics:

```typescript
GET /api/trips/statistics?busStopId={busStopId}
```

#### **TODO #5: Update Trip Notes API**

**Current Implementation:**

```typescript
// In TripManagementClient.tsx (lines 469-472)
// API call is commented out
// await TripManagementService.updateTrip(tripForNotes.id!, { notes });
console.log('Saving notes for trip:', tripForNotes.id, notes);
```

**What Needs to Be Done:**

1. Implement `updateTrip` method in `TripManagementService` if not exists
2. Or create a specific endpoint for updating notes:

```typescript
PATCH / api / trips / { tripId } / notes;
```

#### **TODO #6: Route Model Enhancement**

**Current Limitation:** `TripResponse` doesn't include bus stop information

**What Needs to Be Done:**
Enhance the Trip/Route model to include bus stops:

```typescript
export type TripResponse = {
  // ... existing fields
  route?: {
    id: string;
    name: string;
    busStops: Array<{
      id: string;
      name: string;
      sequence: number;
    }>;
  };
};
```

This would allow proper client-side filtering:

```typescript
const filteredTrips = response.content.filter((trip) =>
  trip.route?.busStops?.some((stop) => stop.id === assignedBusStopId)
);
```

## Implementation Priority

### Phase 1: Critical (Do First)

1. ✅ **DONE**: Create API-integrated trip management client
2. ✅ **DONE**: Create TimeKeeper-specific table component
3. ⏳ **TODO**: Add `assignedBusStop` to User model and backend
4. ⏳ **TODO**: Fetch assigned bus stop from user profile

### Phase 2: Backend Enhancement (Essential)

1. ⏳ **TODO**: Add `busStopId` parameter to trips API
2. ⏳ **TODO**: Implement bus stop filtering in backend
3. ⏳ **TODO**: Add bus stop filter to statistics endpoint
4. ⏳ **TODO**: Create route-by-bus-stop endpoint

### Phase 3: Polish (Nice to Have)

1. ⏳ **TODO**: Implement notes update API
2. ⏳ **TODO**: Add trip details view page for TimeKeeper
3. ⏳ **TODO**: Add real-time updates for trip status changes
4. ⏳ **TODO**: Add notifications for trips departing soon

## File Structure

```
src/
├── app/
│   └── timeKeeper/
│       └── (authenticated)/
│           └── trip/
│               ├── page.tsx                          # Main page (updated)
│               ├── TripManagementClient.tsx          # NEW: API-integrated client
│               └── ScheduleManagementClient.tsx      # OLD: Can be removed
├── components/
│   ├── timeKeeper/
│   │   └── trips/
│   │       └── TimeKeeperTripsTable.tsx              # NEW: Custom table
│   └── mot/
│       └── trips/
│           ├── TripStatsCards.tsx                    # Reused
│           ├── TripAdvancedFilters.tsx               # Reused
│           └── TripsTable.tsx                        # NOT used by TimeKeeper
└── lib/
    └── api-client/
        └── route-management/
            ├── services/
            │   └── TripManagementService.ts           # API service
            └── models/
                ├── TripResponse.ts                    # Trip model
                └── ...
```

## Testing Checklist

### Manual Testing

- [ ] Page loads without errors
- [ ] Trips are fetched from API
- [ ] Only trips with "Matara" in route name are shown
- [ ] Statistics cards display correct numbers
- [ ] Filters work correctly
- [ ] Search functionality works
- [ ] Sorting works for each column
- [ ] Pagination works
- [ ] View button navigates correctly
- [ ] Add Notes button opens modal
- [ ] Notes can be typed and saved (console log for now)
- [ ] Info banner shows assigned station

### After Backend Changes

- [ ] Trips are filtered by actual bus stop ID
- [ ] Statistics reflect filtered data
- [ ] Route filter only shows relevant routes
- [ ] Pagination counts are accurate
- [ ] Notes are saved to backend
- [ ] All CRUD operations work correctly

## Differences from MOT Version

| Feature         | MOT | TimeKeeper                 |
| --------------- | --- | -------------------------- |
| View all trips  | ✅  | ❌ (Only assigned station) |
| Add new trip    | ✅  | ❌                         |
| Edit trip       | ✅  | ❌                         |
| Delete trip     | ✅  | ❌                         |
| Start trip      | ✅  | ❌                         |
| Complete trip   | ✅  | ❌                         |
| Cancel trip     | ✅  | ❌                         |
| Assign PSP      | ✅  | ❌                         |
| Bulk operations | ✅  | ❌                         |
| View details    | ✅  | ✅                         |
| Add/Edit notes  | ✅  | ✅                         |
| Export          | ✅  | ❌ (Can be added)          |
| Generate trips  | ✅  | ❌                         |

## Next Steps

1. **Backend Team**: Implement bus stop filtering in the trips API
2. **Frontend Team**: Remove hardcoded "Matara" filter once backend is ready
3. **User Management Team**: Add assigned bus stop to user profile
4. **Testing Team**: Test with different bus stations
5. **Documentation Team**: Update API documentation

## Notes

- The old `ScheduleManagementClient.tsx` can be kept as backup or removed
- All MOT components are reused where possible to maintain consistency
- The TimeKeeper role has read-only access with limited note-taking capability
- Future enhancement: Add real-time trip tracking on a map for TimeKeepers
