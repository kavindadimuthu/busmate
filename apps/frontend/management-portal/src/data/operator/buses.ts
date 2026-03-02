/**
 * Mock data for Operator Fleet Management (Buses).
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

export type BusStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'RETIRED';
export type BusServiceType = 'SL' | 'SL_AC' | 'SEMI_LUXURY' | 'LUXURY' | 'EXPRESS';
export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'DAMAGED';
export type MaintenanceType = 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'OVERHAUL';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BusFacilities {
  ac: boolean;
  wifi: boolean;
  cctv: boolean;
  gps: boolean;
  audioSystem: boolean;
  chargingPorts: boolean;
  wheelchairAccessible: boolean;
  airSuspension: boolean;
  toilet: boolean;
  tvScreens: boolean;
  readingLights: boolean;
  seatBelts: boolean;
  fireExtinguisher: boolean;
  emergencyExits: number; // count
}

export interface DriverAssignment {
  driverId: string;
  driverName: string;
  licenseNumber: string;
  contactPhone: string;
  assignedSince: string; // ISO date
}

export interface ConductorAssignment {
  conductorId: string;
  conductorName: string;
  contactPhone: string;
  assignedSince: string; // ISO date
}

export interface RouteAssignment {
  routeId: string;
  routeName: string;
  routeNumber: string;
  origin: string;
  destination: string;
  permitNumber: string;
}

export interface SeatRow {
  rowNumber: number;
  left: SeatInfo[];
  right: SeatInfo[];
}

export interface SeatInfo {
  seatNumber: string;
  row: number;
  position: 'window' | 'aisle';
  side: 'left' | 'right';
  status: SeatStatus;
}

export interface SeatingLayout {
  totalSeats: number;
  rows: number;
  seatsPerRow: number; // per side
  hasRearSeat: boolean;
  rearSeatCount: number;
  layout: SeatRow[];
}

export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  description: string;
  scheduledDate: string;      // ISO date
  completedDate?: string;     // ISO date, set when completed
  technician?: string;
  workshopName?: string;
  cost?: number;              // LKR
  mileageAtService?: number;  // km
  notes?: string;
  partsReplaced?: string[];
}

export interface LocationInfo {
  lastKnownLat: number;
  lastKnownLng: number;
  lastUpdated: string;        // ISO datetime
  currentSpeed: number;       // km/h
  heading: number;            // degrees
  address: string;
  isOnline: boolean;
}

export interface TripRecord {
  tripId: string;
  routeName: string;
  origin: string;
  destination: string;
  departureTime: string;      // ISO datetime
  arrivalTime?: string;       // ISO datetime (null if upcoming)
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'CANCELLED';
  passengerCount?: number;
  revenue?: number;           // LKR
  driverName: string;
}

export interface OperatorBus {
  id: string;
  plateNumber: string;
  ntcRegistrationNumber: string;
  model: string;
  manufacturer: string;
  year: number;
  serviceType: BusServiceType;
  status: BusStatus;
  seatingCapacity: number;
  standingCapacity: number;
  color: string;
  chassisNumber: string;
  engineNumber: string;
  insuranceNumber: string;
  insuranceExpiryDate: string;   // ISO date
  revenueLicenseExpiryDate: string; // ISO date
  lastServiceDate: string;       // ISO date
  nextServiceDate: string;       // ISO date
  mileage: number;               // km
  facilities: BusFacilities;
  driver?: DriverAssignment;
  conductor?: ConductorAssignment;
  routeAssignments: RouteAssignment[];
  seatingLayout: SeatingLayout;
  maintenanceRecords: MaintenanceRecord[];
  recentTrips: TripRecord[];
  location?: LocationInfo;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Statistics interface
// ---------------------------------------------------------------------------

export interface FleetStatistics {
  totalBuses: number;
  activeBuses: number;
  inactiveBuses: number;
  maintenanceBuses: number;
  totalCapacity: number;
  averageCapacity: number;
}

// ---------------------------------------------------------------------------
// Helper: build a simple seating layout
// ---------------------------------------------------------------------------

function buildSeatingLayout(totalSeats: number): SeatingLayout {
  const rearSeat = 5;
  const seatableByRows = totalSeats - rearSeat;
  const rows = Math.ceil(seatableByRows / 4); // 2 left + 2 right per row
  const layout: SeatRow[] = [];
  let seatNum = 1;

  for (let r = 1; r <= rows; r++) {
    const leftSeats: SeatInfo[] = [];
    const rightSeats: SeatInfo[] = [];

    // Left side: window then aisle
    for (let c = 0; c < 2 && seatNum <= seatableByRows; c++) {
      leftSeats.push({
        seatNumber: `${seatNum}`,
        row: r,
        position: c === 0 ? 'window' : 'aisle',
        side: 'left',
        status: 'AVAILABLE',
      });
      seatNum++;
    }

    // Right side: aisle then window
    for (let c = 0; c < 2 && seatNum <= seatableByRows; c++) {
      rightSeats.push({
        seatNumber: `${seatNum}`,
        row: r,
        position: c === 0 ? 'aisle' : 'window',
        side: 'right',
        status: 'AVAILABLE',
      });
      seatNum++;
    }

    layout.push({ rowNumber: r, left: leftSeats, right: rightSeats });
  }

  return {
    totalSeats,
    rows,
    seatsPerRow: 2,
    hasRearSeat: true,
    rearSeatCount: rearSeat,
    layout,
  };
}

// ---------------------------------------------------------------------------
// Mock bus records
// ---------------------------------------------------------------------------

const MOCK_BUSES: OperatorBus[] = [
  // ── Bus 1 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-001',
    plateNumber: 'ND 4536',
    ntcRegistrationNumber: 'NTC/WP/2020/001',
    model: 'Ashok Leyland Viking',
    manufacturer: 'Ashok Leyland',
    year: 2020,
    serviceType: 'SL',
    status: 'ACTIVE',
    seatingCapacity: 54,
    standingCapacity: 20,
    color: 'Red & White',
    chassisNumber: 'AL2020ND4536CHS',
    engineNumber: 'AL2020ND4536ENG',
    insuranceNumber: 'INS/2024/ND4536',
    insuranceExpiryDate: '2025-12-31',
    revenueLicenseExpiryDate: '2025-06-30',
    lastServiceDate: '2026-01-15',
    nextServiceDate: '2026-04-15',
    mileage: 128450,
    facilities: {
      ac: false, wifi: false, cctv: true, gps: true, audioSystem: true,
      chargingPorts: false, wheelchairAccessible: false, airSuspension: false,
      toilet: false, tvScreens: false, readingLights: false, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    driver: {
      driverId: 'DRV-001', driverName: 'Kasun Perera',
      licenseNumber: 'LIC/WP/2018/001', contactPhone: '+94 77 234 5678',
      assignedSince: '2022-03-01',
    },
    conductor: {
      conductorId: 'CON-001', conductorName: 'Nuwan Silva',
      contactPhone: '+94 77 234 9876', assignedSince: '2022-03-01',
    },
    routeAssignments: [{
      routeId: 'RT-001', routeName: 'Matara – Galle', routeNumber: '32/1',
      origin: 'Matara', destination: 'Galle', permitNumber: 'PSP/WP/2024/001',
    }],
    seatingLayout: buildSeatingLayout(54),
    maintenanceRecords: [
      {
        id: 'MNT-001-001', type: 'ROUTINE', status: 'COMPLETED',
        description: 'Regular 3-month oil & filter change',
        scheduledDate: '2026-01-15', completedDate: '2026-01-15',
        technician: 'Sunil Jayawardena', workshopName: 'Matara Central Workshop',
        cost: 18500, mileageAtService: 128000, partsReplaced: ['Engine Oil', 'Oil Filter', 'Air Filter'],
      },
      {
        id: 'MNT-001-002', type: 'INSPECTION', status: 'COMPLETED',
        description: 'Annual NTC roadworthiness inspection',
        scheduledDate: '2025-12-01', completedDate: '2025-12-01',
        technician: 'NTC Inspector', workshopName: 'NTC Inspection Center – Matara',
        cost: 5000, mileageAtService: 125000,
      },
      {
        id: 'MNT-001-003', type: 'ROUTINE', status: 'SCHEDULED',
        description: 'Upcoming 3-month oil & filter change',
        scheduledDate: '2026-04-15',
        workshopName: 'Matara Central Workshop',
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-001-001', routeName: 'Matara – Galle', origin: 'Matara', destination: 'Galle',
        departureTime: '2026-02-21T06:00:00Z', arrivalTime: '2026-02-21T07:30:00Z',
        status: 'COMPLETED', passengerCount: 48, revenue: 12960, driverName: 'Kasun Perera',
      },
      {
        tripId: 'TRP-001-002', routeName: 'Galle – Matara', origin: 'Galle', destination: 'Matara',
        departureTime: '2026-02-21T08:30:00Z', arrivalTime: '2026-02-21T10:00:00Z',
        status: 'COMPLETED', passengerCount: 52, revenue: 14040, driverName: 'Kasun Perera',
      },
      {
        tripId: 'TRP-001-003', routeName: 'Matara – Galle', origin: 'Matara', destination: 'Galle',
        departureTime: '2026-02-21T13:00:00Z',
        status: 'SCHEDULED', driverName: 'Kasun Perera',
      },
    ],
    location: {
      lastKnownLat: 6.0535, lastKnownLng: 80.2210, lastUpdated: '2026-02-21T10:05:00Z',
      currentSpeed: 0, heading: 180, address: 'Matara Bus Terminal, Matara', isOnline: true,
    },
    createdAt: '2020-06-01T00:00:00Z', updatedAt: '2026-02-21T10:05:00Z',
  },

  // ── Bus 2 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-002',
    plateNumber: 'ND 7892',
    ntcRegistrationNumber: 'NTC/WP/2021/002',
    model: 'Tata Ultra Bus',
    manufacturer: 'Tata Motors',
    year: 2021,
    serviceType: 'SL_AC',
    status: 'ACTIVE',
    seatingCapacity: 52,
    standingCapacity: 0,
    color: 'Blue & Silver',
    chassisNumber: 'TATA2021ND7892CHS',
    engineNumber: 'TATA2021ND7892ENG',
    insuranceNumber: 'INS/2024/ND7892',
    insuranceExpiryDate: '2026-03-31',
    revenueLicenseExpiryDate: '2026-03-31',
    lastServiceDate: '2026-02-01',
    nextServiceDate: '2026-05-01',
    mileage: 82330,
    facilities: {
      ac: true, wifi: true, cctv: true, gps: true, audioSystem: true,
      chargingPorts: true, wheelchairAccessible: false, airSuspension: true,
      toilet: false, tvScreens: false, readingLights: true, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    driver: {
      driverId: 'DRV-002', driverName: 'Chaminda Fernando',
      licenseNumber: 'LIC/WP/2017/022', contactPhone: '+94 77 456 7890',
      assignedSince: '2021-07-01',
    },
    conductor: {
      conductorId: 'CON-002', conductorName: 'Roshan Jayawardena',
      contactPhone: '+94 77 456 0987', assignedSince: '2021-07-01',
    },
    routeAssignments: [{
      routeId: 'RT-002', routeName: 'Matara – Colombo', routeNumber: '2',
      origin: 'Matara', destination: 'Colombo Fort', permitNumber: 'PSP/WP/2024/002',
    }],
    seatingLayout: buildSeatingLayout(52),
    maintenanceRecords: [
      {
        id: 'MNT-002-001', type: 'ROUTINE', status: 'COMPLETED',
        description: 'Full service – AC unit cleaning & oil change',
        scheduledDate: '2026-02-01', completedDate: '2026-02-01',
        technician: 'Pradeep Kumara', workshopName: 'Colombo Premier Workshop',
        cost: 32000, mileageAtService: 82000, partsReplaced: ['Engine Oil', 'AC Filter', 'Cabin Air Filter'],
      },
      {
        id: 'MNT-002-002', type: 'ROUTINE', status: 'SCHEDULED',
        description: 'Next full service',
        scheduledDate: '2026-05-01', workshopName: 'Colombo Premier Workshop',
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-002-001', routeName: 'Matara – Colombo', origin: 'Matara', destination: 'Colombo Fort',
        departureTime: '2026-02-21T05:30:00Z', arrivalTime: '2026-02-21T09:00:00Z',
        status: 'COMPLETED', passengerCount: 50, revenue: 50000, driverName: 'Chaminda Fernando',
      },
      {
        tripId: 'TRP-002-002', routeName: 'Colombo – Matara', origin: 'Colombo Fort', destination: 'Matara',
        departureTime: '2026-02-21T14:00:00Z',
        status: 'SCHEDULED', driverName: 'Chaminda Fernando',
      },
    ],
    location: {
      lastKnownLat: 6.9271, lastKnownLng: 79.8612, lastUpdated: '2026-02-21T09:10:00Z',
      currentSpeed: 0, heading: 0, address: 'Colombo Fort Bus Stand, Colombo 01', isOnline: true,
    },
    createdAt: '2021-07-01T00:00:00Z', updatedAt: '2026-02-21T09:10:00Z',
  },

  // ── Bus 3 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-003',
    plateNumber: 'ND 3421',
    ntcRegistrationNumber: 'NTC/SP/2019/003',
    model: 'Lanka Ashok Leyland',
    manufacturer: 'Ashok Leyland',
    year: 2019,
    serviceType: 'SL',
    status: 'INACTIVE',
    seatingCapacity: 54,
    standingCapacity: 20,
    color: 'Red & White',
    chassisNumber: 'AL2019ND3421CHS',
    engineNumber: 'AL2019ND3421ENG',
    insuranceNumber: 'INS/2024/ND3421',
    insuranceExpiryDate: '2026-01-31',
    revenueLicenseExpiryDate: '2025-12-31',
    lastServiceDate: '2025-11-20',
    nextServiceDate: '2026-02-20',
    mileage: 195600,
    facilities: {
      ac: false, wifi: false, cctv: false, gps: true, audioSystem: false,
      chargingPorts: false, wheelchairAccessible: false, airSuspension: false,
      toilet: false, tvScreens: false, readingLights: false, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    driver: {
      driverId: 'DRV-003', driverName: 'Pradeep Kumara',
      licenseNumber: 'LIC/SP/2016/033', contactPhone: '+94 77 678 9012',
      assignedSince: '2019-10-01',
    },
    routeAssignments: [{
      routeId: 'RT-003', routeName: 'Matara – Tangalle', routeNumber: '32A',
      origin: 'Matara', destination: 'Tangalle', permitNumber: 'PSP/SP/2023/003',
    }],
    seatingLayout: buildSeatingLayout(54),
    maintenanceRecords: [
      {
        id: 'MNT-003-001', type: 'REPAIR', status: 'IN_PROGRESS',
        description: 'Gearbox overhaul – bus temporarily taken out of service',
        scheduledDate: '2026-02-10',
        technician: 'Ranjith Bandara', workshopName: 'Lanka Bus Repairs – Matara',
        mileageAtService: 195600,
      },
      {
        id: 'MNT-003-002', type: 'ROUTINE', status: 'COMPLETED',
        description: 'Oil change & brake inspection',
        scheduledDate: '2025-11-20', completedDate: '2025-11-20',
        technician: 'Ranjith Bandara', workshopName: 'Lanka Bus Repairs – Matara',
        cost: 15000, mileageAtService: 194000,
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-003-001', routeName: 'Matara – Tangalle', origin: 'Matara', destination: 'Tangalle',
        departureTime: '2026-02-09T06:00:00Z', arrivalTime: '2026-02-09T07:30:00Z',
        status: 'COMPLETED', passengerCount: 40, revenue: 8000, driverName: 'Pradeep Kumara',
      },
    ],
    createdAt: '2019-10-01T00:00:00Z', updatedAt: '2026-02-10T08:00:00Z',
  },

  // ── Bus 4 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-004',
    plateNumber: 'ND 8765',
    ntcRegistrationNumber: 'NTC/SP/2022/004',
    model: 'Tata Starbus Ultra',
    manufacturer: 'Tata Motors',
    year: 2022,
    serviceType: 'SEMI_LUXURY',
    status: 'ACTIVE',
    seatingCapacity: 45,
    standingCapacity: 0,
    color: 'White & Blue',
    chassisNumber: 'TATA2022ND8765CHS',
    engineNumber: 'TATA2022ND8765ENG',
    insuranceNumber: 'INS/2025/ND8765',
    insuranceExpiryDate: '2026-06-30',
    revenueLicenseExpiryDate: '2026-06-30',
    lastServiceDate: '2026-01-20',
    nextServiceDate: '2026-04-20',
    mileage: 55200,
    facilities: {
      ac: true, wifi: false, cctv: true, gps: true, audioSystem: true,
      chargingPorts: true, wheelchairAccessible: true, airSuspension: true,
      toilet: false, tvScreens: false, readingLights: true, seatBelts: true,
      fireExtinguisher: true, emergencyExits: 3,
    },
    driver: {
      driverId: 'DRV-004', driverName: 'Dinesh Bandara',
      licenseNumber: 'LIC/WP/2019/044', contactPhone: '+94 77 890 1234',
      assignedSince: '2022-09-01',
    },
    conductor: {
      conductorId: 'CON-004', conductorName: 'Sampath Wijesinghe',
      contactPhone: '+94 77 890 4321', assignedSince: '2022-09-01',
    },
    routeAssignments: [{
      routeId: 'RT-004', routeName: 'Matara – Hambantota', routeNumber: '32B',
      origin: 'Matara', destination: 'Hambantota', permitNumber: 'PSP/SP/2024/004',
    }],
    seatingLayout: buildSeatingLayout(45),
    maintenanceRecords: [
      {
        id: 'MNT-004-001', type: 'ROUTINE', status: 'COMPLETED',
        description: 'Regular full service',
        scheduledDate: '2026-01-20', completedDate: '2026-01-20',
        technician: 'Nihal Mendis', workshopName: 'Hambantota Service Centre',
        cost: 28000, mileageAtService: 55000, partsReplaced: ['Engine Oil', 'Fuel Filter', 'Wiper Blades'],
      },
      {
        id: 'MNT-004-002', type: 'INSPECTION', status: 'SCHEDULED',
        description: 'Annual safety inspection',
        scheduledDate: '2026-06-01', workshopName: 'NTC Inspection Center – Hambantota',
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-004-001', routeName: 'Matara – Hambantota', origin: 'Matara', destination: 'Hambantota',
        departureTime: '2026-02-21T07:00:00Z', arrivalTime: '2026-02-21T09:00:00Z',
        status: 'COMPLETED', passengerCount: 38, revenue: 15200, driverName: 'Dinesh Bandara',
      },
      {
        tripId: 'TRP-004-002', routeName: 'Hambantota – Matara', origin: 'Hambantota', destination: 'Matara',
        departureTime: '2026-02-21T15:00:00Z',
        status: 'SCHEDULED', driverName: 'Dinesh Bandara',
      },
    ],
    location: {
      lastKnownLat: 6.1243, lastKnownLng: 81.1185, lastUpdated: '2026-02-21T09:15:00Z',
      currentSpeed: 0, heading: 0, address: 'Hambantota Bus Terminal, Hambantota', isOnline: true,
    },
    createdAt: '2022-09-01T00:00:00Z', updatedAt: '2026-02-21T09:15:00Z',
  },

  // ── Bus 5 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-005',
    plateNumber: 'ND 5234',
    ntcRegistrationNumber: 'NTC/WP/2018/005',
    model: 'Ashok Leyland Lynx',
    manufacturer: 'Ashok Leyland',
    year: 2018,
    serviceType: 'SL',
    status: 'MAINTENANCE',
    seatingCapacity: 54,
    standingCapacity: 20,
    color: 'Red & Cream',
    chassisNumber: 'AL2018ND5234CHS',
    engineNumber: 'AL2018ND5234ENG',
    insuranceNumber: 'INS/2025/ND5234',
    insuranceExpiryDate: '2026-08-31',
    revenueLicenseExpiryDate: '2026-08-31',
    lastServiceDate: '2026-02-15',
    nextServiceDate: '2026-05-15',
    mileage: 240800,
    facilities: {
      ac: false, wifi: false, cctv: true, gps: true, audioSystem: false,
      chargingPorts: false, wheelchairAccessible: false, airSuspension: false,
      toilet: false, tvScreens: false, readingLights: false, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    driver: {
      driverId: 'DRV-005', driverName: 'Thilaka Dissanayake',
      licenseNumber: 'LIC/WP/2015/055', contactPhone: '+94 77 012 3456',
      assignedSince: '2018-05-01',
    },
    routeAssignments: [{
      routeId: 'RT-005', routeName: 'Matara – Akuressa', routeNumber: '34',
      origin: 'Matara', destination: 'Akuressa', permitNumber: 'PSP/WP/2023/005',
    }],
    seatingLayout: buildSeatingLayout(54),
    maintenanceRecords: [
      {
        id: 'MNT-005-001', type: 'OVERHAUL', status: 'IN_PROGRESS',
        description: 'Engine overhaul due to high mileage',
        scheduledDate: '2026-02-15',
        technician: 'Anura Gunasinghe', workshopName: 'Lanka Bus Repairs – Galle',
        mileageAtService: 240800,
        notes: 'Estimated completion: 2 weeks',
      },
      {
        id: 'MNT-005-002', type: 'ROUTINE', status: 'COMPLETED',
        description: 'Oil & filter change before overhaul',
        scheduledDate: '2026-02-15', completedDate: '2026-02-15',
        technician: 'Anura Gunasinghe', workshopName: 'Lanka Bus Repairs – Galle',
        cost: 16000, mileageAtService: 240750,
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-005-001', routeName: 'Matara – Akuressa', origin: 'Matara', destination: 'Akuressa',
        departureTime: '2026-02-14T06:30:00Z', arrivalTime: '2026-02-14T07:30:00Z',
        status: 'COMPLETED', passengerCount: 46, revenue: 9200, driverName: 'Thilaka Dissanayake',
      },
    ],
    createdAt: '2018-05-01T00:00:00Z', updatedAt: '2026-02-15T08:00:00Z',
  },

  // ── Bus 6 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-006',
    plateNumber: 'ND 9876',
    ntcRegistrationNumber: 'NTC/WP/2023/006',
    model: 'Tata LPO 1618',
    manufacturer: 'Tata Motors',
    year: 2023,
    serviceType: 'LUXURY',
    status: 'ACTIVE',
    seatingCapacity: 41,
    standingCapacity: 0,
    color: 'Silver & Black',
    chassisNumber: 'TATA2023ND9876CHS',
    engineNumber: 'TATA2023ND9876ENG',
    insuranceNumber: 'INS/2025/ND9876',
    insuranceExpiryDate: '2026-12-31',
    revenueLicenseExpiryDate: '2026-12-31',
    lastServiceDate: '2026-02-10',
    nextServiceDate: '2026-05-10',
    mileage: 28400,
    facilities: {
      ac: true, wifi: true, cctv: true, gps: true, audioSystem: true,
      chargingPorts: true, wheelchairAccessible: true, airSuspension: true,
      toilet: true, tvScreens: true, readingLights: true, seatBelts: true,
      fireExtinguisher: true, emergencyExits: 3,
    },
    driver: {
      driverId: 'DRV-006', driverName: 'Sunil Rajapaksha',
      licenseNumber: 'LIC/WP/2020/066', contactPhone: '+94 77 234 5678',
      assignedSince: '2023-03-01',
    },
    conductor: {
      conductorId: 'CON-006', conductorName: 'Chandana Senanayake',
      contactPhone: '+94 77 234 8765', assignedSince: '2023-03-01',
    },
    routeAssignments: [{
      routeId: 'RT-006', routeName: 'Matara – Weligama (Express)', routeNumber: '32E',
      origin: 'Matara', destination: 'Weligama', permitNumber: 'PSP/WP/2024/006',
    }],
    seatingLayout: buildSeatingLayout(41),
    maintenanceRecords: [
      {
        id: 'MNT-006-001', type: 'ROUTINE', status: 'COMPLETED',
        description: 'First 25,000 km full service',
        scheduledDate: '2026-02-10', completedDate: '2026-02-10',
        technician: 'Prasad Weerasinghe', workshopName: 'Tata Authorized Service – Colombo',
        cost: 45000, mileageAtService: 28000, partsReplaced: ['Engine Oil', 'AC Gas Recharge', 'All Filters'],
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-006-001', routeName: 'Matara – Weligama', origin: 'Matara', destination: 'Weligama',
        departureTime: '2026-02-21T08:00:00Z', arrivalTime: '2026-02-21T08:45:00Z',
        status: 'COMPLETED', passengerCount: 36, revenue: 14400, driverName: 'Sunil Rajapaksha',
      },
      {
        tripId: 'TRP-006-002', routeName: 'Weligama – Matara', origin: 'Weligama', destination: 'Matara',
        departureTime: '2026-02-21T11:00:00Z', arrivalTime: '2026-02-21T11:45:00Z',
        status: 'COMPLETED', passengerCount: 40, revenue: 16000, driverName: 'Sunil Rajapaksha',
      },
      {
        tripId: 'TRP-006-003', routeName: 'Matara – Weligama', origin: 'Matara', destination: 'Weligama',
        departureTime: '2026-02-21T16:00:00Z',
        status: 'SCHEDULED', driverName: 'Sunil Rajapaksha',
      },
    ],
    location: {
      lastKnownLat: 5.9740, lastKnownLng: 80.4291, lastUpdated: '2026-02-21T11:50:00Z',
      currentSpeed: 0, heading: 0, address: 'Matara Bus Terminal, Matara', isOnline: true,
    },
    createdAt: '2023-03-01T00:00:00Z', updatedAt: '2026-02-21T11:50:00Z',
  },

  // ── Bus 7 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-007',
    plateNumber: 'ND 2468',
    ntcRegistrationNumber: 'NTC/SP/2020/007',
    model: 'Ashok Leyland Viking',
    manufacturer: 'Ashok Leyland',
    year: 2020,
    serviceType: 'SL',
    status: 'ACTIVE',
    seatingCapacity: 54,
    standingCapacity: 20,
    color: 'Red & White',
    chassisNumber: 'AL2020ND2468CHS',
    engineNumber: 'AL2020ND2468ENG',
    insuranceNumber: 'INS/2024/ND2468',
    insuranceExpiryDate: '2025-11-30',
    revenueLicenseExpiryDate: '2025-11-30',
    lastServiceDate: '2026-01-05',
    nextServiceDate: '2026-04-05',
    mileage: 138750,
    facilities: {
      ac: false, wifi: false, cctv: true, gps: true, audioSystem: false,
      chargingPorts: false, wheelchairAccessible: false, airSuspension: false,
      toilet: false, tvScreens: false, readingLights: false, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    driver: {
      driverId: 'DRV-007', driverName: 'Upul Mendis',
      licenseNumber: 'LIC/SP/2017/077', contactPhone: '+94 77 456 7890',
      assignedSince: '2020-08-01',
    },
    conductor: {
      conductorId: 'CON-007', conductorName: 'Gamini Wickramasinghe',
      contactPhone: '+94 77 456 0987', assignedSince: '2020-08-01',
    },
    routeAssignments: [{
      routeId: 'RT-007', routeName: 'Matara – Kataragama', routeNumber: '36',
      origin: 'Matara', destination: 'Kataragama', permitNumber: 'PSP/SP/2024/007',
    }],
    seatingLayout: buildSeatingLayout(54),
    maintenanceRecords: [
      {
        id: 'MNT-007-001', type: 'ROUTINE', status: 'COMPLETED',
        description: '3-month service – oil, filters, belts checked',
        scheduledDate: '2026-01-05', completedDate: '2026-01-05',
        technician: 'Kamal Herath', workshopName: 'Kataragama Road Workshop',
        cost: 17500, mileageAtService: 138500, partsReplaced: ['Engine Oil', 'Fan Belt'],
      },
      {
        id: 'MNT-007-002', type: 'ROUTINE', status: 'SCHEDULED',
        description: 'Next quarterly service',
        scheduledDate: '2026-04-05',
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-007-001', routeName: 'Matara – Kataragama', origin: 'Matara', destination: 'Kataragama',
        departureTime: '2026-02-21T05:00:00Z', arrivalTime: '2026-02-21T09:00:00Z',
        status: 'COMPLETED', passengerCount: 50, revenue: 25000, driverName: 'Upul Mendis',
      },
      {
        tripId: 'TRP-007-002', routeName: 'Kataragama – Matara', origin: 'Kataragama', destination: 'Matara',
        departureTime: '2026-02-21T17:00:00Z',
        status: 'SCHEDULED', driverName: 'Upul Mendis',
      },
    ],
    location: {
      lastKnownLat: 6.4110, lastKnownLng: 81.3306, lastUpdated: '2026-02-21T09:30:00Z',
      currentSpeed: 0, heading: 0, address: 'Kataragama Pilgrim Centre, Kataragama', isOnline: true,
    },
    createdAt: '2020-08-01T00:00:00Z', updatedAt: '2026-02-21T09:30:00Z',
  },

  // ── Bus 8 ─────────────────────────────────────────────────────────────────
  {
    id: 'BUS-008',
    plateNumber: 'ND 1357',
    ntcRegistrationNumber: 'NTC/WP/2017/008',
    model: 'Lanka Ashok Leyland',
    manufacturer: 'Ashok Leyland',
    year: 2017,
    serviceType: 'SL',
    status: 'INACTIVE',
    seatingCapacity: 54,
    standingCapacity: 20,
    color: 'Red & White',
    chassisNumber: 'AL2017ND1357CHS',
    engineNumber: 'AL2017ND1357ENG',
    insuranceNumber: 'INS/2024/ND1357',
    insuranceExpiryDate: '2025-09-30',
    revenueLicenseExpiryDate: '2025-09-30',
    lastServiceDate: '2025-09-15',
    nextServiceDate: '2025-12-15',
    mileage: 295000,
    facilities: {
      ac: false, wifi: false, cctv: false, gps: false, audioSystem: false,
      chargingPorts: false, wheelchairAccessible: false, airSuspension: false,
      toilet: false, tvScreens: false, readingLights: false, seatBelts: false,
      fireExtinguisher: true, emergencyExits: 2,
    },
    routeAssignments: [],
    seatingLayout: buildSeatingLayout(54),
    maintenanceRecords: [
      {
        id: 'MNT-008-001', type: 'INSPECTION', status: 'COMPLETED',
        description: 'Pre-retirement roadworthiness check',
        scheduledDate: '2025-09-15', completedDate: '2025-09-15',
        technician: 'NTC Inspector', workshopName: 'NTC Inspection Center – Matara',
        cost: 5000, mileageAtService: 294800,
        notes: 'Bus has exceeded recommended service life – decommission recommended',
      },
    ],
    recentTrips: [
      {
        tripId: 'TRP-008-001', routeName: 'Matara – Galle', origin: 'Matara', destination: 'Galle',
        departureTime: '2025-09-14T06:00:00Z', arrivalTime: '2025-09-14T07:30:00Z',
        status: 'COMPLETED', passengerCount: 42, revenue: 11340, driverName: 'N/A',
      },
    ],
    createdAt: '2017-04-01T00:00:00Z', updatedAt: '2025-09-15T12:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Service-like accessor functions (easy to swap with API calls later)
// ---------------------------------------------------------------------------

export interface GetBusesOptions {
  page?: number;
  size?: number;
  search?: string;
  status?: BusStatus | 'ALL';
  serviceType?: BusServiceType | 'ALL';
}

export interface PaginatedBuses {
  content: OperatorBus[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/** Return paginated & filtered list of buses for the operator. */
export async function getOperatorBuses(options: GetBusesOptions = {}): Promise<PaginatedBuses> {
  const { page = 0, size = 10, search = '', status = 'ALL', serviceType = 'ALL' } = options;

  let filtered = [...MOCK_BUSES];

  if (status && status !== 'ALL') {
    filtered = filtered.filter(b => b.status === status);
  }

  if (serviceType && serviceType !== 'ALL') {
    filtered = filtered.filter(b => b.serviceType === serviceType);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      b =>
        b.plateNumber.toLowerCase().includes(q) ||
        b.ntcRegistrationNumber.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        b.driver?.driverName.toLowerCase().includes(q) ||
        b.routeAssignments.some(r => r.routeName.toLowerCase().includes(q)),
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / size);
  const start = page * size;
  const content = filtered.slice(start, start + size);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 150));

  return { content, totalElements: total, totalPages, currentPage: page, pageSize: size };
}

/** Return a single bus by id. Throws if not found. */
export async function getOperatorBusById(id: string): Promise<OperatorBus> {
  await new Promise(resolve => setTimeout(resolve, 100));
  const bus = MOCK_BUSES.find(b => b.id === id);
  if (!bus) throw new Error(`Bus with id "${id}" not found.`);
  return bus;
}

/** Compute fleet-level statistics. */
export async function getFleetStatistics(): Promise<FleetStatistics> {
  await new Promise(resolve => setTimeout(resolve, 80));
  const total = MOCK_BUSES.length;
  const active = MOCK_BUSES.filter(b => b.status === 'ACTIVE').length;
  const inactive = MOCK_BUSES.filter(b => b.status === 'INACTIVE').length;
  const maintenance = MOCK_BUSES.filter(b => b.status === 'MAINTENANCE').length;
  const capacities = MOCK_BUSES.map(b => b.seatingCapacity);
  const totalCap = capacities.reduce((a, c) => a + c, 0);
  return {
    totalBuses: total,
    activeBuses: active,
    inactiveBuses: inactive,
    maintenanceBuses: maintenance,
    totalCapacity: totalCap,
    averageCapacity: total > 0 ? Math.round(totalCap / total) : 0,
  };
}
