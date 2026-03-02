/**
 * TimeStopGraph Service
 * 
 * Contains utility functions, types, and constants for the Time-Stop Graph visualization.
 * This service handles all the data transformation and calculation logic.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Point {
    x: number;
    y: number;
    time: string;
    stopName: string;
    stopIndex: number;
    scheduleIndex: number;
    scheduleName: string;
}

export interface TooltipData {
    visible: boolean;
    x: number;
    y: number;
    stopName: string;
    time: string;
    scheduleName: string;
    color: string;
}

export interface TransformState {
    x: number;
    y: number;
    scale: number;
}

export interface ChartMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartDimensions {
    width: number;
    height: number;
    chartWidth: number;
    chartHeight: number;
    margin: ChartMargins;
}

export interface TimeRange {
    minTime: number;
    maxTime: number;
    timeRange: number;
}

export interface ScheduleStop {
    stopId?: string;
    stopOrder?: number;
    stopName?: string;
    arrivalTime?: string;
    departureTime?: string;
}

export interface ScheduleData {
    name?: string;
    scheduleStops: ScheduleStop[];
}

export interface RouteStopData {
    id?: string;
    stopOrder?: number;
    name: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Color palette for schedule lines in the graph
 */
export const SCHEDULE_COLORS = [
    '#2563eb', // blue-600
    '#dc2626', // red-600
    '#16a34a', // green-600
    '#9333ea', // purple-600
    '#ea580c', // orange-600
    '#0891b2', // cyan-600
    '#c026d3', // fuchsia-600
    '#65a30d', // lime-600
    '#e11d48', // rose-600
    '#0d9488', // teal-600
    '#7c3aed', // violet-600
    '#ca8a04', // yellow-600
];

/**
 * Default chart margins
 */
export const DEFAULT_MARGINS: ChartMargins = {
    top: 60,
    right: 200,
    bottom: 60,
    left: 180,
};

/**
 * Default transform state (no pan, no zoom)
 */
export const DEFAULT_TRANSFORM: TransformState = {
    x: 0,
    y: 0,
    scale: 1,
};

/**
 * Default tooltip state (hidden)
 */
export const DEFAULT_TOOLTIP: TooltipData = {
    visible: false,
    x: 0,
    y: 0,
    stopName: '',
    time: '',
    scheduleName: '',
    color: '',
};

/**
 * Zoom constraints
 */
export const ZOOM_CONSTRAINTS = {
    min: 0.5,
    max: 5,
    step: 1.2,
};

/**
 * Time range padding in minutes
 */
export const TIME_PADDING = 30;

// ============================================================================
// Time Utility Functions
// ============================================================================

/**
 * Convert time string (HH:mm or HH:mm:ss) to minutes from midnight
 */
export function timeToMinutes(time: string | undefined): number | null {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
}

/**
 * Format minutes to HH:mm (handles times beyond 24 hours)
 */
export function minutesToTime(minutes: number): string {
    const totalHours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);
    
    if (days > 0) {
        // Show day indicator for multi-day schedules
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}+${days}d`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Adjust times to handle midnight crossings
 * Returns adjusted time values where times after midnight are shifted to continue the sequence
 */
export function adjustTimesForMidnightCrossing(times: (number | null)[]): number[] {
    const adjusted: number[] = [];
    let dayOffset = 0;
    
    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        if (time === null) continue;
        
        // If current time is significantly less than previous time, we likely crossed midnight
        if (i > 0 && adjusted.length > 0) {
            const prevTime = adjusted[adjusted.length - 1] % 1440; // Get time within current day
            // If time decreased by more than 12 hours, assume midnight crossing
            if (time < prevTime && (prevTime - time) > 720) {
                dayOffset += 1440; // Add 24 hours
            }
        }
        
        adjusted[i] = time + dayOffset;
    }
    
    return adjusted;
}

/**
 * Get display time for a stop (departure for all except last, arrival for last)
 */
export function getDisplayTime(
    stop: { arrivalTime?: string; departureTime?: string }, 
    isLastStop: boolean
): string | undefined {
    if (isLastStop) {
        return stop.arrivalTime || stop.departureTime;
    }
    return stop.departureTime || stop.arrivalTime;
}

// ============================================================================
// Scale Functions
// ============================================================================

/**
 * Create a time (X-axis) scale function
 */
export function createXScale(
    minTime: number,
    timeRange: number,
    chartWidth: number,
    marginLeft: number
): (minutes: number) => number {
    return (minutes: number): number => {
        if (timeRange <= 0) return marginLeft;
        return marginLeft + ((minutes - minTime) / timeRange) * chartWidth;
    };
}

/**
 * Create a stop (Y-axis) scale function
 */
export function createYScale(
    stopCount: number,
    chartHeight: number,
    marginTop: number
): (stopIndex: number) => number {
    return (stopIndex: number): number => {
        if (stopCount <= 1) return marginTop;
        return marginTop + (stopIndex / (stopCount - 1)) * chartHeight;
    };
}

// ============================================================================
// Data Calculation Functions
// ============================================================================

/**
 * Calculate time range from all schedules
 */
export function calculateTimeRange(schedules: ScheduleData[]): TimeRange {
    let min = Infinity;
    let max = -Infinity;

    schedules.forEach((schedule) => {
        // Extract all times for this schedule
        const scheduleTimes = schedule.scheduleStops.map((stop, idx) => {
            const isLast = idx === schedule.scheduleStops.length - 1;
            const time = getDisplayTime(stop, isLast);
            return timeToMinutes(time);
        });

        // Adjust for midnight crossings
        const adjustedTimes = adjustTimesForMidnightCrossing(scheduleTimes);

        // Update min/max with adjusted times
        adjustedTimes.forEach((time) => {
            min = Math.min(min, time);
            max = Math.max(max, time);
        });
    });

    // Add padding to time range
    min = min === Infinity ? 0 : Math.max(0, min - TIME_PADDING);
    max = max === -Infinity ? 24 * 60 : max + TIME_PADDING;

    return { minTime: min, maxTime: max, timeRange: max - min };
}

/**
 * Generate points for each schedule
 */
export function generateSchedulePoints(
    schedules: ScheduleData[],
    routeStops: RouteStopData[],
    xScale: (minutes: number) => number,
    yScale: (stopIndex: number) => number
): Point[][] {
    return schedules.map((schedule, scheduleIndex) => {
        const points: Point[] = [];
        
        // Extract all times first
        const scheduleTimes = schedule.scheduleStops.map((stop, idx) => {
            const isLast = idx === schedule.scheduleStops.length - 1;
            const time = getDisplayTime(stop, isLast);
            return timeToMinutes(time);
        });

        // Adjust for midnight crossings
        const adjustedTimes = adjustTimesForMidnightCrossing(scheduleTimes);

        // Create points with adjusted times, matching stops by stopId
        schedule.scheduleStops.forEach((scheduleStop, arrayIndex) => {
            const adjustedMinutes = adjustedTimes[arrayIndex];
            if (adjustedMinutes !== undefined) {
                const isLast = arrayIndex === schedule.scheduleStops.length - 1;
                const originalTime = getDisplayTime(scheduleStop, isLast);
                
                // Find the matching route stop by stopId (primary) or stopOrder (fallback)
                const routeStopIndex = routeStops.findIndex(
                    rs => rs.id === scheduleStop.stopId || rs.stopOrder === scheduleStop.stopOrder
                );
                
                // Skip if stop not found in route
                if (routeStopIndex === -1) {
                    console.warn(`Schedule stop ${scheduleStop.stopName} (ID: ${scheduleStop.stopId}) not found in route stops`);
                    return;
                }

                const matchingRouteStop = routeStops[routeStopIndex];
                const stopName = scheduleStop.stopName || matchingRouteStop?.name || `Stop ${routeStopIndex + 1}`;
                
                points.push({
                    x: xScale(adjustedMinutes),
                    y: yScale(routeStopIndex), // Use routeStops array index for Y position
                    time: originalTime || '',
                    stopName: stopName,
                    stopIndex: routeStopIndex, // Use route stop array index
                    scheduleIndex,
                    scheduleName: schedule.name || `Schedule ${scheduleIndex + 1}`,
                });
            }
        });
        
        return points;
    });
}

/**
 * Generate time axis ticks (every 30 minutes)
 */
export function generateTimeAxisTicks(minTime: number, maxTime: number): number[] {
    const ticks: number[] = [];
    // Round to nearest 30 minutes
    const start = Math.ceil(minTime / 30) * 30;
    const end = Math.floor(maxTime / 30) * 30;
    for (let t = start; t <= end; t += 30) {
        ticks.push(t);
    }
    return ticks;
}

/**
 * Get color for a schedule by index
 */
export function getScheduleColor(scheduleIndex: number): string {
    return SCHEDULE_COLORS[scheduleIndex % SCHEDULE_COLORS.length];
}

/**
 * Build SVG path string from points
 */
export function buildPathFromPoints(points: Point[]): string {
    return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
}

/**
 * Calculate chart dimensions from container size
 */
export function calculateChartDimensions(
    containerWidth: number,
    containerHeight: number,
    margin: ChartMargins = DEFAULT_MARGINS
): ChartDimensions {
    return {
        width: containerWidth,
        height: containerHeight,
        chartWidth: containerWidth - margin.left - margin.right,
        chartHeight: containerHeight - margin.top - margin.bottom,
        margin,
    };
}

/**
 * Get start time from schedule (first stop departure time)
 */
export function getScheduleStartTime(schedule: ScheduleData): string {
    const firstStop = schedule.scheduleStops[0];
    return firstStop?.departureTime || '--:--';
}

/**
 * Truncate stop name for display
 */
export function truncateStopName(name: string, maxLength: number = 20): string {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
}

/**
 * Get stop type indicator color
 */
export function getStopIndicatorColor(
    index: number, 
    totalStops: number
): string {
    if (index === 0) return '#16a34a'; // green-600 for first
    if (index === totalStops - 1) return '#dc2626'; // red-600 for last
    return '#9ca3af'; // gray-400 for intermediate
}
