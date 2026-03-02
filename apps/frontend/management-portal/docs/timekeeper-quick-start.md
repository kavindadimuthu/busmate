# TimeKeeper Trip Assignment - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Navigate to the Page

```
http://localhost:3000/timeKeeper/trip-assignment
```

### Step 2: Component Structure (For Developers)

```typescript
// The component is already integrated in:
src / app / timeKeeper / authenticated / trip - assignment / page.tsx;

// Main component location:
src / components / timeKeeper / trip - assignment - workspace / index.tsx;
```

### Step 3: Test the Features

#### ✅ Route Selection

1. Look at the left sidebar
2. Click on a route group to expand
3. Click on a specific route
4. Trips load automatically

#### ✅ View Trips

1. See trip cards in the center panel
2. Each shows: Trip ID, Date, Times, Status, Assignment
3. Look for the assigned bus stop badge on each card

#### ✅ Select Trips

1. Click a trip card → Selected (blue border)
2. Hold Ctrl/Cmd and click more trips → Multi-select
3. Click "Clear Selection" to deselect all

#### ✅ Assign Buses

1. Select one or more trips (center panel)
2. In left panel, click on available buses
3. Optionally add notes
4. Click "Assign X Buses to Y Trips"
5. Buses auto-distribute across trips

#### ✅ Filter Trips

1. Use "All Status" dropdown → Filter by status
2. Use "All Trips" dropdown → Filter assigned/unassigned
3. Toggle between "All" and "Daily" view

## 🎯 Key Differences from MOT

### What's REMOVED

- ❌ Planning Panel (no schedule selection)
- ❌ Trip generation button
- ❌ Weekly view mode
- ❌ Manual assignment mode

### What's ADDED

- ✅ Assigned bus stop badge (header)
- ✅ Bus stop name in sidebar
- ✅ "Starts from" badge on trip cards
- ✅ Simplified auto-assignment only
- ✅ Indigo color scheme (vs blue)

## 🔧 For Backend Developers

### Required Endpoints

#### 1. Get TimeKeeper's Assigned Bus Stop

```typescript
GET / api / timekeeper / profile;
Response: {
  id: string;
  name: string;
  assignedBusStop: {
    id: string;
    name: string;
  }
}
```

**Update this in**: `TimeKeeperTripAssignmentWorkspace.tsx` line 97

```typescript
const loadAssignedBusStop = async () => {
  // Replace mock data with:
  const response = await TimekeeperService.getAssignedBusStop();
  setWorkspace((prev) => ({
    ...prev,
    assignedBusStopId: response.id,
    assignedBusStopName: response.name,
  }));
};
```

#### 2. Filter Trips by Bus Stop

```typescript
GET /api/trips/by-route/{routeId}?busStopId={busStopId}
// Or add startingStopId to TripResponse
```

**Update this in**: `TimeKeeperTripAssignmentWorkspace.tsx` line 133

```typescript
const loadTrips = async (routeId: string) => {
  const response = await TripManagementService.getTripsByRoute(routeId);

  // Replace with:
  const filteredTrips = response.filter(
    (trip) => trip.startingStopId === workspace.assignedBusStopId
  );

  setWorkspace((prev) => ({ ...prev, trips: filteredTrips }));
};
```

#### 3. Validate Assignments (Backend Side)

```typescript
POST /api/trips/bulk-assign
Body: { assignments: PspTripAssignment[] }

// Server validation:
for (const assignment of assignments) {
  const trip = await getTripById(assignment.tripId);
  if (trip.startingStopId !== timekeeper.assignedBusStopId) {
    throw new ForbiddenError("Can only assign trips from your bus stop");
  }
}
```

## 📁 File Structure Reference

```
trip-assignment-workspace/
├── index.tsx                                  # Entry point
├── TimeKeeperTripAssignmentWorkspace.tsx     # Main orchestrator (240 lines)
└── components/
    ├── TimeKeeperWorkspaceHeader.tsx         # Header (135 lines)
    ├── TimeKeeperWorkspaceSidebar.tsx        # Sidebar (265 lines)
    ├── TimeKeeperAssignmentPanel.tsx         # Left panel (280 lines)
    └── TimeKeeperTripsWorkspace.tsx          # Center panel (440 lines)
```

## 🎨 Styling Quick Reference

### Colors

- Primary: `indigo-50`, `indigo-600`, `indigo-900`
- Success: `green-100`, `green-800`
- Warning: `orange-100`, `orange-800`
- Error: `red-100`, `red-800`

### Key Classes

```css
/* Selected trip */
.border-indigo-500 .bg-indigo-50

/* Assigned badge */
.bg-indigo-50 .text-indigo-900 .border-indigo-200

/* Button */
.bg-indigo-600 .hover:bg-indigo-700
```

## 🐛 Common Issues & Solutions

### Issue 1: Trips Not Loading

**Solution**: Check if route is selected in sidebar

### Issue 2: Assignment Button Disabled

**Solution**: Need to select both trips AND buses

### Issue 3: No Trips Showing

**Possible Causes**:

- No route selected
- All trips filtered out
- No trips from assigned bus stop (expected)

### Issue 4: Import Errors

**Solution**: Restart TypeScript server

```
VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 🧪 Quick Testing Checklist

```
[ ] Page loads without errors
[ ] Sidebar shows route groups
[ ] Can select a route
[ ] Trips display in center panel
[ ] Can click to select a trip
[ ] Can Ctrl+Click to multi-select
[ ] Left panel shows buses
[ ] Can select buses
[ ] Assignment button enables/disables correctly
[ ] Assign button works (makes API call)
[ ] Filters work (status, assignment)
[ ] View toggle works (All/Daily)
[ ] Date navigation works (in Daily view)
[ ] Clear selection works
[ ] Loading states show
[ ] Error states display
```

## 💡 Pro Tips

### Tip 1: Multi-Select Like a Pro

- **Ctrl/Cmd + Click**: Add/remove individual trips
- **Shift + Click**: Select range (coming soon)
- **Clear Selection**: Deselect all at once

### Tip 2: Quick Filtering

- Filter by "Unassigned" → See what needs attention
- Daily view → Focus on today's trips
- Status filter → Find delayed/cancelled trips

### Tip 3: Efficient Assignment

- Select all unassigned trips
- Select multiple buses
- Click assign → Auto-distributes

### Tip 4: Capacity Monitoring

- Green bar: Plenty of capacity
- Yellow bar: Getting full (70-90%)
- Red bar: Near capacity (>90%)

## 📚 Documentation Links

- **Full Implementation Guide**: `timekeeper-trip-assignment-workspace-implementation.md`
- **MOT Comparison**: `timekeeper-vs-mot-comparison.md`
- **This Quick Start**: `timekeeper-quick-start.md`

## 🆘 Need Help?

1. **Check Console**: Press F12 → Console tab
2. **Review MOT**: Compare with `/mot/trip-assignment`
3. **Read Docs**: Check the markdown files in `docs/`
4. **Check Backend**: Verify API endpoints are working

## ⚡ Performance Tips

- Trips load automatically when route is selected
- Use filters to reduce visible trips
- Multi-select is optimized for large lists
- Date range queries only fetch needed data

## 🎬 Demo Workflow

```
1. Open page → See sidebar with routes
2. Click "Route Group 1" → Expands
3. Click "Route A" → Trips load
4. See header: "Assigned Stop: Main Terminal"
5. Click a trip card → Selects (blue border)
6. Ctrl+Click another → Multi-select
7. Left panel: Click a bus → Selects
8. Click "Assign 1 Bus to 2 Trips" → Done!
9. Trips now show assigned bus info
```

---

**Ready to use!** 🎉

If you encounter issues, check the full documentation or compare with the MOT implementation.
