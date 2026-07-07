export type StopStatus = 'ontime' | 'late' | 'current' | 'upcoming' | 'completed';

export type Stop = {
  id: number;
  number: number;
  name: string;
  expected: string;
  actual?: string;
  status?: StopStatus;
  completed: boolean;
  isFinal?: boolean;
  arrivalTime?: string;
  departureTime?: string;
  delayMinutes?: number;
  // Removed passengerCount property
};

export type RouteInfo = {
  number: string;
  name: string;
  startTime: string;
  endTime?: string;
  distance?: string;
};

export type NextStopInfo = {
  name: string;
  eta: string;
  distance?: string;
  estimatedMinutes?: number;
};

export type JourneySummary = {
  completedStops: string;
  onTime: string;
  etaFinal: string;
  totalDistance?: string;
  averageSpeed?: string;
  delayTotal?: string;
};

export type JourneyData = {
  id: string;
  route: RouteInfo;
  nextStop: NextStopInfo;
  stops: Stop[];
  summary: JourneySummary;
  status: 'scheduled' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  currentLocation?: {
    lat: number;
    lng: number;
  };
};

export type StopAction = 'mark_arrived' | 'mark_departed' | 'update_delay' | 'add_note';

export type StopActionResult = {
  success: boolean;
  message: string;
  updatedStop?: Stop;
  updatedJourney?: JourneyData;
};