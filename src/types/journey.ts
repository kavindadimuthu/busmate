export interface JourneySchedule {
  id: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  busId: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  conductorId: string;
  passengerCount?: number;
  revenue?: number;
}

// Trip data from trips API
export interface Trip {
  id: string;
  passengerServicePermitId: string;
  passengerServicePermitNumber: string;
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
  tripDate: string;
  scheduledDepartureTime: string;
  actualDepartureTime: string | null;
  scheduledArrivalTime: string;
  actualArrivalTime: string | null;
  busId: string;
  busPlateNumber: string;
  busModel: string;
  driverId: string;
  conductorId: string;
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetails {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime?: string;
  route: string;
  stops: Stop[];
  currentStop?: string;
  nextStop?: string;
}

export interface Stop {
  id: string;
  name: string;
  arrivalTime: string;
  departureTime: string;
  status: 'pending' | 'arrived' | 'departed';
}

// Route stop structure from API
export interface RouteStop {
  routeStopId: string;
  stopId: string;
  stopName: string;
  stopDescription?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isAccessible?: boolean;
  stopOrder: number;
  distanceFromStartKm: number;
}

// Schedule stop structure from API - includes timing information
export interface ScheduleStop {
  scheduleStopId: string;
  routeStopId: string;
  stopId: string;
  stopName: string;
  stopDescription?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isAccessible?: boolean;
  stopOrder: number;
  distanceFromStartKm: number;
  arrivalTime: string; // Expected arrival time from schedule (HH:MM:SS format)
  departureTime: string; // Expected departure time from schedule (HH:MM:SS format)
}

// Enhanced stop for UI with timing data and Google Maps support
export interface EnhancedStop {
  stopId: string;
  stopName: string;
  stopOrder: number;
  distanceFromStart: number; // Normalized from RouteStop.distanceFromStartKm
  latitude?: number; // For Google Maps integration
  longitude?: number; // For Google Maps integration
  arrivalTime: string;
  departureTime: string;
  actualArrivalTime?: string;
  actualDepartureTime?: string;
  status: 'pending' | 'arrived' | 'departed';
  hasScheduledTime?: boolean; // Flag to indicate if this stop has scheduled times
}
