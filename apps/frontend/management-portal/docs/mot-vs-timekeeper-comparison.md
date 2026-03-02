# MOT vs TimeKeeper Trip Management - Feature Comparison

## Overview

This document compares the trip management capabilities between Ministry of Transport (MOT) administrators and TimeKeepers.

## Access Scope

| Aspect               | MOT                     | TimeKeeper                                   |
| -------------------- | ----------------------- | -------------------------------------------- |
| **Trip Visibility**  | All trips in the system | Only trips passing through assigned bus stop |
| **Geographic Scope** | Nationwide              | Single bus stop location                     |
| **Data Filtering**   | No automatic filters    | Auto-filtered by bus stop                    |
| **Multi-location**   | Yes                     | No - single stop only                        |

## Trip Management Actions

| Action                | MOT                | TimeKeeper     | Notes                           |
| --------------------- | ------------------ | -------------- | ------------------------------- |
| **View Trip Details** | ✅ Full access     | ✅ Full access | Both can see complete trip info |
| **Create New Trip**   | ✅ Yes             | ❌ No          | Only MOT creates trips          |
| **Edit Trip Details** | ✅ Yes             | ❌ No          | TimeKeeper is read-only         |
| **Delete Trip**       | ✅ Yes             | ❌ No          | Only MOT can delete             |
| **Generate Trips**    | ✅ Bulk generation | ❌ No          | MOT generates from schedules    |

## Trip Status Management

| Action            | MOT            | TimeKeeper | Notes                             |
| ----------------- | -------------- | ---------- | --------------------------------- |
| **Start Trip**    | ✅ Yes         | ❌ No      | Driver/conductor starts trips     |
| **Complete Trip** | ✅ Yes         | ❌ No      | Driver/conductor completes trips  |
| **Cancel Trip**   | ✅ With reason | ❌ No      | Only MOT can cancel               |
| **Mark Delayed**  | ✅ Yes         | 🔄 Planned | Future: TimeKeeper reports delays |
| **Update Status** | ✅ Yes         | ❌ No      | Manual status changes             |

## Resource Assignment

| Action               | MOT                  | TimeKeeper | Notes                                             |
| -------------------- | -------------------- | ---------- | ------------------------------------------------- |
| **Assign PSP**       | ✅ Individual & Bulk | ❌ No      | Only MOT assigns permits                          |
| **Remove PSP**       | ✅ Yes               | ❌ No      | Only MOT manages permits                          |
| **Assign Bus**       | ✅ Yes               | ⚠️ Limited | TimeKeeper: only for trips starting at their stop |
| **Remove Bus**       | ✅ Yes               | ⚠️ Limited | TimeKeeper: only for trips starting at their stop |
| **Reassign Bus**     | ✅ Yes               | ⚠️ Limited | TimeKeeper: only for trips starting at their stop |
| **Assign Driver**    | ✅ Yes               | ❌ No      | Only MOT assigns drivers                          |
| **Assign Conductor** | ✅ Yes               | ❌ No      | Only MOT assigns conductors                       |

## Information Management

| Action                 | MOT    | TimeKeeper   | Notes                     |
| ---------------------- | ------ | ------------ | ------------------------- |
| **Add Notes**          | ✅ Yes | ✅ Yes       | Both can add observations |
| **Edit Notes**         | ✅ Yes | ✅ Own notes | Can edit their own notes  |
| **View Notes History** | ✅ Yes | ✅ Yes       | Full note history visible |
| **Delete Notes**       | ✅ Yes | ❌ No        | Only MOT can delete       |

## Reporting & Export

| Action                  | MOT            | TimeKeeper       | Notes                             |
| ----------------------- | -------------- | ---------------- | --------------------------------- |
| **Export Trips**        | ✅ All trips   | 🔄 Planned       | Future: Export their stop's trips |
| **View Statistics**     | ✅ System-wide | ✅ Stop-specific | Different scopes                  |
| **Generate Reports**    | ✅ Yes         | 🔄 Planned       | Future enhancement                |
| **Analytics Dashboard** | ✅ Yes         | ⚠️ Limited       | Basic stats only                  |

## Filtering & Search

| Feature             | MOT              | TimeKeeper             | Notes              |
| ------------------- | ---------------- | ---------------------- | ------------------ |
| **Status Filter**   | ✅ All statuses  | ✅ All statuses        | Same options       |
| **Route Filter**    | ✅ All routes    | ✅ Routes through stop | Auto-filtered      |
| **Operator Filter** | ✅ All operators | ✅ Operators at stop   | Auto-filtered      |
| **Date Range**      | ✅ Any range     | ✅ Any range           | Same functionality |
| **Bus Filter**      | ✅ All buses     | ✅ Buses at stop       | Auto-filtered      |
| **PSP Filter**      | ✅ All PSPs      | ✅ PSPs at stop        | Auto-filtered      |
| **Search**          | ✅ Global        | ✅ Stop-specific       | Different scopes   |

## User Interface Elements

### Action Buttons (Trip Table)

**MOT:**

- 👁️ View
- ✏️ Edit
- 🗑️ Delete
- ▶️ Start
- ✅ Complete
- ❌ Cancel
- 📋 Assign PSP
- 🚌 Manage Bus

**TimeKeeper:**

- 👁️ View
- 📝 Add Notes
- 🔄 Remove/Reassign Bus (conditional)

### Bulk Operations

**MOT:**

- ✅ Bulk PSP Assignment
- ✅ Bulk Start
- ✅ Bulk Complete
- ✅ Bulk Cancel
- ✅ Bulk Export

**TimeKeeper:**

- ❌ No bulk operations

## Permission Matrix

### Bus Management Permissions

| Scenario                     | MOT             | TimeKeeper                    |
| ---------------------------- | --------------- | ----------------------------- |
| Trip starts at assigned stop | ✅ Can manage   | ✅ Can manage                 |
| Trip passes through stop     | ✅ Can manage   | ❌ Cannot manage              |
| Trip doesn't involve stop    | ✅ Can manage   | ❌ Cannot see                 |
| Bus has active trip          | ✅ Can reassign | ✅ Can reassign (if eligible) |
| Bus is broken down           | ✅ Can remove   | ✅ Can remove (if eligible)   |

### Required Permissions Check

```typescript
// MOT - No restrictions
const canManageBus = (trip: TripResponse) => true;

// TimeKeeper - Restricted
const canManageBus = (trip: TripResponse) => {
  return trip.startingStopId === user.assignedBusStopId;
};
```

## Audit Trail Requirements

| Action             | MOT Audit             | TimeKeeper Audit      |
| ------------------ | --------------------- | --------------------- |
| **Create Trip**    | ✅ Logged             | N/A                   |
| **Edit Trip**      | ✅ Logged             | N/A                   |
| **Delete Trip**    | ✅ Logged             | N/A                   |
| **Bus Assignment** | ✅ Logged with reason | ✅ Logged with reason |
| **PSP Assignment** | ✅ Logged             | N/A                   |
| **Status Change**  | ✅ Logged             | N/A                   |
| **Add Notes**      | ✅ Logged             | ✅ Logged             |

## Navigation & Layout

| Feature          | MOT         | TimeKeeper          |
| ---------------- | ----------- | ------------------- |
| **Page Title**   | "Trips"     | "Trip Management"   |
| **Breadcrumb**   | MOT > Trips | TimeKeeper > Trip   |
| **Info Banner**  | None        | Shows assigned stop |
| **Sidebar Item** | "Trips"     | "Trip"              |
| **Return Path**  | /mot/trips  | /timeKeeper/trip    |

## Data Display Differences

### Statistics Cards

**MOT Dashboard:**

- Total Trips (system-wide)
- Active Trips (all)
- Completed Trips (all)
- Pending Trips (all)
- Cancelled Trips (all)
- Trips with PSP (all)
- Trips with Bus (all)
- In Transit (all)

**TimeKeeper Dashboard:**

- Total Trips (at stop)
- Active Trips (at stop)
- Completed Trips (at stop)
- Cancelled Trips (at stop)

### Trip Details View

Both roles see:

- Route information
- Schedule times
- Bus assignment
- PSP assignment
- Driver/Conductor info
- Trip status
- Notes history

TimeKeeper cannot edit any of these.

## Modal Dialogs

| Modal                   | MOT            | TimeKeeper |
| ----------------------- | -------------- | ---------- |
| **Delete Confirmation** | ✅ Yes         | ❌ No      |
| **Cancel Trip**         | ✅ With reason | ❌ No      |
| **Assign PSP**          | ✅ Yes         | ❌ No      |
| **Bus Reassignment**    | 🔄 Can add     | ✅ Yes     |
| **Edit Trip**           | ✅ Yes         | ❌ No      |
| **Add Notes**           | ✅ Yes         | ✅ Yes     |

## Future Enhancements

### Planned for TimeKeepers:

1. **Delay Reporting** - Report when buses are late
2. **Passenger Counting** - Track boarding numbers
3. **Bus Condition Reports** - Flag maintenance issues
4. **Real-time Tracking** - See bus locations on map
5. **Offline Mode** - Work without internet
6. **Mobile App** - Dedicated mobile interface
7. **Push Notifications** - Alerts for approaching buses

### Planned for MOT:

1. **Advanced Analytics** - ML-based predictions
2. **Automated Scheduling** - AI-powered optimization
3. **Multi-operator Coordination** - Cross-operator trips
4. **Revenue Analysis** - Financial reporting
5. **Compliance Monitoring** - Regulatory compliance

## Security Considerations

| Aspect                 | MOT                 | TimeKeeper                  |
| ---------------------- | ------------------- | --------------------------- |
| **Row-level Security** | Access all records  | Filter by assignedBusStopId |
| **API Authorization**  | admin role required | timekeeper role required    |
| **Data Visibility**    | Full system         | Limited to assignment       |
| **Sensitive Data**     | Full access         | Limited fields              |
| **Audit Logging**      | All actions logged  | All actions logged          |

## Implementation Notes

### Backend Filtering

**MOT:**

```typescript
SELECT * FROM trips
WHERE <filter_conditions>
ORDER BY <sort_field>
LIMIT <page_size>
```

**TimeKeeper:**

```typescript
SELECT t.* FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN route_stops rs ON r.id = rs.route_id
WHERE rs.bus_stop_id = <timekeeper_assigned_stop>
  AND <filter_conditions>
ORDER BY <sort_field>
LIMIT <page_size>
```

### Permission Checks

**Frontend:**

```typescript
// Show/hide actions based on role
if (userRole === 'mot') {
  showAllActions();
} else if (userRole === 'timekeeper') {
  showLimitedActions();
  if (tripStartsAtAssignedStop(trip)) {
    showBusManagement();
  }
}
```

**Backend:**

```typescript
// Authorize actions
if (action === 'update_bus_assignment') {
  if (userRole === 'mot') {
    return true;
  }
  if (userRole === 'timekeeper') {
    return trip.startingStopId === user.assignedBusStopId;
  }
  return false;
}
```

## Summary

**MOT** = Full administrative control over all trips system-wide
**TimeKeeper** = View-only with limited bus management for their location

The key differentiator is **scope** and **write permissions**:

- MOT: System-wide + Full CRUD
- TimeKeeper: Single location + Read-only + Limited bus management

---

**Legend:**

- ✅ = Fully available
- ⚠️ = Limited/Conditional access
- 🔄 = Planned/Future enhancement
- ❌ = Not available
