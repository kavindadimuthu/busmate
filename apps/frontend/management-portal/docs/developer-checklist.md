# TimeKeeper Trip Management - Developer Checklist

## Implementation Status

### ✅ Completed (Frontend)

#### Components Created

- [x] `BusReassignmentModal.tsx` - Bus management modal
- [x] Updated `TimeKeeperTripsTable.tsx` - Added bus management action
- [x] Updated `page.tsx` - Main trip management page with bus reassignment

#### Features Implemented

- [x] View trips passing through assigned bus stop
- [x] Advanced filtering (status, route, operator, bus, PSP, dates)
- [x] Search functionality
- [x] Sorting by multiple columns
- [x] Pagination
- [x] Statistics dashboard
- [x] Bus reassignment modal UI
- [x] Bus removal functionality
- [x] Permission-based action rendering
- [x] Form validation in modal
- [x] Error handling and loading states
- [x] Responsive design
- [x] Info banner for assigned stop

#### Documentation Created

- [x] Implementation guide
- [x] User guide
- [x] MOT vs TimeKeeper comparison
- [x] Quick summary document
- [x] Developer checklist (this document)

### ⏳ Pending (Backend Integration)

#### API Endpoints Needed

- [ ] `GET /api/timekeeper/profile` - Get timekeeper's assigned bus stop
- [ ] `GET /api/trips?busStopId={id}` - Filter trips by bus stop
- [ ] `PATCH /api/trips/{id}/bus-assignment` - Update bus assignment
- [ ] Add `startingStopId` field to TripResponse model

#### Database Changes

- [ ] Add `assigned_bus_stop_id` to users table (timekeeper role)
- [ ] Add `starting_stop_id` to trips table
- [ ] Create audit log table for bus assignments
- [ ] Add indexes for bus stop filtering queries

#### Backend Logic

- [ ] Implement bus stop filtering in trip queries
- [ ] Add permission check for bus reassignment
- [ ] Validate trip starting point in reassignment endpoint
- [ ] Implement audit logging for bus changes
- [ ] Update TripResponse DTO to include starting stop

### 🔄 Future Enhancements

#### High Priority

- [ ] Real-time trip status updates (WebSocket)
- [ ] Push notifications for approaching buses
- [ ] Delay reporting capability
- [ ] Passenger count tracking

#### Medium Priority

- [ ] Export trips to CSV/PDF
- [ ] Bus condition reporting
- [ ] Mobile-optimized interface
- [ ] Offline mode support
- [ ] Schedule conflict alerts

#### Low Priority

- [ ] Advanced analytics dashboard
- [ ] Predictive delay warnings
- [ ] Integration with GPS tracking
- [ ] Automated reports generation
- [ ] Multi-language support

## Code Locations

### Frontend Files

```
src/
├── app/
│   └── timeKeeper/
│       └── (authenticated)/
│           └── trip/
│               └── page.tsx                          [Modified]
│
├── components/
│   └── timeKeeper/
│       └── trips/
│           ├── BusReassignmentModal.tsx              [New]
│           ├── TimeKeeperTripsTable.tsx              [Modified]
│           ├── TripStatsCards.tsx                    [Existing]
│           └── TripAdvancedFilters.tsx               [Existing]
│
└── lib/
    └── api-client/
        └── route-management/
            ├── services/
            │   └── TripManagementService.ts          [To be updated]
            └── models/
                └── TripResponse.ts                    [To be updated]
```

### Documentation Files

```
docs/
├── timekeeper-trip-management-implementation.md      [Updated]
├── timekeeper-trip-management-summary.md             [New]
├── timekeeper-user-guide.md                          [New]
├── mot-vs-timekeeper-comparison.md                   [New]
└── developer-checklist.md                            [This file]
```

## Integration Steps

### Step 1: User Profile Enhancement

**Task**: Add assigned bus stop to user profile

**Backend:**

```sql
-- Migration
ALTER TABLE users
ADD COLUMN assigned_bus_stop_id UUID REFERENCES bus_stops(id);

CREATE INDEX idx_users_assigned_bus_stop
ON users(assigned_bus_stop_id)
WHERE role = 'timekeeper';
```

**API Response:**

```typescript
GET / api / timekeeper / profile;
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
    assignedAt: string;
  }
}
```

**Frontend Update:**

```typescript
// In page.tsx, replace lines 135-148
const { user } = useAuth();
if (user?.assignedBusStop) {
  setAssignedBusStopId(user.assignedBusStop.id);
  setAssignedBusStopName(user.assignedBusStop.name);
}
```

### Step 2: Trip Model Enhancement

**Task**: Add starting stop to trip model

**Backend:**

```sql
-- Migration
ALTER TABLE trips
ADD COLUMN starting_stop_id UUID REFERENCES bus_stops(id);

-- Populate from schedule data
UPDATE trips t
SET starting_stop_id = (
  SELECT rs.bus_stop_id
  FROM route_stops rs
  WHERE rs.route_id = t.route_id
  AND rs.stop_order = 1
);

CREATE INDEX idx_trips_starting_stop
ON trips(starting_stop_id);
```

**Model Update:**

```typescript
// TripResponse.ts
export interface TripResponse {
  // ... existing fields
  startingStopId?: string;
  startingStopName?: string;
}
```

**Frontend Update:**

```typescript
// In page.tsx, replace lines 123-128
const tripStartsAtAssignedStop = (trip: TripResponse): boolean => {
  return trip.startingStopId === assignedBusStopId;
};
```

### Step 3: Bus Stop Filtering

**Task**: Filter trips by bus stop

**Backend:**

```java
// TripController.java
@GetMapping
public ResponseEntity<Page<TripResponse>> getAllTrips(
    @RequestParam(required = false) String busStopId,
    // ... other parameters
) {
    if (busStopId != null) {
        return tripService.getTripsByBusStop(busStopId, pageRequest);
    }
    // ... existing logic
}

// TripService.java
public Page<TripResponse> getTripsByBusStop(String busStopId, Pageable pageable) {
    // Join trips with routes and route_stops
    // Filter where route_stops contains busStopId
    return tripRepository.findByBusStop(busStopId, pageable)
        .map(tripMapper::toResponse);
}
```

**Frontend Update:**

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
    busStopId?: string,  // ADD THIS
    fromDate?: string,
    toDate?: string,
    // ... other parameters
): CancelablePromise<PageTripResponse> {
    return __request(OpenAPI, {
        method: 'GET',
        url: '/api/trips',
        query: {
            'page': page,
            'size': size,
            'sortBy': sortBy,
            'sortDir': sortDir,
            'search': search,
            'status': status,
            'routeId': routeId,
            'operatorId': operatorId,
            'scheduleId': scheduleId,
            'passengerServicePermitId': passengerServicePermitId,
            'busId': busId,
            'busStopId': busStopId,  // ADD THIS
            'fromDate': fromDate,
            'toDate': toDate,
            // ... other parameters
        },
    });
}
```

**Page Update:**

```typescript
// In page.tsx, update loadTrips() around line 213
const response: PageTripResponse = await TripManagementService.getAllTrips(
  queryParams.page,
  queryParams.size,
  queryParams.sortBy,
  queryParams.sortDir,
  queryParams.search || undefined,
  queryParams.status,
  queryParams.routeId,
  queryParams.operatorId,
  queryParams.scheduleId,
  queryParams.passengerServicePermitId,
  queryParams.busId,
  assignedBusStopId, // ADD THIS - pass the bus stop ID
  queryParams.fromDate,
  queryParams.toDate,
  queryParams.hasPsp,
  queryParams.hasBus,
  queryParams.hasDriver,
  queryParams.hasConductor
);
```

### Step 4: Bus Assignment Update Endpoint

**Task**: Create endpoint to update bus assignment

**Backend:**

```java
// TripController.java
@PatchMapping("/{id}/bus-assignment")
public ResponseEntity<TripResponse> updateBusAssignment(
    @PathVariable String id,
    @RequestBody BusAssignmentRequest request,
    @AuthenticationPrincipal User currentUser
) {
    // Validate permission
    Trip trip = tripService.findById(id);
    if (!canManageBusAssignment(currentUser, trip)) {
        throw new ForbiddenException("Cannot manage bus for this trip");
    }

    // Update assignment
    TripResponse updated = tripService.updateBusAssignment(
        id,
        request.getNewBusId(),
        request.getReason(),
        currentUser.getId()
    );

    // Log audit
    auditService.logBusAssignmentChange(
        id,
        trip.getBusId(),
        request.getNewBusId(),
        request.getReason(),
        currentUser.getId()
    );

    return ResponseEntity.ok(updated);
}

private boolean canManageBusAssignment(User user, Trip trip) {
    if (user.getRole() == Role.MOT) {
        return true;
    }
    if (user.getRole() == Role.TIMEKEEPER) {
        return trip.getStartingStopId().equals(user.getAssignedBusStopId());
    }
    return false;
}

// Request DTO
public class BusAssignmentRequest {
    private String newBusId;  // null to remove
    private String reason;
    // getters/setters
}
```

**Service:**

```typescript
// Add to TripManagementService.ts
public static updateTripBusAssignment(
    tripId: string,
    newBusId: string | null,
    reason: string,
    timekeeperId: string
): CancelablePromise<TripResponse> {
    return __request(OpenAPI, {
        method: 'PATCH',
        url: '/api/trips/{tripId}/bus-assignment',
        path: {
            'tripId': tripId,
        },
        body: {
            newBusId,
            reason,
            timekeeperId
        },
        mediaType: 'application/json',
    });
}
```

**Frontend Update:**

```typescript
// In page.tsx, replace lines 396-408
const handleBusReassignment = async (
  tripId: string,
  newBusId: string | null,
  reason: string
) => {
  try {
    const { user } = useAuth();
    await TripManagementService.updateTripBusAssignment(
      tripId,
      newBusId,
      reason,
      user.id
    );

    await loadTrips();
    await loadStatistics();

    setShowBusReassignmentModal(false);
    setTripForBusReassignment(null);
  } catch (err) {
    console.error('Failed to reassign bus:', err);
    alert('Failed to reassign bus. Please try again.');
  }
};
```

### Step 5: Audit Logging

**Task**: Implement audit trail for bus assignments

**Backend:**

```sql
-- Migration
CREATE TABLE bus_assignment_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id),
    old_bus_id UUID REFERENCES buses(id),
    new_bus_id UUID REFERENCES buses(id),
    reason TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_role VARCHAR(50) NOT NULL
);

CREATE INDEX idx_bus_assignment_audit_trip
ON bus_assignment_audit(trip_id);

CREATE INDEX idx_bus_assignment_audit_changed_by
ON bus_assignment_audit(changed_by);
```

**Service:**

```java
// AuditService.java
public void logBusAssignmentChange(
    String tripId,
    String oldBusId,
    String newBusId,
    String reason,
    String userId
) {
    BusAssignmentAudit audit = new BusAssignmentAudit();
    audit.setTripId(tripId);
    audit.setOldBusId(oldBusId);
    audit.setNewBusId(newBusId);
    audit.setReason(reason);
    audit.setChangedBy(userId);
    audit.setChangedAt(LocalDateTime.now());
    audit.setUserRole(userService.findById(userId).getRole());

    auditRepository.save(audit);
}
```

## Testing Checklist

### Unit Tests

#### Frontend

- [ ] BusReassignmentModal renders correctly
- [ ] Modal validation works (required fields)
- [ ] Cannot select same bus in reassignment
- [ ] Close modal on cancel
- [ ] Submit calls onConfirm with correct parameters
- [ ] Loading state displays during submission
- [ ] Error state displays on failure

#### Backend

- [ ] Bus stop filtering returns correct trips
- [ ] Permission check allows MOT all trips
- [ ] Permission check restricts timekeeper to starting stop
- [ ] Bus assignment update works
- [ ] Audit log created on assignment change
- [ ] Validation prevents unauthorized changes

### Integration Tests

- [ ] End-to-end bus reassignment flow
- [ ] Filter trips by bus stop through API
- [ ] Timekeeper can only manage eligible trips
- [ ] MOT can manage all trips
- [ ] Audit trail is complete and accurate
- [ ] Statistics update after reassignment

### Manual Testing

- [ ] Load page, verify assigned stop displayed
- [ ] Verify trips are filtered by bus stop
- [ ] Test all filter combinations
- [ ] Sort by each column
- [ ] Navigate pagination
- [ ] Open bus reassignment modal
- [ ] Reassign bus successfully
- [ ] Remove bus successfully
- [ ] Verify permission checks work
- [ ] Add notes to trip
- [ ] View trip details
- [ ] Check audit log entries

### Performance Testing

- [ ] Page loads in < 2 seconds
- [ ] Filter changes respond in < 500ms
- [ ] Modal opens instantly
- [ ] Bus reassignment completes in < 1 second
- [ ] Handles 100+ trips without lag

### Security Testing

- [ ] Non-timekeeper cannot access page
- [ ] Timekeeper cannot see other stops' trips
- [ ] Cannot reassign buses without permission
- [ ] SQL injection prevention
- [ ] XSS prevention in notes field
- [ ] CSRF token validation

## Deployment Checklist

### Pre-deployment

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Backend API deployed to staging
- [ ] Frontend deployed to staging
- [ ] Staging testing completed

### Database Migration

- [ ] Backup production database
- [ ] Run migration scripts
- [ ] Verify indexes created
- [ ] Populate starting_stop_id for existing trips
- [ ] Assign bus stops to existing timekeepers

### Deployment

- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Verify API endpoints accessible
- [ ] Check error logs
- [ ] Monitor performance metrics

### Post-deployment

- [ ] Smoke test on production
- [ ] Verify assigned bus stops display
- [ ] Test bus reassignment flow
- [ ] Check audit logs working
- [ ] Monitor for errors (24 hours)
- [ ] Gather user feedback

## Rollback Plan

If issues occur:

1. **Frontend only**: Revert to previous version
2. **Backend only**:
   - Revert API changes
   - Keep database changes (they're additive)
3. **Both**: Full rollback
   - Frontend to previous version
   - Backend to previous version
   - Database migration rollback (if necessary)

## Support Resources

### For Developers

- API documentation: `/api/docs`
- TypeScript types: `src/lib/api-client/route-management/models/`
- Component examples: MOT trip management page

### For Users

- User guide: `docs/timekeeper-user-guide.md`
- FAQ: In user guide
- Support contact: support@busmate.lk

## Known Issues

### Current Limitations

1. **Mock Data**: Assigned bus stop is hardcoded
2. **No Real-time Updates**: Page requires manual refresh
3. **No Offline Mode**: Requires internet connection
4. **No Mobile App**: Web only

### Planned Fixes

- Integrate with user profile API (Sprint 2)
- Add WebSocket for real-time updates (Sprint 3)
- Implement service worker for offline (Sprint 4)
- Develop mobile app (Sprint 5)

## Success Criteria

✅ Implementation is complete when:

- [ ] Timekeepers can view trips at their assigned stop
- [ ] Bus reassignment works for eligible trips
- [ ] Permission checks prevent unauthorized actions
- [ ] All data is persisted to database
- [ ] Audit trail is complete
- [ ] No critical bugs in production
- [ ] User acceptance testing passed
- [ ] Documentation is complete

---

**Last Updated**: October 18, 2025  
**Sprint**: Sprint 1 - MVP  
**Status**: Frontend Complete, Backend Pending
