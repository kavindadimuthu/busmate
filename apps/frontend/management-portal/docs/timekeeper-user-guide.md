# TimeKeeper Trip Management - User Guide

## Getting Started

As a TimeKeeper, you are responsible for monitoring trips that pass through your assigned bus stop. This guide will help you understand how to use the Trip Management system effectively.

## Accessing Trip Management

1. Log in to your TimeKeeper account
2. Click on **"Trip"** in the left sidebar
3. You'll see the Trip Management page

## Understanding Your Dashboard

### Info Banner

At the top, you'll see a blue banner showing your **Assigned Bus Stop** (e.g., "Main Terminal"). All trips displayed are related to this location.

### Statistics Cards

Four cards show key metrics:

- **Total Trips**: All trips passing through your stop
- **Active**: Trips currently in progress
- **Completed**: Successfully finished trips
- **Cancelled**: Trips that were cancelled

## Viewing Trips

### Trip Table Columns

| Column        | Description                           |
| ------------- | ------------------------------------- |
| **Date**      | When the trip is scheduled            |
| **Route**     | Route name and group                  |
| **Operator**  | Bus operator company                  |
| **Departure** | Scheduled (and actual) departure time |
| **Arrival**   | Scheduled (and actual) arrival time   |
| **Bus / PSP** | Assigned bus plate number and permit  |
| **Status**    | Current trip status (color-coded)     |
| **Notes**     | Any observations or comments          |
| **Actions**   | Available actions for this trip       |

### Status Colors

- 🟢 **Green** = Active or Completed
- 🟡 **Yellow** = Pending
- 🔵 **Blue** = In Transit or Boarding
- 🟣 **Purple** = Boarding
- 🟠 **Orange** = Delayed
- 🔴 **Red** = Cancelled
- ⚫ **Gray** = Unknown/Other

## Filtering Trips

### Quick Search

Type in the search bar to find trips by:

- Route name
- Operator name
- Bus plate number
- PSP number
- Notes content

### Advanced Filters

Click the **"Filters"** button to expand filtering options:

1. **Status Filter**: Show only trips with specific status

   - All, Pending, Active, Completed, Cancelled, etc.

2. **Route Filter**: Filter by specific routes through your stop

3. **Operator Filter**: Show trips from specific operators

4. **Schedule Filter**: Filter by schedule

5. **Bus Filter**: Show trips with specific buses

6. **PSP Filter**: Filter by passenger service permit

7. **Date Range**:

   - **From Date**: Start date
   - **To Date**: End date

8. **Assignment Filters**:
   - ☑️ Has PSP: Only show trips with assigned permits
   - ☑️ Has Bus: Only show trips with assigned buses
   - ☑️ Has Driver: Only show trips with assigned drivers
   - ☑️ Has Conductor: Only show trips with assigned conductors

### Clear Filters

Click **"Clear All"** to reset all filters to default.

## Sorting Trips

Click on column headers to sort:

- **Date**: Sort by trip date
- **Departure**: Sort by departure time
- **Arrival**: Sort by arrival time
- **Status**: Sort by trip status

Click again to reverse sort order (ascending ↔ descending).

## Trip Actions

### 1. View Trip Details (Eye Icon 👁️)

- Click the eye icon to see complete trip information
- View route details, stops, timings, assignments
- **Read-only** - you cannot edit trip details

### 2. Add Notes (Document Icon 📝)

- Click the document icon to add observations
- Useful for recording:
  - Passenger counts
  - Delays and reasons
  - Bus condition issues
  - Weather conditions
  - Any unusual events

**Example Notes:**

- "Bus arrived 15 minutes late due to traffic"
- "Approximately 45 passengers boarded"
- "Driver reported mechanical issue with AC"

### 3. Remove/Reassign Bus (Swap Icon 🔄)

⚠️ **Important**: This action is only available for trips that **start** at your assigned bus stop.

**When you'll see this button:**

- Trip starts at your location ✅
- Trip has a bus assigned ✅
- Trip is not completed or cancelled ✅

**When you won't see this button:**

- Trip only passes through your stop (doesn't start there) ❌
- Trip doesn't have a bus assigned ❌
- Trip is already completed ❌

## Managing Bus Assignments

### How to Remove or Reassign a Bus

1. **Find an eligible trip** (one that starts at your stop with a bus assigned)
2. **Click the swap icon** (🔄) in the Actions column
3. **Choose an action**:

#### Option A: Reassign to Another Bus

- Select "Reassign to another bus"
- Choose a new bus from the dropdown
- Cannot select the same bus currently assigned
- Useful when: Replacing a broken-down bus, optimizing routes

#### Option B: Remove Bus Assignment

- Select "Remove bus assignment"
- Leaves the trip without a bus
- ⚠️ Make sure another bus is assigned before departure time
- Useful when: Bus is unavailable, trip is cancelled

4. **Provide a reason** (required)

   - Be specific and detailed
   - This is logged for audit purposes
   - Examples:
     - "Bus ABC-1234 has mechanical failure"
     - "Replacing with larger bus due to high demand"
     - "Original bus reassigned to priority route"

5. **Review the warning message**

   - Understand the implications of your action
   - Ensure you have authorization

6. **Click "Reassign Bus" or "Remove Bus"**
   - Wait for confirmation
   - Trip will refresh with updated information

### Best Practices for Bus Management

✅ **DO:**

- Always provide clear, detailed reasons
- Verify the new bus is available
- Check bus capacity matches route requirements
- Coordinate with operators when possible
- Remove buses well before departure time

❌ **DON'T:**

- Remove buses without a plan to replace them
- Make changes after the trip has started
- Reassign buses that are already on active trips
- Provide vague reasons like "other" or "n/a"

## Pagination

At the bottom of the table:

- **Current Page**: Shows which page you're viewing
- **Total Results**: Total number of trips matching filters
- **Page Size**: Choose how many trips per page (10, 25, 50, 100)
- **Navigation**: Use arrows to move between pages

## Common Scenarios

### Scenario 1: Morning Shift Check

**Goal**: See all trips departing this morning

1. Set **From Date** to today
2. Set **To Date** to today
3. Filter **Status** to "Pending" or "Active"
4. Sort by **Departure** time

### Scenario 2: Track a Specific Bus

**Goal**: Monitor all trips for bus ABC-1234

1. Select **Bus Filter** → ABC-1234
2. View all trips assigned to that bus
3. Add notes as it completes each trip

### Scenario 3: Replace a Broken Bus

**Goal**: Bus XYZ-5678 broke down, need to reassign

1. Search for "XYZ-5678" in search bar
2. Find trips that **start** at your stop
3. Click swap icon (🔄) on each eligible trip
4. Choose "Reassign to another bus"
5. Select available replacement bus
6. Reason: "Bus XYZ-5678 mechanical failure - engine overheating"
7. Confirm reassignment

### Scenario 4: End of Day Report

**Goal**: Review all completed trips

1. Set **Date Range** to today
2. Filter **Status** to "Completed"
3. Export or note any issues
4. Add notes for unusual events

### Scenario 5: Delayed Bus

**Goal**: Record a delay

1. Find the trip in the table
2. Click **Add Notes** icon (📝)
3. Add note: "Bus delayed 20 minutes - heavy rain and traffic on highway"
4. Save note

## Tips & Tricks

### Keyboard Shortcuts (Future Enhancement)

Currently, use mouse for all actions. Keyboard shortcuts planned for future updates.

### Refresh Data

- The page doesn't auto-refresh
- Click browser refresh to see latest changes
- Future: Real-time updates will be added

### Mobile Use

- Page is responsive but best viewed on desktop/tablet
- Mobile-optimized app coming soon

### Working Offline

- Currently requires internet connection
- Offline mode planned for future

## Troubleshooting

### "No trips found"

**Causes:**

- No trips scheduled for selected date range
- All trips filtered out by current filters
- Network connection issue

**Solutions:**

- Clear all filters
- Expand date range
- Check internet connection
- Refresh the page

### Can't see bus reassignment button

**Causes:**

- Trip doesn't start at your assigned stop
- Trip already completed or cancelled
- No bus currently assigned to trip

**Solution:**

- This is normal behavior
- You can only manage buses for trips starting at your location

### Modal won't open

**Solution:**

- Refresh the page
- Clear browser cache
- Try different browser

### Changes not saving

**Causes:**

- Network issue
- Missing required fields
- Backend error

**Solutions:**

- Check reason field is filled
- Verify internet connection
- Contact support if persists

## Frequently Asked Questions

### Q: Can I edit trip schedules?

**A:** No, only MOT administrators can edit schedules. You have read-only access to view schedules.

### Q: Can I cancel a trip?

**A:** No, only MOT administrators can cancel trips.

### Q: Can I create new trips?

**A:** No, only MOT administrators can create trips.

### Q: Can I assign Passenger Service Permits (PSPs)?

**A:** No, only MOT administrators can assign PSPs.

### Q: Why can't I reassign buses for all trips?

**A:** You can only reassign buses for trips that **start** at your assigned bus stop. Trips that only pass through your stop are managed by their starting location's timekeeper.

### Q: What if I reassign a bus by mistake?

**A:** Contact your supervisor or MOT administrator immediately. They can reverse the change and correct the assignment.

### Q: Can I see trips from other bus stops?

**A:** No, you only see trips passing through your assigned bus stop.

### Q: How often should I check the system?

**A:** Check at the start of your shift, during breaks, and when buses arrive/depart. Add notes as needed throughout the day.

### Q: What should I include in notes?

**A:** Include:

- Passenger counts
- Delays and causes
- Bus condition issues
- Weather impacts
- Safety incidents
- Anything unusual or noteworthy

## Getting Help

### Technical Support

- **Email**: support@busmate.lk
- **Phone**: +94 XX XXX XXXX
- **Hours**: 24/7 for emergencies

### Training

- Request refresher training from your supervisor
- User manual available in system
- Video tutorials coming soon

### Report Issues

- Use the feedback form in the app
- Describe what you were doing when the issue occurred
- Include screenshots if possible

## Best Practices Summary

1. ✅ Check the system regularly throughout your shift
2. ✅ Add notes for significant events
3. ✅ Provide detailed reasons for bus reassignments
4. ✅ Verify new bus availability before reassigning
5. ✅ Keep your assigned stop information updated
6. ✅ Report technical issues promptly
7. ✅ Use filters to focus on relevant trips
8. ✅ Document passenger counts when possible
9. ✅ Note delays and their causes
10. ✅ Coordinate with operators and drivers

---

**Need help?** Contact your supervisor or the support team.

**System Version:** 2.0  
**Last Updated:** October 18, 2025  
**User Type:** TimeKeeper
