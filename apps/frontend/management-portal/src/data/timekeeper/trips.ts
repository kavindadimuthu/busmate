// Trips mock data for Time Keeper portal

import { 
  Trip, 
  TripStats, 
  TripFilters, 
  PaginatedResponse,
  AssignedStop 
} from './types';

// Assigned bus stop for the time keeper
export const assignedStop: AssignedStop = {
  id: 'stop-001',
  name: 'Colombo Fort Bus Stand',
  code: 'CFBS',
  type: 'terminal',
  address: 'Olcott Mawatha, Colombo 11',
  latitude: 6.9345,
  longitude: 79.8478,
  facilities: ['Waiting Area', 'Restrooms', 'Ticket Counter', 'Information Desk'],
  routes: ['138', '2', '240', '32', '6', '57', '15', '48'],
  capacity: 50,
};

// Sample trips data
const tripsData: Trip[] = [
  {
    id: 'trip-001',
    tripNumber: 'T-2026-001',
    routeId: 'route-001',
    routeName: 'Colombo - Kandy',
    routeNumber: '138',
    busId: 'bus-001',
    busNumber: 'NA-1234',
    driverId: 'STF-001',
    driverName: 'Kamal Perera',
    conductorId: 'STF-002',
    conductorName: 'Nimal Jayawardena',
    date: '2026-02-21',
    scheduledDepartureTime: '08:30',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '12:30',
    actualArrivalTime: undefined,
    status: 'boarding',
    passengerCount: 32,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-020',
    arrivalStopName: 'Kandy Central Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T08:15:00Z',
  },
  {
    id: 'trip-002',
    tripNumber: 'T-2026-002',
    routeId: 'route-002',
    routeName: 'Colombo - Galle',
    routeNumber: '2',
    busId: 'bus-002',
    busNumber: 'WP-5678',
    driverId: 'STF-003',
    driverName: 'Sunil Fernando',
    conductorId: 'STF-004',
    conductorName: 'Ranjith Silva',
    date: '2026-02-21',
    scheduledDepartureTime: '08:45',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '11:30',
    actualArrivalTime: undefined,
    status: 'scheduled',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-030',
    arrivalStopName: 'Galle Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'trip-003',
    tripNumber: 'T-2026-003',
    routeId: 'route-003',
    routeName: 'Colombo - Negombo',
    routeNumber: '240',
    busId: 'bus-003',
    busNumber: 'NW-9012',
    driverId: 'STF-006',
    driverName: 'Chaminda Ratnayake',
    conductorId: 'STF-007',
    conductorName: 'Mahesh Bandara',
    date: '2026-02-21',
    scheduledDepartureTime: '09:00',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '10:15',
    actualArrivalTime: undefined,
    status: 'scheduled',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-040',
    arrivalStopName: 'Negombo Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'trip-004',
    tripNumber: 'T-2026-004',
    routeId: 'route-004',
    routeName: 'Colombo - Matara',
    routeNumber: '32',
    busId: 'bus-004',
    busNumber: 'SP-3456',
    driverId: 'STF-010',
    driverName: 'Sanjeewa Perera',
    conductorId: 'STF-009',
    conductorName: 'Ajith Kumara',
    date: '2026-02-21',
    scheduledDepartureTime: '09:15',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '13:00',
    actualArrivalTime: undefined,
    status: 'scheduled',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-050',
    arrivalStopName: 'Matara Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  {
    id: 'trip-005',
    tripNumber: 'T-2026-005',
    routeId: 'route-005',
    routeName: 'Colombo - Kurunegala',
    routeNumber: '6',
    busId: 'bus-005',
    busNumber: 'NW-7890',
    driverId: 'STF-011',
    driverName: 'Dinesh Rajapaksa',
    conductorId: 'STF-012',
    conductorName: 'Lakmal Fernando',
    date: '2026-02-21',
    scheduledDepartureTime: '09:30',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '12:00',
    actualArrivalTime: undefined,
    status: 'delayed',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-060',
    arrivalStopName: 'Kurunegala Bus Stand',
    notes: 'Driver arrived late',
    delayReason: 'Staff delay',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T07:35:00Z',
  },
  {
    id: 'trip-006',
    tripNumber: 'T-2026-006',
    routeId: 'route-006',
    routeName: 'Colombo - Anuradhapura',
    routeNumber: '57',
    busId: 'bus-006',
    busNumber: 'CP-4567',
    driverId: undefined,
    driverName: undefined,
    conductorId: undefined,
    conductorName: undefined,
    date: '2026-02-21',
    scheduledDepartureTime: '10:00',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '15:00',
    actualArrivalTime: undefined,
    status: 'scheduled',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-070',
    arrivalStopName: 'Anuradhapura Bus Stand',
    notes: 'Awaiting staff assignment',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
  // Past trips (completed)
  {
    id: 'trip-past-001',
    tripNumber: 'T-2026-P01',
    routeId: 'route-001',
    routeName: 'Colombo - Kandy',
    routeNumber: '138',
    busId: 'bus-007',
    busNumber: 'WP-2345',
    driverId: 'STF-013',
    driverName: 'Upul Tharanga',
    conductorId: 'STF-014',
    conductorName: 'Ruwan Kalpage',
    date: '2026-02-21',
    scheduledDepartureTime: '07:30',
    actualDepartureTime: '07:28',
    scheduledArrivalTime: '11:30',
    actualArrivalTime: undefined,
    status: 'in_transit',
    passengerCount: 45,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-020',
    arrivalStopName: 'Kandy Central Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T07:30:00Z',
  },
  {
    id: 'trip-past-002',
    tripNumber: 'T-2026-P02',
    routeId: 'route-002',
    routeName: 'Colombo - Galle',
    routeNumber: '2',
    busId: 'bus-008',
    busNumber: 'SP-7890',
    driverId: 'STF-015',
    driverName: 'Asanka Gurusinha',
    conductorId: 'STF-016',
    conductorName: 'Hashan Tillakaratne',
    date: '2026-02-21',
    scheduledDepartureTime: '07:45',
    actualDepartureTime: '07:52',
    scheduledArrivalTime: '10:30',
    actualArrivalTime: undefined,
    status: 'in_transit',
    passengerCount: 38,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-030',
    arrivalStopName: 'Galle Bus Stand',
    notes: 'Slight delay due to traffic',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T07:55:00Z',
  },
  {
    id: 'trip-past-003',
    tripNumber: 'T-2026-P03',
    routeId: 'route-003',
    routeName: 'Colombo - Negombo',
    routeNumber: '240',
    busId: 'bus-009',
    busNumber: 'WP-3333',
    driverId: 'STF-017',
    driverName: 'Marvan Atapattu',
    conductorId: 'STF-018',
    conductorName: 'Kumar Sangakkara',
    date: '2026-02-21',
    scheduledDepartureTime: '06:30',
    actualDepartureTime: '06:30',
    scheduledArrivalTime: '07:45',
    actualArrivalTime: '07:42',
    status: 'completed',
    passengerCount: 42,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-040',
    arrivalStopName: 'Negombo Bus Stand',
    notes: '',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T07:45:00Z',
  },
  {
    id: 'trip-past-004',
    tripNumber: 'T-2026-P04',
    routeId: 'route-001',
    routeName: 'Colombo - Kandy',
    routeNumber: '138',
    busId: 'bus-010',
    busNumber: 'CP-9999',
    driverId: 'STF-019',
    driverName: 'Mahela Jayawardene',
    conductorId: 'STF-020',
    conductorName: 'Tillakaratne Dilshan',
    date: '2026-02-21',
    scheduledDepartureTime: '06:00',
    actualDepartureTime: '06:05',
    scheduledArrivalTime: '10:00',
    actualArrivalTime: '10:15',
    status: 'completed',
    passengerCount: 50,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-020',
    arrivalStopName: 'Kandy Central Bus Stand',
    notes: 'Minor delay due to road work',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T10:15:00Z',
  },
  // Cancelled trip
  {
    id: 'trip-cancelled-001',
    tripNumber: 'T-2026-C01',
    routeId: 'route-005',
    routeName: 'Colombo - Kurunegala',
    routeNumber: '6',
    busId: 'bus-011',
    busNumber: 'NW-1111',
    driverId: undefined,
    driverName: undefined,
    conductorId: undefined,
    conductorName: undefined,
    date: '2026-02-21',
    scheduledDepartureTime: '05:30',
    actualDepartureTime: undefined,
    scheduledArrivalTime: '08:00',
    actualArrivalTime: undefined,
    status: 'cancelled',
    passengerCount: undefined,
    departureStopId: 'stop-001',
    departureStopName: 'Colombo Fort Bus Stand',
    arrivalStopId: 'stop-060',
    arrivalStopName: 'Kurunegala Bus Stand',
    notes: 'Cancelled due to bus breakdown',
    delayReason: undefined,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-21T05:15:00Z',
  },
];

// Available routes for filtering
export const availableRoutes = [
  { id: 'route-001', name: 'Colombo - Kandy', number: '138' },
  { id: 'route-002', name: 'Colombo - Galle', number: '2' },
  { id: 'route-003', name: 'Colombo - Negombo', number: '240' },
  { id: 'route-004', name: 'Colombo - Matara', number: '32' },
  { id: 'route-005', name: 'Colombo - Kurunegala', number: '6' },
  { id: 'route-006', name: 'Colombo - Anuradhapura', number: '57' },
  { id: 'route-007', name: 'Colombo - Jaffna', number: '15' },
  { id: 'route-008', name: 'Colombo - Batticaloa', number: '48' },
];

// Get trip statistics
export function getTripStats(date?: string): TripStats {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const filteredTrips = tripsData.filter(t => t.date === targetDate);
  
  return {
    totalTrips: filteredTrips.length,
    scheduledTrips: filteredTrips.filter(t => t.status === 'scheduled').length,
    completedTrips: filteredTrips.filter(t => t.status === 'completed').length,
    inProgressTrips: filteredTrips.filter(t => 
      t.status === 'boarding' || t.status === 'departed' || t.status === 'in_transit'
    ).length,
    delayedTrips: filteredTrips.filter(t => t.status === 'delayed').length,
    cancelledTrips: filteredTrips.filter(t => t.status === 'cancelled').length,
  };
}

// Get trips with optional filters
export function getTrips(
  filters?: TripFilters,
  page: number = 0,
  size: number = 10,
  sortBy: string = 'scheduledDepartureTime',
  sortDir: 'asc' | 'desc' = 'asc'
): PaginatedResponse<Trip> {
  let filteredData = [...tripsData];
  
  if (filters) {
    if (filters.date) {
      filteredData = filteredData.filter(t => t.date === filters.date);
    }
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(t => t.status === filters.status);
    }
    if (filters.routeId && filters.routeId !== 'all') {
      filteredData = filteredData.filter(t => t.routeId === filters.routeId);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(t => 
        t.tripNumber.toLowerCase().includes(term) ||
        t.routeName.toLowerCase().includes(term) ||
        t.busNumber.toLowerCase().includes(term) ||
        t.driverName?.toLowerCase().includes(term) ||
        t.routeNumber?.toLowerCase().includes(term)
      );
    }
  }
  
  // Sort
  filteredData.sort((a, b) => {
    const aValue = a[sortBy as keyof Trip] || '';
    const bValue = b[sortBy as keyof Trip] || '';
    
    if (sortDir === 'asc') {
      return String(aValue).localeCompare(String(bValue));
    }
    return String(bValue).localeCompare(String(aValue));
  });
  
  const totalElements = filteredData.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = page * size;
  const content = filteredData.slice(startIndex, startIndex + size);
  
  return {
    content,
    totalElements,
    totalPages,
    page,
    size,
    hasNext: page < totalPages - 1,
    hasPrevious: page > 0,
  };
}

// Get single trip by ID
export function getTripById(tripId: string): Trip | null {
  return tripsData.find(t => t.id === tripId) || null;
}

// Get upcoming trips (trips that haven't departed yet)
export function getUpcomingTrips(date?: string, limit?: number): Trip[] {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const upcoming = tripsData
    .filter(t => 
      t.date === targetDate && 
      (t.status === 'scheduled' || t.status === 'boarding' || t.status === 'delayed')
    )
    .sort((a, b) => a.scheduledDepartureTime.localeCompare(b.scheduledDepartureTime));
  
  return limit ? upcoming.slice(0, limit) : upcoming;
}

// Get active trips (trips currently in progress)
export function getActiveTrips(date?: string): Trip[] {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  return tripsData
    .filter(t => 
      t.date === targetDate && 
      (t.status === 'departed' || t.status === 'in_transit' || t.status === 'arrived')
    )
    .sort((a, b) => a.actualDepartureTime?.localeCompare(b.actualDepartureTime || '') || 0);
}

// Update trip status
export function updateTripStatus(
  tripId: string, 
  status: Trip['status'],
  notes?: string
): Trip | null {
  const trip = tripsData.find(t => t.id === tripId);
  if (trip) {
    trip.status = status;
    if (notes) trip.notes = notes;
    trip.updatedAt = new Date().toISOString();
    
    // Set actual times based on status
    if (status === 'departed' && !trip.actualDepartureTime) {
      trip.actualDepartureTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    if (status === 'completed' && !trip.actualArrivalTime) {
      trip.actualArrivalTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return { ...trip };
  }
  return null;
}

// Record trip departure
export function recordTripDeparture(
  tripId: string,
  passengerCount?: number,
  notes?: string
): Trip | null {
  const trip = tripsData.find(t => t.id === tripId);
  if (trip) {
    trip.status = 'departed';
    trip.actualDepartureTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    if (passengerCount !== undefined) trip.passengerCount = passengerCount;
    if (notes) trip.notes = notes;
    trip.updatedAt = new Date().toISOString();
    return { ...trip };
  }
  return null;
}

// Get assigned stop info
export function getAssignedStop(): AssignedStop {
  return { ...assignedStop };
}
