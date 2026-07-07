/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TripStatisticsResponse = {
    totalTrips?: number;
    scheduledTrips?: number;
    completedTrips?: number;
    cancelledTrips?: number;
    pendingTrips?: number;
    activeTrips?: number;
    delayedTrips?: number;
    inTransitTrips?: number;
    boardingTrips?: number;
    departedTrips?: number;
    tripsByStatus?: Record<string, number>;
    tripsThisWeek?: Record<string, number>;
    tripsThisMonth?: Record<string, number>;
    todayTrips?: number;
    tomorrowTrips?: number;
    weeklyTrips?: number;
    monthlyTrips?: number;
    completionRate?: number;
    onTimePerformanceRate?: number;
    cancellationRate?: number;
    averageTripsPerDay?: number;
    tripsByRoute?: Record<string, number>;
    tripsByOperator?: Record<string, number>;
    tripsBySchedule?: Record<string, number>;
    tripsWithPsp?: Record<string, number>;
    tripsWithBus?: Record<string, number>;
    peakTripRoute?: string;
    peakTripOperator?: string;
    peakTripDate?: string;
    leastActiveRoute?: string;
    tripsWithAssignedPsp?: number;
    tripsWithoutPsp?: number;
    tripsWithAssignedBus?: number;
    tripsWithoutBus?: number;
    tripsWithDriver?: number;
    tripsWithConductor?: number;
    tripsByTimeOfDay?: Record<string, number>;
    tripsByDayOfWeek?: Record<string, number>;
    averageTripDuration?: number;
    recentlyCreatedTrips?: number;
    recentlyCompletedTrips?: number;
    recentlyCancelledTrips?: number;
};

