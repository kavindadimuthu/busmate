// Interface for the conductor profile
export interface EmployeeProfile {
  employee_id: string;
  fullName: string;
  username: string;
  phoneNumber: string;
  assign_operator_id: string;
  nicNumber?: string;
  dateofBirth?: string;
  gender?: string;
  shiftStatus?: string;
  address?: string;
}

// Interface for the conductor profile update request
export interface UpdateProfileRequest{

    fullName?: string;
    phoneNumber?: string;
    
    
}
// Interface for the conductor profile update response
export interface UpdateProfileResponse {
  userId?: string;          // Note: your response shows "userld" - might be a typo in backend
  userld?: string;          // Add this in case backend has typo
  fullName: string;
  username: string;
  email: string;
  role: string;
  accountStatus: string | null;
  isVerified: boolean;
  phoneNumber: string;
  employee_id: string;
  assign_operator_id: string;
  shift_status: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  password: string | null;
  nicNumber: string | null;
}
// Interface for the conductor profile update error response
export interface ProfileUpdateError {
    field: string;
    message: string;
}




// Interface for API response when fetching conductor schedules
export interface ConductorTripApiResponse {
  id: string;
  assignmentId: string;
  scheduleId: string;
  routeId: string;
  permitId: string;
  operatorId: string;
  routeGroupId: string;
  permitNumber: string;
  scheduleName: string;
  routeName: string;
  operatorName: string;
  routeGroupName: string;
  tripDate: string; // YYYY-MM-DD format
  scheduledDepartureTime: string; // HH:MM:SS format
  actualDepartureTime: string | null;
  scheduledArrivalTime: string; // HH:MM:SS format
  actualArrivalTime: string | null;
  busId: string;
  busPlateNumber: string;
  busModel: string;
  driverId: string | null;
  conductorId: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Interface for the conductor schedule (transformed from API response)
export interface EmployeeSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  route: string;
  busId: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled' | 'upcoming';
  passengers?: number;
  revenue?: number;
  // Additional properties from API response
  fromLocation?: string;
  toLocation?: string;
  busPlateNumber?: string;
  routeName?: string;
  scheduleName?: string;
  routeGroupId?: string;
  routeGroupName?: string;
  scheduleId?: string;
  RouteId?: string;

}

export interface ShiftStatus {
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  currentLocation?: string;
  totalPassengers?: number;
  totalRevenue?: number;
}