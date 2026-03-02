# TimeKeeper vs MOT Trip Assignment - Quick Comparison

## Side-by-Side Feature Comparison

| Feature              | MOT                                        | TimeKeeper                           |
| -------------------- | ------------------------------------------ | ------------------------------------ |
| **Trip Planning**    | ✅ Can create schedules and generate trips | ❌ Cannot plan trips                 |
| **Trip Viewing**     | ✅ All trips for route                     | ✅ Only trips from assigned bus stop |
| **Trip Assignment**  | ✅ Bulk assign PSPs to trips               | ✅ Bulk reassign buses to trips      |
| **View Modes**       | All List, Daily, Weekly                    | All List, Daily (no weekly)          |
| **Sections**         | Planning, Assignment, Monitoring           | Assignment, Monitoring only          |
| **Scope**            | System-wide route management               | Bus stop-specific management         |
| **Color Theme**      | Blue                                       | Indigo (to differentiate)            |
| **Bus Stop Context** | Not applicable                             | Always visible                       |

## UI Component Comparison

### Header

**MOT:**

- Section tabs: Planning / Assignment / Monitoring
- Date range selector
- Action buttons for planning

**TimeKeeper:**

- Section tabs: Assignment / Monitoring only
- Assigned bus stop badge (prominent)
- Date range selector
- Trip statistics (total/assigned/unassigned)

### Sidebar

**MOT:**

- 3 section navigation buttons
- Route group browser
- Route selection

**TimeKeeper:**

- 2 section navigation buttons
- Bus stop name displayed in header
- Info banner about restrictions
- Route group browser (same)
- Route selection (same)

### Left Panel

**MOT - Planning Mode:**

- Schedule selector
- Trip generation controls
- Date range picker for generation
- Generate trips button

**MOT - Assignment Mode:**

- PSP list with capacity
- Assignment mode selector (auto/manual)
- Notes field
- Bulk assign button

**TimeKeeper - Assignment Mode:**

- Bus (PSP) list with capacity
- Auto-distribution only (simplified)
- Warning about bus stop restrictions
- Notes field
- Bulk assign button

### Center Panel (Trips Workspace)

**MOT:**

- View modes: All / Daily / Weekly
- Status filter dropdown
- Assignment filter dropdown
- Multi-select trips
- Trip cards with full details
- Context menu for individual actions

**TimeKeeper:**

- View modes: All / Daily only (no weekly)
- Status filter dropdown (same)
- Assignment filter dropdown (same)
- Multi-select trips (same)
- Trip cards with bus stop badge
- Simplified individual actions

## Functional Differences

### What TimeKeepers CAN Do:

1. ✅ View trips starting from their assigned bus stop
2. ✅ Select multiple trips
3. ✅ View available buses (PSPs) for the route
4. ✅ Assign/reassign buses to trips
5. ✅ Filter trips by status and assignment
6. ✅ View trip details and status
7. ✅ Monitor trip progress
8. ✅ Navigate by date

### What TimeKeepers CANNOT Do:

1. ❌ Create or edit schedules
2. ❌ Generate new trips
3. ❌ View trips from other bus stops
4. ❌ Use manual assignment mode
5. ❌ Access planning section
6. ❌ Modify route configurations
7. ❌ View weekly grid (removed for simplicity)

## Code Structure Comparison

### File Organization

**MOT:**

```
components/mot/trip-assignment/
├── TripAssignmentWorkspace.tsx
└── components/
    ├── PlanningPanel.tsx          ⬅️ Trip planning
    ├── AssignmentPanel.tsx
    ├── TripsWorkspace.tsx
    ├── WorkspaceHeader.tsx
    └── WorkspaceSidebar.tsx
```

**TimeKeeper:**

```
components/timeKeeper/trip-assignment-workspace/
├── TimeKeeperTripAssignmentWorkspace.tsx
└── components/
    ├── TimeKeeperAssignmentPanel.tsx     (no planning panel)
    ├── TimeKeeperTripsWorkspace.tsx
    ├── TimeKeeperWorkspaceHeader.tsx
    └── TimeKeeperWorkspaceSidebar.tsx
```

### State Management

**MOT State:**

```typescript
{
  selectedSchedule: string | null,
  isGeneratingTrips: boolean,
  schedules: ScheduleResponse[],
  // ... more planning-related state
}
```

**TimeKeeper State:**

```typescript
{
  assignedBusStopId: string | null,        // NEW
  assignedBusStopName: string | null,      // NEW
  // NO selectedSchedule
  // NO isGeneratingTrips
  // NO schedules array
}
```

## User Workflows

### MOT Workflow:

1. Select route group and route
2. **PLAN**: Choose schedule → Generate trips for date range
3. **ASSIGN**: Select generated trips → Choose PSPs → Assign
4. **MONITOR**: View trip status and progress

### TimeKeeper Workflow:

1. Select route group and route (trips auto-load)
2. **ASSIGN**: Select existing trips → Choose buses → Reassign
3. **MONITOR**: View trip status for bus stop

## API Calls Comparison

### MOT Makes These Calls:

```typescript
RouteManagementService.getAllRouteGroupsAsList()
ScheduleManagementService.getSchedulesByRoute(routeId)          ⬅️ Planning
TripManagementService.generateTripsForSchedule(...)             ⬅️ Planning
TripManagementService.getTripsByRoute(routeId)
PermitManagementService.getPermitsByRouteGroupId(routeGroupId)
TripManagementService.bulkAssignPspsToTrips(assignments)
```

### TimeKeeper Makes These Calls:

```typescript
RouteManagementService.getAllRouteGroupsAsList()
// NO schedule calls
// NO generate trips calls
TripManagementService.getTripsByRoute(routeId)                  ⬅️ Filtered by bus stop
PermitManagementService.getPermitsByRouteGroupId(routeGroupId)
TripManagementService.bulkAssignPspsToTrips(assignments)
TimekeeperService.getAssignedBusStop()                          ⬅️ NEW
```

## Permission Requirements

### MOT Permissions:

- `trips:read`
- `trips:create` (generation)
- `trips:assign`
- `schedules:read`
- `schedules:create`
- `permits:read`
- `routes:read`

### TimeKeeper Permissions:

- `trips:read` (filtered by bus stop)
- `trips:assign` (only for assigned bus stop trips)
- `permits:read`
- `routes:read`
- ~~`schedules:read`~~ (not needed)
- ~~`trips:create`~~ (not needed)

## Visual Differences

### Color Palette

**MOT:**

- Primary: Blue (`#2563EB`)
- Active states: `bg-blue-50`, `text-blue-600`
- Borders: `border-blue-500`

**TimeKeeper:**

- Primary: Indigo (`#4F46E5`)
- Active states: `bg-indigo-50`, `text-indigo-600`
- Borders: `border-indigo-500`

### Layout Differences

**MOT:**

- 3-column layout when in Planning mode
- 2-column layout when in Monitoring mode

**TimeKeeper:**

- 2-column layout always (no planning panel)
- More horizontal space for trips workspace

## Data Flow

### MOT:

```
User → Planning Panel → Generate Trips → Trips appear in workspace
User → Select Trips → Assignment Panel → Assign PSPs → Refresh
```

### TimeKeeper:

```
System → Trips auto-load (filtered by bus stop) → Trips appear
User → Select Trips → Assignment Panel → Reassign buses → Refresh
```

## Key Implementation Notes

1. **Reusable Architecture**: TimeKeeper version reuses MOT's component patterns but simplifies them

2. **Type Safety**: All components are fully typed with TypeScript

3. **Error Handling**: Same error handling patterns as MOT

4. **Loading States**: Same loading indicators and patterns

5. **Accessibility**: Maintained ARIA labels and keyboard navigation

6. **Responsive**: Designed for desktop use (like MOT)

## Migration Path

If you have existing MOT knowledge:

1. **Familiar Patterns**: Same workspace architecture
2. **Removed Features**: Just remove planning-related code
3. **Added Context**: Add bus stop tracking
4. **Simplified Logic**: Less complex assignment modes
5. **Same Services**: Use same API service layer

## Testing Strategy

### Test Both Systems For:

- ✅ Route selection
- ✅ Trip display
- ✅ Multi-select functionality
- ✅ Assignment flow
- ✅ Filtering
- ✅ Error states
- ✅ Loading states

### Test TimeKeeper Specifically For:

- ✅ Bus stop filtering
- ✅ Assignment restrictions
- ✅ Simplified UI flows
- ✅ Auto-distribution algorithm
