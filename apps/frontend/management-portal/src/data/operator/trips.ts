/**
 * Mock data for Operator Trip Management.
 *
 * This file provides static mock data for the operator portal until backend
 * APIs are fully implemented. When the backend is ready, replace the exported
 * service-functions below with real API calls while keeping the same return
 * types / interfaces — the pages and components will continue to work
 * without modification.
 */

// ---------------------------------------------------------------------------
// Enums / Union types
// ---------------------------------------------------------------------------

export type TripStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'IN_TRANSIT'
  | 'BOARDING'
  | 'DEPARTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DELAYED';

export type BusServiceType = 'SL' | 'SL_AC' | 'SEMI_LUXURY' | 'LUXURY' | 'EXPRESS';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface RouteStop {
  stopOrder: number;
  stopName: string;
  stopCode?: string;
  arrivalOffset?: number;   // minutes from departure
  departureOffset?: number; // minutes from departure
  isTerminal: boolean;
}

export interface OperatorTripRoute {
  id: string;
  routeNumber: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  routeGroupId: string;
  routeGroupName: string;
  routeGroupCode: string;
  description?: string;
  stops: RouteStop[];
}

export interface OperatorTripSchedule {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SUSPENDED';
  description?: string;
  effectiveFrom: string; // ISO date
  effectiveTo?: string;  // ISO date
  operatingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  scheduledDepartureTime: string; // HH:mm:ss
  scheduledArrivalTime: string;   // HH:mm:ss
}

export interface OperatorTripBus {
  id: string;
  registrationNumber: string;    // e.g. "NTC-1234"
  plateNumber: string;           // e.g. "WP-AB-1234"
  serviceType: BusServiceType;
  make: string;
  model: string;
  totalSeats: number;
  colour: string;
  facilities: {
    ac: boolean;
    wifi: boolean;
    cctv: boolean;
    gps: boolean;
    chargingPorts: boolean;
    wheelchairAccessible: boolean;
  };
}

export interface OperatorTripStaff {
  driverId?: string;
  driverName?: string;
  driverLicense?: string;
  driverPhone?: string;
  conductorId?: string;
  conductorName?: string;
  conductorPhone?: string;
}

export interface OperatorTripPermit {
  id: string;
  permitNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED';
  expiryDate: string; // ISO date
}

export interface OperatorTrip {
  id: string;
  tripDate: string;              // ISO date e.g. "2026-02-21"
  status: TripStatus;
  tripNumber?: string;           // e.g. "TRIP-2026-001"

  // Linked entities (IDs + denormalized display fields)
  routeId: string;
  routeName: string;
  routeNumber: string;
  routeOrigin: string;
  routeDestination: string;

  scheduleId: string;
  scheduleName: string;

  passengerServicePermitId: string;
  permitNumber: string;

  busId?: string;
  busRegistrationNumber?: string;
  busServiceType?: BusServiceType;
  busTotalSeats?: number;

  driverName?: string;
  conductorName?: string;

  // Times
  scheduledDepartureTime: string; // HH:mm:ss
  scheduledArrivalTime: string;   // HH:mm:ss
  actualDepartureTime?: string;   // HH:mm:ss
  actualArrivalTime?: string;     // HH:mm:ss

  notes?: string;
  cancellationReason?: string;

  // Audit
  createdAt: string;
  updatedAt: string;

  // Expanded nested objects (populated when viewing details)
  route?: OperatorTripRoute;
  schedule?: OperatorTripSchedule;
  bus?: OperatorTripBus;
  staff?: OperatorTripStaff;
  permit?: OperatorTripPermit;
}

export interface OperatorTripStatistics {
  totalTrips: number;
  activeTrips: number;
  pendingTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  delayedTrips: number;
  inTransitTrips: number;
  todaysTrips: number;
}

export interface OperatorTripPaginatedResult {
  data: OperatorTrip[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface OperatorTripFilterOptions {
  statuses: TripStatus[];
  routes: Array<{ id: string; name: string; routeNumber: string }>;
  schedules: Array<{ id: string; name: string }>;
  permits: Array<{ id: string; permitNumber: string }>;
  buses: Array<{ id: string; registrationNumber: string }>;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const ROUTES: OperatorTripRoute[] = [
  {
    id: 'RT-001',
    routeNumber: '100',
    name: 'Colombo Fort – Kandy',
    origin: 'Colombo Fort',
    destination: 'Kandy',
    distanceKm: 116,
    estimatedDurationMinutes: 180,
    routeGroupId: 'RG-001',
    routeGroupName: 'Colombo – Kandy Express Group',
    routeGroupCode: 'CK-EXP',
    description: 'Main intercity express route connecting Colombo and Kandy via A1 highway.',
    stops: [
      { stopOrder: 1, stopName: 'Colombo Fort', stopCode: 'CMB-FRT', arrivalOffset: 0, departureOffset: 0, isTerminal: true },
      { stopOrder: 2, stopName: 'Maradana', stopCode: 'MRD', arrivalOffset: 10, departureOffset: 12, isTerminal: false },
      { stopOrder: 3, stopName: 'Kelaniya', stopCode: 'KLN', arrivalOffset: 30, departureOffset: 32, isTerminal: false },
      { stopOrder: 4, stopName: 'Kadawatha', stopCode: 'KDW', arrivalOffset: 50, departureOffset: 52, isTerminal: false },
      { stopOrder: 5, stopName: 'Gampaha', stopCode: 'GMP', arrivalOffset: 70, departureOffset: 72, isTerminal: false },
      { stopOrder: 6, stopName: 'Veyangoda', stopCode: 'VYG', arrivalOffset: 90, departureOffset: 92, isTerminal: false },
      { stopOrder: 7, stopName: 'Warakapola', stopCode: 'WPL', arrivalOffset: 110, departureOffset: 112, isTerminal: false },
      { stopOrder: 8, stopName: 'Kegalle', stopCode: 'KGL', arrivalOffset: 135, departureOffset: 137, isTerminal: false },
      { stopOrder: 9, stopName: 'Mawanella', stopCode: 'MWN', arrivalOffset: 155, departureOffset: 157, isTerminal: false },
      { stopOrder: 10, stopName: 'Kandy', stopCode: 'KND', arrivalOffset: 180, departureOffset: 180, isTerminal: true },
    ],
  },
  {
    id: 'RT-002',
    routeNumber: '2',
    name: 'Colombo Fort – Galle',
    origin: 'Colombo Fort',
    destination: 'Galle',
    distanceKm: 119,
    estimatedDurationMinutes: 160,
    routeGroupId: 'RG-002',
    routeGroupName: 'Colombo – Galle Southern Group',
    routeGroupCode: 'CG-STH',
    description: 'Southern expressway route connecting Colombo to Galle.',
    stops: [
      { stopOrder: 1, stopName: 'Colombo Fort', stopCode: 'CMB-FRT', arrivalOffset: 0, departureOffset: 0, isTerminal: true },
      { stopOrder: 2, stopName: 'Wellawatte', stopCode: 'WLW', arrivalOffset: 20, departureOffset: 22, isTerminal: false },
      { stopOrder: 3, stopName: 'Moratuwa', stopCode: 'MRT', arrivalOffset: 40, departureOffset: 42, isTerminal: false },
      { stopOrder: 4, stopName: 'Panadura', stopCode: 'PND', arrivalOffset: 60, departureOffset: 62, isTerminal: false },
      { stopOrder: 5, stopName: 'Kalutara', stopCode: 'KLT', arrivalOffset: 85, departureOffset: 87, isTerminal: false },
      { stopOrder: 6, stopName: 'Ambalangoda', stopCode: 'AMB', arrivalOffset: 120, departureOffset: 122, isTerminal: false },
      { stopOrder: 7, stopName: 'Hikkaduwa', stopCode: 'HKD', arrivalOffset: 140, departureOffset: 142, isTerminal: false },
      { stopOrder: 8, stopName: 'Galle', stopCode: 'GLL', arrivalOffset: 160, departureOffset: 160, isTerminal: true },
    ],
  },
  {
    id: 'RT-003',
    routeNumber: '240',
    name: 'Colombo – Negombo',
    origin: 'Colombo Fort',
    destination: 'Negombo',
    distanceKm: 37,
    estimatedDurationMinutes: 75,
    routeGroupId: 'RG-003',
    routeGroupName: 'Colombo – Negombo Airport Group',
    routeGroupCode: 'CN-AIR',
    description: 'Airport service connecting Colombo to Negombo International Airport vicinity.',
    stops: [
      { stopOrder: 1, stopName: 'Colombo Fort', stopCode: 'CMB-FRT', arrivalOffset: 0, departureOffset: 0, isTerminal: true },
      { stopOrder: 2, stopName: 'Peliyagoda', stopCode: 'PLY', arrivalOffset: 20, departureOffset: 22, isTerminal: false },
      { stopOrder: 3, stopName: 'Ja-Ela', stopCode: 'JEL', arrivalOffset: 40, departureOffset: 42, isTerminal: false },
      { stopOrder: 4, stopName: 'Katunayake', stopCode: 'KTK', arrivalOffset: 60, departureOffset: 62, isTerminal: false },
      { stopOrder: 5, stopName: 'Negombo', stopCode: 'NGM', arrivalOffset: 75, departureOffset: 75, isTerminal: true },
    ],
  },
];

const SCHEDULES: OperatorTripSchedule[] = [
  {
    id: 'SCH-001',
    name: 'CK-100 Morning Express',
    status: 'ACTIVE',
    description: 'Morning express run from Colombo to Kandy',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2026-12-31',
    operatingDays: [1, 2, 3, 4, 5, 6], // Mon–Sat
    scheduledDepartureTime: '06:00:00',
    scheduledArrivalTime: '09:00:00',
  },
  {
    id: 'SCH-002',
    name: 'CK-100 Afternoon Run',
    status: 'ACTIVE',
    description: 'Afternoon run from Colombo to Kandy',
    effectiveFrom: '2024-01-01',
    effectiveTo: '2026-12-31',
    operatingDays: [1, 2, 3, 4, 5, 6, 0],
    scheduledDepartureTime: '13:30:00',
    scheduledArrivalTime: '16:30:00',
  },
  {
    id: 'SCH-003',
    name: 'CG-2 Morning Service',
    status: 'ACTIVE',
    description: 'Morning service from Colombo to Galle',
    effectiveFrom: '2024-03-01',
    operatingDays: [1, 2, 3, 4, 5],
    scheduledDepartureTime: '07:00:00',
    scheduledArrivalTime: '09:40:00',
  },
  {
    id: 'SCH-004',
    name: 'CN-240 Daily Airport Shuttle',
    status: 'ACTIVE',
    description: 'Daily shuttle to Negombo / Airport',
    effectiveFrom: '2024-06-01',
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    scheduledDepartureTime: '09:00:00',
    scheduledArrivalTime: '10:15:00',
  },
];

const BUSES: OperatorTripBus[] = [
  {
    id: 'BUS-001',
    registrationNumber: 'NTC-4521',
    plateNumber: 'WP-AB-4521',
    serviceType: 'SL_AC',
    make: 'Ashok Leyland',
    model: 'Viking 222',
    totalSeats: 48,
    colour: 'Blue / White',
    facilities: { ac: true, wifi: true, cctv: true, gps: true, chargingPorts: true, wheelchairAccessible: false },
  },
  {
    id: 'BUS-002',
    registrationNumber: 'NTC-3876',
    plateNumber: 'WP-CD-3876',
    serviceType: 'SL',
    make: 'Tata Motors',
    model: 'Starbus Ultra',
    totalSeats: 54,
    colour: 'Red / White',
    facilities: { ac: false, wifi: false, cctv: true, gps: true, chargingPorts: false, wheelchairAccessible: false },
  },
  {
    id: 'BUS-003',
    registrationNumber: 'NTC-5512',
    plateNumber: 'CP-EF-5512',
    serviceType: 'SEMI_LUXURY',
    make: 'Ashok Leyland',
    model: 'LYNX',
    totalSeats: 40,
    colour: 'Maroon / Silver',
    facilities: { ac: true, wifi: false, cctv: true, gps: true, chargingPorts: false, wheelchairAccessible: true },
  },
  {
    id: 'BUS-004',
    registrationNumber: 'NTC-6201',
    plateNumber: 'SP-GH-6201',
    serviceType: 'SL',
    make: 'Tata Motors',
    model: 'Starbus Ultra',
    totalSeats: 54,
    colour: 'Blue / White',
    facilities: { ac: false, wifi: false, cctv: false, gps: true, chargingPorts: false, wheelchairAccessible: false },
  },
];

const STAFF: OperatorTripStaff[] = [
  { driverId: 'DRV-001', driverName: 'Sunil Perera', driverLicense: 'DL-WP-12345', driverPhone: '0711234567', conductorId: 'CND-001', conductorName: 'Kamal Silva', conductorPhone: '0721234567' },
  { driverId: 'DRV-002', driverName: 'Nimal Fernando', driverLicense: 'DL-CP-98765', driverPhone: '0712345678', conductorId: 'CND-002', conductorName: 'Saman Jayawardena', conductorPhone: '0722345678' },
  { driverId: 'DRV-003', driverName: 'Roshan de Silva', driverLicense: 'DL-WP-54321', driverPhone: '0713456789', conductorId: 'CND-003', conductorName: 'Pradeep Bandara', conductorPhone: '0723456789' },
  { driverId: 'DRV-004', driverName: 'Chaminda Wickramasinghe', driverLicense: 'DL-SP-11122', driverPhone: '0714567890', conductorId: 'CND-004', conductorName: 'Ajith Kumara', conductorPhone: '0724567890' },
];

const PERMITS: OperatorTripPermit[] = [
  { id: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001', status: 'ACTIVE', expiryDate: '2026-01-14' },
  { id: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002', status: 'ACTIVE', expiryDate: '2026-02-28' },
  { id: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015', status: 'ACTIVE', expiryDate: '2025-12-31' },
];

// ---------------------------------------------------------------------------
// Core mock trip list — 30 trips across various dates and statuses
// ---------------------------------------------------------------------------

const MOCK_TRIPS: OperatorTrip[] = [
  // ── Today (2026-02-21) ────────────────────────────────────────────────────
  {
    id: 'TRP-2026-001',
    tripNumber: 'TRIP/2026/001',
    tripDate: '2026-02-21',
    status: 'IN_TRANSIT',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:05:00',
    notes: 'Minor delay at Maradana stop.',
    createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-21T06:05:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-002',
    tripNumber: 'TRIP/2026/002',
    tripDate: '2026-02-21',
    status: 'BOARDING',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-21T06:45:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-003',
    tripNumber: 'TRIP/2026/003',
    tripDate: '2026-02-21',
    status: 'PENDING',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-21T07:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-004',
    tripNumber: 'TRIP/2026/004',
    tripDate: '2026-02-21',
    status: 'PENDING',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-02-21T07:00:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },

  // ── Yesterday (2026-02-20) ────────────────────────────────────────────────
  {
    id: 'TRP-2026-005',
    tripNumber: 'TRIP/2026/005',
    tripDate: '2026-02-20',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:10:00',
    createdAt: '2026-02-09T08:00:00Z', updatedAt: '2026-02-20T09:10:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-006',
    tripNumber: 'TRIP/2026/006',
    tripDate: '2026-02-20',
    status: 'COMPLETED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:02:00', actualArrivalTime: '09:38:00',
    createdAt: '2026-02-09T08:00:00Z', updatedAt: '2026-02-20T09:38:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-007',
    tripNumber: 'TRIP/2026/007',
    tripDate: '2026-02-20',
    status: 'DELAYED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    actualDepartureTime: '14:00:00',
    notes: 'Delayed due to traffic congestion on A1 highway.',
    createdAt: '2026-02-09T08:00:00Z', updatedAt: '2026-02-20T14:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-008',
    tripNumber: 'TRIP/2026/008',
    tripDate: '2026-02-20',
    status: 'CANCELLED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    cancellationReason: 'Bus under emergency maintenance.',
    createdAt: '2026-02-09T08:00:00Z', updatedAt: '2026-02-20T08:30:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },

  // ── 2026-02-19 ─────────────────────────────────────────────────────────-
  {
    id: 'TRP-2026-009',
    tripNumber: 'TRIP/2026/009',
    tripDate: '2026-02-19',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-02-08T08:00:00Z', updatedAt: '2026-02-19T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-010',
    tripNumber: 'TRIP/2026/010',
    tripDate: '2026-02-19',
    status: 'COMPLETED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:00:00', actualArrivalTime: '09:42:00',
    createdAt: '2026-02-08T08:00:00Z', updatedAt: '2026-02-19T09:42:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-011',
    tripNumber: 'TRIP/2026/011',
    tripDate: '2026-02-19',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    actualDepartureTime: '13:30:00', actualArrivalTime: '16:25:00',
    createdAt: '2026-02-08T08:00:00Z', updatedAt: '2026-02-19T16:25:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-012',
    tripNumber: 'TRIP/2026/012',
    tripDate: '2026-02-19',
    status: 'COMPLETED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    actualDepartureTime: '09:00:00', actualArrivalTime: '10:10:00',
    createdAt: '2026-02-08T08:00:00Z', updatedAt: '2026-02-19T10:10:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },

  // ── 2026-02-18 ────────────────────────────────────────────────────────────
  {
    id: 'TRP-2026-013',
    tripNumber: 'TRIP/2026/013',
    tripDate: '2026-02-18',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:05:00',
    createdAt: '2026-02-07T08:00:00Z', updatedAt: '2026-02-18T09:05:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-014',
    tripNumber: 'TRIP/2026/014',
    tripDate: '2026-02-18',
    status: 'CANCELLED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    cancellationReason: 'Driver unavailable due to illness.',
    createdAt: '2026-02-07T08:00:00Z', updatedAt: '2026-02-18T06:30:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-015',
    tripNumber: 'TRIP/2026/015',
    tripDate: '2026-02-18',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    actualDepartureTime: '13:30:00', actualArrivalTime: '16:30:00',
    createdAt: '2026-02-07T08:00:00Z', updatedAt: '2026-02-18T16:30:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },

  // ── 2026-02-17 ────────────────────────────────────────────────────────────
  {
    id: 'TRP-2026-016',
    tripNumber: 'TRIP/2026/016',
    tripDate: '2026-02-17',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-02-06T08:00:00Z', updatedAt: '2026-02-17T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-017',
    tripNumber: 'TRIP/2026/017',
    tripDate: '2026-02-17',
    status: 'DELAYED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    actualDepartureTime: '09:25:00',
    notes: 'Delayed due to road closure near Peliyagoda.',
    createdAt: '2026-02-06T08:00:00Z', updatedAt: '2026-02-17T09:25:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },

  // ── 2026-02-15 ─────────────────────────────────────────────────────────-
  {
    id: 'TRP-2026-018',
    tripNumber: 'TRIP/2026/018',
    tripDate: '2026-02-15',
    status: 'COMPLETED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:00:00', actualArrivalTime: '09:40:00',
    createdAt: '2026-02-05T08:00:00Z', updatedAt: '2026-02-15T09:40:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-019',
    tripNumber: 'TRIP/2026/019',
    tripDate: '2026-02-15',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-02-05T08:00:00Z', updatedAt: '2026-02-15T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-020',
    tripNumber: 'TRIP/2026/020',
    tripDate: '2026-02-14',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    actualDepartureTime: '13:30:00', actualArrivalTime: '16:45:00',
    notes: 'Slight delay due to heavy traffic near Kegalle.',
    createdAt: '2026-02-04T08:00:00Z', updatedAt: '2026-02-14T16:45:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-021',
    tripNumber: 'TRIP/2026/021',
    tripDate: '2026-02-14',
    status: 'CANCELLED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    cancellationReason: 'Strike action — no passengers.',
    createdAt: '2026-02-04T08:00:00Z', updatedAt: '2026-02-14T08:45:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },
  {
    id: 'TRP-2026-022',
    tripNumber: 'TRIP/2026/022',
    tripDate: '2026-02-13',
    status: 'COMPLETED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:00:00', actualArrivalTime: '09:40:00',
    createdAt: '2026-02-03T08:00:00Z', updatedAt: '2026-02-13T09:40:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-023',
    tripNumber: 'TRIP/2026/023',
    tripDate: '2026-02-12',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-02-02T08:00:00Z', updatedAt: '2026-02-12T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-024',
    tripNumber: 'TRIP/2026/024',
    tripDate: '2026-02-11',
    status: 'COMPLETED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    actualDepartureTime: '09:00:00', actualArrivalTime: '10:15:00',
    createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-02-11T10:15:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },
  {
    id: 'TRP-2026-025',
    tripNumber: 'TRIP/2026/025',
    tripDate: '2026-02-10',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-002', scheduleName: 'CK-100 Afternoon Run',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-003', busRegistrationNumber: 'NTC-5512', busServiceType: 'SEMI_LUXURY', busTotalSeats: 40,
    driverName: 'Roshan de Silva', conductorName: 'Pradeep Bandara',
    scheduledDepartureTime: '13:30:00', scheduledArrivalTime: '16:30:00',
    actualDepartureTime: '13:30:00', actualArrivalTime: '16:30:00',
    createdAt: '2026-01-31T08:00:00Z', updatedAt: '2026-02-10T16:30:00Z',
    route: ROUTES[0], schedule: SCHEDULES[1], bus: BUSES[2], staff: STAFF[2], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-026',
    tripNumber: 'TRIP/2026/026',
    tripDate: '2026-02-08',
    status: 'COMPLETED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:00:00', actualArrivalTime: '09:38:00',
    createdAt: '2026-01-29T08:00:00Z', updatedAt: '2026-02-08T09:38:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-027',
    tripNumber: 'TRIP/2026/027',
    tripDate: '2026-02-05',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-01-26T08:00:00Z', updatedAt: '2026-02-05T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
  {
    id: 'TRP-2026-028',
    tripNumber: 'TRIP/2026/028',
    tripDate: '2026-02-03',
    status: 'COMPLETED',
    routeId: 'RT-003', routeName: 'Colombo – Negombo', routeNumber: '240', routeOrigin: 'Colombo Fort', routeDestination: 'Negombo',
    scheduleId: 'SCH-004', scheduleName: 'CN-240 Daily Airport Shuttle',
    passengerServicePermitId: 'PSP-2024-003', permitNumber: 'PSP/SP/2024/015',
    busId: 'BUS-004', busRegistrationNumber: 'NTC-6201', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Chaminda Wickramasinghe', conductorName: 'Ajith Kumara',
    scheduledDepartureTime: '09:00:00', scheduledArrivalTime: '10:15:00',
    actualDepartureTime: '09:00:00', actualArrivalTime: '10:15:00',
    createdAt: '2026-01-25T08:00:00Z', updatedAt: '2026-02-03T10:15:00Z',
    route: ROUTES[2], schedule: SCHEDULES[3], bus: BUSES[3], staff: STAFF[3], permit: PERMITS[2],
  },
  {
    id: 'TRP-2026-029',
    tripNumber: 'TRIP/2026/029',
    tripDate: '2026-02-01',
    status: 'DELAYED',
    routeId: 'RT-002', routeName: 'Colombo Fort – Galle', routeNumber: '2', routeOrigin: 'Colombo Fort', routeDestination: 'Galle',
    scheduleId: 'SCH-003', scheduleName: 'CG-2 Morning Service',
    passengerServicePermitId: 'PSP-2024-002', permitNumber: 'PSP/WP/2024/002',
    busId: 'BUS-002', busRegistrationNumber: 'NTC-3876', busServiceType: 'SL', busTotalSeats: 54,
    driverName: 'Nimal Fernando', conductorName: 'Saman Jayawardena',
    scheduledDepartureTime: '07:00:00', scheduledArrivalTime: '09:40:00',
    actualDepartureTime: '07:30:00',
    notes: 'Delayed due to unexpected police checkpoint at Panadura.',
    createdAt: '2026-01-23T08:00:00Z', updatedAt: '2026-02-01T07:30:00Z',
    route: ROUTES[1], schedule: SCHEDULES[2], bus: BUSES[1], staff: STAFF[1], permit: PERMITS[1],
  },
  {
    id: 'TRP-2026-030',
    tripNumber: 'TRIP/2026/030',
    tripDate: '2026-01-28',
    status: 'COMPLETED',
    routeId: 'RT-001', routeName: 'Colombo Fort – Kandy', routeNumber: '100', routeOrigin: 'Colombo Fort', routeDestination: 'Kandy',
    scheduleId: 'SCH-001', scheduleName: 'CK-100 Morning Express',
    passengerServicePermitId: 'PSP-2024-001', permitNumber: 'PSP/WP/2024/001',
    busId: 'BUS-001', busRegistrationNumber: 'NTC-4521', busServiceType: 'SL_AC', busTotalSeats: 48,
    driverName: 'Sunil Perera', conductorName: 'Kamal Silva',
    scheduledDepartureTime: '06:00:00', scheduledArrivalTime: '09:00:00',
    actualDepartureTime: '06:00:00', actualArrivalTime: '09:00:00',
    createdAt: '2026-01-19T08:00:00Z', updatedAt: '2026-01-28T09:00:00Z',
    route: ROUTES[0], schedule: SCHEDULES[0], bus: BUSES[0], staff: STAFF[0], permit: PERMITS[0],
  },
];

// ---------------------------------------------------------------------------
// Service functions (to be replaced with real API calls)
// ---------------------------------------------------------------------------

export interface GetTripsParams {
  page?: number;
  size?: number;
  sortBy?: keyof OperatorTrip;
  sortDir?: 'asc' | 'desc';
  search?: string;
  status?: TripStatus | 'all';
  routeId?: string;
  scheduleId?: string;
  permitId?: string;
  busId?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Simulates a paginated trips list request.
 * Replace with a real API call when the backend is ready.
 */
export function getOperatorTrips(params: GetTripsParams = {}): OperatorTripPaginatedResult {
  const {
    page = 0,
    size = 10,
    sortBy = 'tripDate',
    sortDir = 'desc',
    search = '',
    status,
    routeId,
    scheduleId,
    permitId,
    busId,
    fromDate,
    toDate,
  } = params;

  let filtered = [...MOCK_TRIPS];

  // Search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.tripNumber?.toLowerCase().includes(q) ||
        t.routeName.toLowerCase().includes(q) ||
        t.routeNumber.toLowerCase().includes(q) ||
        t.routeOrigin.toLowerCase().includes(q) ||
        t.routeDestination.toLowerCase().includes(q) ||
        t.driverName?.toLowerCase().includes(q) ||
        t.conductorName?.toLowerCase().includes(q) ||
        t.busRegistrationNumber?.toLowerCase().includes(q) ||
        t.permitNumber.toLowerCase().includes(q)
    );
  }

  // Status filter
  if (status && status !== 'all') {
    filtered = filtered.filter((t) => t.status === status);
  }

  // Route filter
  if (routeId) {
    filtered = filtered.filter((t) => t.routeId === routeId);
  }

  // Schedule filter
  if (scheduleId) {
    filtered = filtered.filter((t) => t.scheduleId === scheduleId);
  }

  // Permit filter
  if (permitId) {
    filtered = filtered.filter((t) => t.passengerServicePermitId === permitId);
  }

  // Bus filter
  if (busId) {
    filtered = filtered.filter((t) => t.busId === busId);
  }

  // Date range filter
  if (fromDate) {
    filtered = filtered.filter((t) => t.tripDate >= fromDate);
  }
  if (toDate) {
    filtered = filtered.filter((t) => t.tripDate <= toDate);
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = String(a[sortBy] ?? '');
    const bVal = String(b[sortBy] ?? '');
    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  // Paginate
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  const data = filtered.slice(page * size, page * size + size);

  return { data, totalElements, totalPages, currentPage: page, pageSize: size };
}

/**
 * Retrieves a single trip by ID.
 * Replace with a real API call when the backend is ready.
 */
export function getOperatorTripById(tripId: string): OperatorTrip | null {
  return MOCK_TRIPS.find((t) => t.id === tripId) ?? null;
}

/**
 * Returns aggregated statistics for operator trips.
 * Replace with a real API call when the backend is ready.
 */
export function getOperatorTripStats(): OperatorTripStatistics {
  const today = new Date().toISOString().split('T')[0];
  return {
    totalTrips: MOCK_TRIPS.length,
    activeTrips: MOCK_TRIPS.filter((t) => t.status === 'ACTIVE').length,
    pendingTrips: MOCK_TRIPS.filter((t) => t.status === 'PENDING').length,
    completedTrips: MOCK_TRIPS.filter((t) => t.status === 'COMPLETED').length,
    cancelledTrips: MOCK_TRIPS.filter((t) => t.status === 'CANCELLED').length,
    delayedTrips: MOCK_TRIPS.filter((t) => t.status === 'DELAYED').length,
    inTransitTrips: MOCK_TRIPS.filter(
      (t) => t.status === 'IN_TRANSIT' || t.status === 'BOARDING' || t.status === 'DEPARTED'
    ).length,
    todaysTrips: MOCK_TRIPS.filter((t) => t.tripDate === today).length,
  };
}

/**
 * Returns filter options (unique routes, schedules, etc.) for the filter panel.
 * Replace with a real API call when the backend is ready.
 */
export function getOperatorTripFilterOptions(): OperatorTripFilterOptions {
  const routeMap = new Map<string, { id: string; name: string; routeNumber: string }>();
  const scheduleMap = new Map<string, { id: string; name: string }>();
  const permitMap = new Map<string, { id: string; permitNumber: string }>();
  const busMap = new Map<string, { id: string; registrationNumber: string }>();

  MOCK_TRIPS.forEach((t) => {
    routeMap.set(t.routeId, { id: t.routeId, name: t.routeName, routeNumber: t.routeNumber });
    scheduleMap.set(t.scheduleId, { id: t.scheduleId, name: t.scheduleName });
    permitMap.set(t.passengerServicePermitId, { id: t.passengerServicePermitId, permitNumber: t.permitNumber });
    if (t.busId) busMap.set(t.busId, { id: t.busId, registrationNumber: t.busRegistrationNumber! });
  });

  return {
    statuses: ['PENDING', 'ACTIVE', 'IN_TRANSIT', 'BOARDING', 'DEPARTED', 'COMPLETED', 'CANCELLED', 'DELAYED'],
    routes: Array.from(routeMap.values()),
    schedules: Array.from(scheduleMap.values()),
    permits: Array.from(permitMap.values()),
    buses: Array.from(busMap.values()),
  };
}
