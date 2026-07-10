// Types for Time Keeper portal data

// === Dashboard Types ===
export interface DashboardStats {
  totalTripsToday: number;
  completedTrips: number;
  activeTrips: number;
  pendingTrips: number;
  delayedTrips: number;
  cancelledTrips: number;
  onTimePercentage: number;
  busesAtStop: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

// === Attendance Types ===
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave';
export type StaffRole = 'driver' | 'conductor';

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  busId?: string;
  busNumber?: string;
  tripId?: string;
  notes?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface BusAttendance {
  id: string;
  busId: string;
  busNumber: string;
  plateNumber: string;
  date: string;
  scheduledArrivalTime: string;
  actualArrivalTime?: string;
  scheduledDepartureTime: string;
  actualDepartureTime?: string;
  status: 'arrived' | 'departed' | 'delayed' | 'missed' | 'expected';
  driverId?: string;
  driverName?: string;
  conductorId?: string;
  conductorName?: string;
  tripId?: string;
  routeName?: string;
  notes?: string;
}

export interface AttendanceStats {
  totalStaff: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  onLeaveCount: number;
  attendanceRate: number;
}

export interface BusAttendanceStats {
  totalBusesToday: number;
  arrivedOnTime: number;
  delayed: number;
  missed: number;
  expectedToday: number;
  onTimeRate: number;
}

// === Trip Types ===
export type TripStatus = 
  | 'scheduled' 
  | 'boarding' 
  | 'departed' 
  | 'in_transit' 
  | 'arrived' 
  | 'completed' 
  | 'delayed' 
  | 'cancelled';

export interface Trip {
  id: string;
  tripNumber: string;
  routeId: string;
  routeName: string;
  routeNumber?: string;
  busId: string;
  busNumber: string;
  driverId?: string;
  driverName?: string;
  conductorId?: string;
  conductorName?: string;
  date: string;
  scheduledDepartureTime: string;
  actualDepartureTime?: string;
  scheduledArrivalTime: string;
  actualArrivalTime?: string;
  status: TripStatus;
  passengerCount?: number;
  departureStopId: string;
  departureStopName: string;
  arrivalStopId: string;
  arrivalStopName: string;
  notes?: string;
  delayReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripSchedule {
  id: string;
  tripId: string;
  routeName: string;
  busNumber: string;
  scheduledTime: string;
  estimatedTime: string;
  status: TripStatus;
  platform?: string;
}

export interface TripStats {
  totalTrips: number;
  scheduledTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  delayedTrips: number;
  cancelledTrips: number;
}

// === Assigned Stop Types ===
export interface AssignedStop {
  id: string;
  name: string;
  code: string;
  type: 'terminal' | 'intermediate' | 'depot';
  address?: string;
  latitude?: number;
  longitude?: number;
  facilities?: string[];
  routes?: string[];
  capacity?: number;
}

// === Filter Types ===
export interface AttendanceFilters {
  date?: string;
  status?: AttendanceStatus | 'all';
  role?: StaffRole | 'all';
  searchTerm?: string;
}

export interface TripFilters {
  date?: string;
  status?: TripStatus | 'all';
  routeId?: string | 'all';
  searchTerm?: string;
}

export interface BusAttendanceFilters {
  date?: string;
  status?: BusAttendance['status'] | 'all';
  searchTerm?: string;
}

// === API Response Types (for future API integration) ===
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
