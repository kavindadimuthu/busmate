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