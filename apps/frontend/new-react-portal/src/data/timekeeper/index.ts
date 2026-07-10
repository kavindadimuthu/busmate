// Time Keeper mock data index
// Export all types and mock data functions for the Time Keeper portal

// Types
export * from './types';

// Dashboard data
export {
  dashboardStats,
  quickStats,
  upcomingDepartures,
  recentTrips,
  getDashboardStats,
  getQuickStats,
  getUpcomingDepartures,
  getRecentTrips,
} from './dashboard';

// Attendance data
export {
  getStaffAttendanceStats,
  getBusAttendanceStats,
  getStaffAttendance,
  getBusAttendance,
  markStaffAttendance,
  recordBusArrival,
  recordBusDeparture,
  getStaffAttendanceById,
  getBusAttendanceById,
} from './attendance';

// Trips data
export {
  assignedStop,
  availableRoutes,
  getTripStats,
  getTrips,
  getTripById,
  getUpcomingTrips,
  getActiveTrips,
  updateTripStatus,
  recordTripDeparture,
  getAssignedStop,
} from './trips';
