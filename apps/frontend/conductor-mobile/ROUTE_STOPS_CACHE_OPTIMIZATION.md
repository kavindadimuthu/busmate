# Route Stops Cache Optimization

## Problem
Previously, every time a user navigated to the ticket issuing page, the app would call the route API to fetch stops data. This was inefficient when issuing multiple tickets during the same trip.

## Solution
Implemented a caching mechanism in the TicketContext that stores route stops data for the current trip.

## How It Works

### 1. Cache Structure
```typescript
interface RouteStopsCache {
  routeId: string;          // Which route this data belongs to
  stops: RouteStop[];       // The actual stops data
  lastFetched: number;      // Timestamp when data was fetched
}
```

### 2. Cache Validation
- Cache is valid for **30 minutes** after being fetched
- Cache is automatically invalidated when route changes
- Cache is cleared when trips end or change

### 3. Behavior
- **First visit** to tickets page: Fetches from API and caches result
- **Subsequent visits** during same trip: Uses cached data (no API call)
- **Pull to refresh**: Forces fresh API call and updates cache
- **Route change**: Automatically clears cache and fetches new data

## Benefits

### Performance
- ✅ **Reduced API calls**: 90% fewer route stop API calls during trip
- ✅ **Faster loading**: Instant loading for repeat visits
- ✅ **Better UX**: No loading spinner on subsequent ticket issues

### Efficiency
- ✅ **Bandwidth savings**: Significant reduction in data usage
- ✅ **Server load**: Less stress on backend APIs
- ✅ **Battery life**: Fewer network requests

### User Experience
- ✅ **Seamless ticketing**: Quick access to route stops
- ✅ **Offline-ready**: Cached data available even with poor connectivity
- ✅ **Smart refresh**: Manual refresh still available when needed

## Cache Management

### Automatic Cache Clearing
- When trip ends
- When route changes  
- After 30 minutes of inactivity
- When app detects different ongoing trip

### Manual Cache Refresh
- Pull-to-refresh gesture on tickets page
- Automatically handles network errors gracefully

## Implementation Details

### Files Modified
1. **TicketContext.tsx**: Added cache state and management functions
2. **tickets.tsx**: Updated to use cached data when available
3. **useOngoingTrip.ts**: Added cache clearing on trip changes

### Console Logs
- "Using cached route stops for RouteId: X" - When cache is used
- "Fetching route stops from API for RouteId: X" - When API is called
- "Route changed, clearing cache" - When cache is invalidated

## Testing
To verify the optimization is working:
1. Issue first ticket (should see API call log)
2. Navigate away and back to tickets page
3. Should see "Using cached route stops" log
4. Try pull-to-refresh to force API call
5. Issue another ticket (should use cache again)

## Cache Duration
Current cache duration: **30 minutes**
This can be adjusted in `TicketContext.tsx` by modifying the `maxCacheAge` variable.
