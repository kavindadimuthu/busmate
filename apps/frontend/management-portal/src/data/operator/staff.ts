/**
 * Mock data for Operator Staff Management (Drivers & Conductors).
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

export type StaffRole = 'DRIVER' | 'CONDUCTOR';
export type StaffStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
export type ShiftStatus = 'AVAILABLE' | 'ASSIGNED' | 'OFF_DUTY';
export type LicenseType = 'HEAVY_VEHICLE' | 'LIGHT_VEHICLE' | 'COMMERCIAL';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface DriverLicense {
  licenseNumber: string;
  licenseType: LicenseType;
  issuedDate: string;    // ISO date
  expiryDate: string;    // ISO date
  issuedProvince: string;
}

export interface AssignedTrip {
  tripId: string;
  tripDate: string;         // ISO date
  routeNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  scheduledDeparture: string; // HH:mm
  scheduledArrival: string;   // HH:mm
  busRegistration: string;
  tripStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  partnerName: string;       // e.g. co-driver or conductor
  partnerRole: StaffRole;
}

export interface WeeklySchedule {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  shiftStart: string; // HH:mm
  shiftEnd: string;   // HH:mm
  isWorkingDay: boolean;
  routeNumber?: string;
  routeName?: string;
}

export interface PerformanceMetrics {
  totalTripsCompleted: number;
  onTimePercentage: number;
  averageRating: number;      // 1–5
  complaintsCount: number;
  commendationsCount: number;
  lastEvaluationDate: string; // ISO date
}

/** Base interface shared by both drivers and conductors */
export interface StaffMemberBase {
  id: string;
  employeeId: string;
  role: StaffRole;
  status: StaffStatus;
  shiftStatus: ShiftStatus;

  // Personal info
  fullName: string;
  gender: Gender;
  dateOfBirth: string;    // ISO date
  nic: string;
  avatarInitials: string; // e.g. "KP"

  // Contact
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;

  // Emergency contact
  emergencyContact: EmergencyContact;

  // Employment
  joinedDate: string;   // ISO date
  department: string;

  // Assignments
  assignedBusRegistration: string | null;
  assignedRoute: string | null;
  assignedRouteName: string | null;
  recentTrips: AssignedTrip[];
  weeklySchedule: WeeklySchedule[];
  performance: PerformanceMetrics;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Driver extends StaffMemberBase {
  role: 'DRIVER';
  license: DriverLicense;
  yearsOfExperience: number;
  totalKmDriven: number;
}

export interface Conductor extends StaffMemberBase {
  role: 'CONDUCTOR';
  certificateNumber: string;
  certificationExpiryDate: string; // ISO date
  languagesSpoken: string[];
}

export type StaffMember = Driver | Conductor;

// ---------------------------------------------------------------------------
// Stats / Filter types (replaces API responses)
// ---------------------------------------------------------------------------

export interface StaffStats {
  totalStaff: number;
  totalDrivers: number;
  totalConductors: number;
  activeStaff: number;
  availableNow: number;
  assignedNow: number;
  onLeave: number;
}

export interface StaffFilterOptions {
  statuses: StaffStatus[];
  shiftStatuses: ShiftStatus[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DRIVERS: Driver[] = [
  {
    id: 'DRV-001',
    employeeId: 'EMP-2021-001',
    role: 'DRIVER',
    status: 'ACTIVE',
    shiftStatus: 'ASSIGNED',
    fullName: 'Kamal Pradeep Wijesinghe',
    gender: 'MALE',
    dateOfBirth: '1985-03-12',
    nic: '850312345V',
    avatarInitials: 'KW',
    phone: '+94 71 234 5678',
    email: 'kamal.wijesinghe@busmate.lk',
    address: '45/B, Galle Road',
    city: 'Colombo',
    province: 'Western',
    emergencyContact: {
      name: 'Nirosha Wijesinghe',
      relationship: 'Wife',
      phone: '+94 77 987 6543',
    },
    joinedDate: '2021-04-15',
    department: 'Operations',
    license: {
      licenseNumber: 'LIC-B-123456',
      licenseType: 'HEAVY_VEHICLE',
      issuedDate: '2018-06-01',
      expiryDate: '2028-06-01',
      issuedProvince: 'Western',
    },
    yearsOfExperience: 12,
    totalKmDriven: 187_500,
    assignedBusRegistration: 'NTC-1023',
    assignedRoute: 'R-138',
    assignedRouteName: 'Colombo – Kandy',
    recentTrips: [
      {
        tripId: 'TRP-2026-0210-01',
        tripDate: '2026-02-10',
        routeNumber: 'R-138',
        routeName: 'Colombo – Kandy',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        scheduledDeparture: '06:00',
        scheduledArrival: '09:30',
        busRegistration: 'NTC-1023',
        tripStatus: 'COMPLETED',
        partnerName: 'Nuwan Senanayake',
        partnerRole: 'CONDUCTOR',
      },
      {
        tripId: 'TRP-2026-0211-01',
        tripDate: '2026-02-11',
        routeNumber: 'R-138',
        routeName: 'Colombo – Kandy',
        origin: 'Kandy',
        destination: 'Colombo Fort',
        scheduledDeparture: '14:00',
        scheduledArrival: '17:30',
        busRegistration: 'NTC-1023',
        tripStatus: 'COMPLETED',
        partnerName: 'Nuwan Senanayake',
        partnerRole: 'CONDUCTOR',
      },
      {
        tripId: 'TRP-2026-0221-01',
        tripDate: '2026-02-21',
        routeNumber: 'R-138',
        routeName: 'Colombo – Kandy',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        scheduledDeparture: '06:00',
        scheduledArrival: '09:30',
        busRegistration: 'NTC-1023',
        tripStatus: 'IN_PROGRESS',
        partnerName: 'Nuwan Senanayake',
        partnerRole: 'CONDUCTOR',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '05:30', shiftEnd: '13:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 1_240,
      onTimePercentage: 94.2,
      averageRating: 4.7,
      complaintsCount: 3,
      commendationsCount: 28,
      lastEvaluationDate: '2025-12-01',
    },
    createdAt: '2021-04-15T08:00:00Z',
    updatedAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'DRV-002',
    employeeId: 'EMP-2019-007',
    role: 'DRIVER',
    status: 'ACTIVE',
    shiftStatus: 'AVAILABLE',
    fullName: 'Suresh Bandara Rajapaksa',
    gender: 'MALE',
    dateOfBirth: '1979-08-25',
    nic: '790825678V',
    avatarInitials: 'SR',
    phone: '+94 77 456 7890',
    email: 'suresh.rajapaksa@busmate.lk',
    address: '12, Temple Road',
    city: 'Gampaha',
    province: 'Western',
    emergencyContact: {
      name: 'Chamari Rajapaksa',
      relationship: 'Wife',
      phone: '+94 71 111 2222',
    },
    joinedDate: '2019-09-01',
    department: 'Operations',
    license: {
      licenseNumber: 'LIC-B-987654',
      licenseType: 'HEAVY_VEHICLE',
      issuedDate: '2015-03-15',
      expiryDate: '2025-03-15',
      issuedProvince: 'Western',
    },
    yearsOfExperience: 18,
    totalKmDriven: 312_000,
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [
      {
        tripId: 'TRP-2026-0218-05',
        tripDate: '2026-02-18',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '07:30',
        scheduledArrival: '10:00',
        busRegistration: 'NTC-0874',
        tripStatus: 'COMPLETED',
        partnerName: 'Chaminda Perera',
        partnerRole: 'CONDUCTOR',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '07:00', shiftEnd: '13:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 2_180,
      onTimePercentage: 91.5,
      averageRating: 4.5,
      complaintsCount: 7,
      commendationsCount: 45,
      lastEvaluationDate: '2025-11-15',
    },
    createdAt: '2019-09-01T08:00:00Z',
    updatedAt: '2026-01-20T09:15:00Z',
  },
  {
    id: 'DRV-003',
    employeeId: 'EMP-2022-015',
    role: 'DRIVER',
    status: 'ON_LEAVE',
    shiftStatus: 'OFF_DUTY',
    fullName: 'Dinesh Kumar Jayawardena',
    gender: 'MALE',
    dateOfBirth: '1990-11-04',
    nic: '901104234V',
    avatarInitials: 'DJ',
    phone: '+94 76 333 4444',
    email: 'dinesh.jayawardena@busmate.lk',
    address: '78, Kandy Road',
    city: 'Kurunegala',
    province: 'North Western',
    emergencyContact: {
      name: 'Priya Jayawardena',
      relationship: 'Mother',
      phone: '+94 71 555 6666',
    },
    joinedDate: '2022-01-10',
    department: 'Operations',
    license: {
      licenseNumber: 'LIC-B-456123',
      licenseType: 'HEAVY_VEHICLE',
      issuedDate: '2019-08-20',
      expiryDate: '2029-08-20',
      issuedProvince: 'North Western',
    },
    yearsOfExperience: 6,
    totalKmDriven: 74_200,
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-312', routeName: 'Colombo – Kurunegala' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-312', routeName: 'Colombo – Kurunegala' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-312', routeName: 'Colombo – Kurunegala' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-312', routeName: 'Colombo – Kurunegala' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-312', routeName: 'Colombo – Kurunegala' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 420,
      onTimePercentage: 88.0,
      averageRating: 4.2,
      complaintsCount: 5,
      commendationsCount: 9,
      lastEvaluationDate: '2025-10-01',
    },
    createdAt: '2022-01-10T08:00:00Z',
    updatedAt: '2026-02-05T14:00:00Z',
  },
  {
    id: 'DRV-004',
    employeeId: 'EMP-2020-022',
    role: 'DRIVER',
    status: 'ACTIVE',
    shiftStatus: 'ASSIGNED',
    fullName: 'Nimal Sisira Kumara',
    gender: 'MALE',
    dateOfBirth: '1982-05-17',
    nic: '820517456V',
    avatarInitials: 'NK',
    phone: '+94 70 777 8888',
    email: 'nimal.kumara@busmate.lk',
    address: '34, Main Street',
    city: 'Matara',
    province: 'Southern',
    emergencyContact: {
      name: 'Sandya Kumara',
      relationship: 'Wife',
      phone: '+94 76 999 0000',
    },
    joinedDate: '2020-06-01',
    department: 'Operations',
    license: {
      licenseNumber: 'LIC-B-321789',
      licenseType: 'HEAVY_VEHICLE',
      issuedDate: '2016-09-10',
      expiryDate: '2026-09-10',
      issuedProvince: 'Southern',
    },
    yearsOfExperience: 15,
    totalKmDriven: 243_800,
    assignedBusRegistration: 'NTC-0567',
    assignedRoute: 'R-205',
    assignedRouteName: 'Colombo – Galle',
    recentTrips: [
      {
        tripId: 'TRP-2026-0219-03',
        tripDate: '2026-02-19',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '09:00',
        scheduledArrival: '11:30',
        busRegistration: 'NTC-0567',
        tripStatus: 'COMPLETED',
        partnerName: 'Amara De Silva',
        partnerRole: 'CONDUCTOR',
      },
      {
        tripId: 'TRP-2026-0221-03',
        tripDate: '2026-02-21',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '09:00',
        scheduledArrival: '11:30',
        busRegistration: 'NTC-0567',
        tripStatus: 'SCHEDULED',
        partnerName: 'Amara De Silva',
        partnerRole: 'CONDUCTOR',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '08:00', shiftEnd: '14:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 1_780,
      onTimePercentage: 93.1,
      averageRating: 4.6,
      complaintsCount: 4,
      commendationsCount: 32,
      lastEvaluationDate: '2025-12-10',
    },
    createdAt: '2020-06-01T08:00:00Z',
    updatedAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'DRV-005',
    employeeId: 'EMP-2023-030',
    role: 'DRIVER',
    status: 'ACTIVE',
    shiftStatus: 'AVAILABLE',
    fullName: 'Saman Lal Dissanayake',
    gender: 'MALE',
    dateOfBirth: '1993-02-28',
    nic: '930228789V',
    avatarInitials: 'SD',
    phone: '+94 72 100 2003',
    email: 'saman.dissanayake@busmate.lk',
    address: '22, New Town Road',
    city: 'Ratnapura',
    province: 'Sabaragamuwa',
    emergencyContact: {
      name: 'Gayan Dissanayake',
      relationship: 'Brother',
      phone: '+94 77 300 4005',
    },
    joinedDate: '2023-03-20',
    department: 'Operations',
    license: {
      licenseNumber: 'LIC-B-654987',
      licenseType: 'HEAVY_VEHICLE',
      issuedDate: '2021-11-05',
      expiryDate: '2031-11-05',
      issuedProvince: 'Sabaragamuwa',
    },
    yearsOfExperience: 4,
    totalKmDriven: 38_600,
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '10:00', shiftEnd: '22:00', isWorkingDay: true,  routeNumber: 'R-400', routeName: 'Colombo – Ratnapura' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '10:00', shiftEnd: '22:00', isWorkingDay: true,  routeNumber: 'R-400', routeName: 'Colombo – Ratnapura' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '10:00', shiftEnd: '22:00', isWorkingDay: true,  routeNumber: 'R-400', routeName: 'Colombo – Ratnapura' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '10:00', shiftEnd: '22:00', isWorkingDay: true,  routeNumber: 'R-400', routeName: 'Colombo – Ratnapura' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '10:00', shiftEnd: '22:00', isWorkingDay: true,  routeNumber: 'R-400', routeName: 'Colombo – Ratnapura' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 210,
      onTimePercentage: 86.7,
      averageRating: 4.1,
      complaintsCount: 2,
      commendationsCount: 5,
      lastEvaluationDate: '2025-09-01',
    },
    createdAt: '2023-03-20T08:00:00Z',
    updatedAt: '2026-01-15T16:00:00Z',
  },
];

const MOCK_CONDUCTORS: Conductor[] = [
  {
    id: 'CON-001',
    employeeId: 'EMP-2021-003',
    role: 'CONDUCTOR',
    status: 'ACTIVE',
    shiftStatus: 'ASSIGNED',
    fullName: 'Nuwan Pradeep Senanayake',
    gender: 'MALE',
    dateOfBirth: '1988-07-19',
    nic: '880719567V',
    avatarInitials: 'NS',
    phone: '+94 71 345 6789',
    email: 'nuwan.senanayake@busmate.lk',
    address: '88, Baseline Road',
    city: 'Colombo',
    province: 'Western',
    emergencyContact: {
      name: 'Lasantha Senanayake',
      relationship: 'Father',
      phone: '+94 77 222 3333',
    },
    joinedDate: '2021-05-01',
    department: 'Operations',
    certificateNumber: 'CERT-CON-2021-003',
    certificationExpiryDate: '2026-05-01',
    languagesSpoken: ['Sinhala', 'English'],
    assignedBusRegistration: 'NTC-1023',
    assignedRoute: 'R-138',
    assignedRouteName: 'Colombo – Kandy',
    recentTrips: [
      {
        tripId: 'TRP-2026-0210-01',
        tripDate: '2026-02-10',
        routeNumber: 'R-138',
        routeName: 'Colombo – Kandy',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        scheduledDeparture: '06:00',
        scheduledArrival: '09:30',
        busRegistration: 'NTC-1023',
        tripStatus: 'COMPLETED',
        partnerName: 'Kamal Wijesinghe',
        partnerRole: 'DRIVER',
      },
      {
        tripId: 'TRP-2026-0221-01',
        tripDate: '2026-02-21',
        routeNumber: 'R-138',
        routeName: 'Colombo – Kandy',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        scheduledDeparture: '06:00',
        scheduledArrival: '09:30',
        busRegistration: 'NTC-1023',
        tripStatus: 'IN_PROGRESS',
        partnerName: 'Kamal Wijesinghe',
        partnerRole: 'DRIVER',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '05:30', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '05:30', shiftEnd: '13:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 1_200,
      onTimePercentage: 95.0,
      averageRating: 4.8,
      complaintsCount: 1,
      commendationsCount: 35,
      lastEvaluationDate: '2025-12-01',
    },
    createdAt: '2021-05-01T08:00:00Z',
    updatedAt: '2026-02-01T10:30:00Z',
  },
  {
    id: 'CON-002',
    employeeId: 'EMP-2019-009',
    role: 'CONDUCTOR',
    status: 'ACTIVE',
    shiftStatus: 'AVAILABLE',
    fullName: 'Chaminda Prasad Perera',
    gender: 'MALE',
    dateOfBirth: '1983-12-03',
    nic: '831203890V',
    avatarInitials: 'CP',
    phone: '+94 77 456 1230',
    email: 'chaminda.perera@busmate.lk',
    address: '56, Galle Road',
    city: 'Kalutara',
    province: 'Western',
    emergencyContact: {
      name: 'Malkanthi Perera',
      relationship: 'Wife',
      phone: '+94 71 789 4560',
    },
    joinedDate: '2019-10-15',
    department: 'Operations',
    certificateNumber: 'CERT-CON-2019-009',
    certificationExpiryDate: '2025-10-15',
    languagesSpoken: ['Sinhala', 'Tamil', 'English'],
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [
      {
        tripId: 'TRP-2026-0218-05',
        tripDate: '2026-02-18',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '07:30',
        scheduledArrival: '10:00',
        busRegistration: 'NTC-0874',
        tripStatus: 'COMPLETED',
        partnerName: 'Suresh Rajapaksa',
        partnerRole: 'DRIVER',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '07:00', shiftEnd: '19:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '07:00', shiftEnd: '13:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 2_050,
      onTimePercentage: 92.4,
      averageRating: 4.5,
      complaintsCount: 6,
      commendationsCount: 40,
      lastEvaluationDate: '2025-11-20',
    },
    createdAt: '2019-10-15T08:00:00Z',
    updatedAt: '2026-01-25T09:00:00Z',
  },
  {
    id: 'CON-003',
    employeeId: 'EMP-2022-018',
    role: 'CONDUCTOR',
    status: 'ACTIVE',
    shiftStatus: 'ASSIGNED',
    fullName: 'Amara Shyamali De Silva',
    gender: 'FEMALE',
    dateOfBirth: '1995-04-10',
    nic: '956104321V',
    avatarInitials: 'AD',
    phone: '+94 70 234 5670',
    email: 'amara.desilva@busmate.lk',
    address: '11, Lake Road',
    city: 'Galle',
    province: 'Southern',
    emergencyContact: {
      name: 'Ranjith De Silva',
      relationship: 'Father',
      phone: '+94 76 888 9990',
    },
    joinedDate: '2022-03-01',
    department: 'Operations',
    certificateNumber: 'CERT-CON-2022-018',
    certificationExpiryDate: '2027-03-01',
    languagesSpoken: ['Sinhala', 'English'],
    assignedBusRegistration: 'NTC-0567',
    assignedRoute: 'R-205',
    assignedRouteName: 'Colombo – Galle',
    recentTrips: [
      {
        tripId: 'TRP-2026-0219-03',
        tripDate: '2026-02-19',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '09:00',
        scheduledArrival: '11:30',
        busRegistration: 'NTC-0567',
        tripStatus: 'COMPLETED',
        partnerName: 'Nimal Kumara',
        partnerRole: 'DRIVER',
      },
      {
        tripId: 'TRP-2026-0221-03',
        tripDate: '2026-02-21',
        routeNumber: 'R-205',
        routeName: 'Colombo – Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        scheduledDeparture: '09:00',
        scheduledArrival: '11:30',
        busRegistration: 'NTC-0567',
        tripStatus: 'SCHEDULED',
        partnerName: 'Nimal Kumara',
        partnerRole: 'DRIVER',
      },
    ],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '08:00', shiftEnd: '20:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '08:00', shiftEnd: '14:00', isWorkingDay: true,  routeNumber: 'R-205', routeName: 'Colombo – Galle' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 580,
      onTimePercentage: 90.3,
      averageRating: 4.4,
      complaintsCount: 3,
      commendationsCount: 14,
      lastEvaluationDate: '2025-10-15',
    },
    createdAt: '2022-03-01T08:00:00Z',
    updatedAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'CON-004',
    employeeId: 'EMP-2020-025',
    role: 'CONDUCTOR',
    status: 'INACTIVE',
    shiftStatus: 'OFF_DUTY',
    fullName: 'Ranjith Priyankara Fernando',
    gender: 'MALE',
    dateOfBirth: '1980-09-22',
    nic: '800922123V',
    avatarInitials: 'RF',
    phone: '+94 71 600 7008',
    email: 'ranjith.fernando@busmate.lk',
    address: '90, Railway Avenue',
    city: 'Moratuwa',
    province: 'Western',
    emergencyContact: {
      name: 'Kumari Fernando',
      relationship: 'Wife',
      phone: '+94 77 400 5006',
    },
    joinedDate: '2020-02-15',
    department: 'Operations',
    certificateNumber: 'CERT-CON-2020-025',
    certificationExpiryDate: '2025-02-15',
    languagesSpoken: ['Sinhala'],
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '', shiftEnd: '', isWorkingDay: false },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '', shiftEnd: '', isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 1_100,
      onTimePercentage: 89.5,
      averageRating: 4.0,
      complaintsCount: 9,
      commendationsCount: 18,
      lastEvaluationDate: '2024-08-01',
    },
    createdAt: '2020-02-15T08:00:00Z',
    updatedAt: '2025-09-01T10:00:00Z',
  },
  {
    id: 'CON-005',
    employeeId: 'EMP-2023-040',
    role: 'CONDUCTOR',
    status: 'ACTIVE',
    shiftStatus: 'AVAILABLE',
    fullName: 'Sachini Pavithra Rathnayake',
    gender: 'FEMALE',
    dateOfBirth: '1998-01-15',
    nic: '981145678V',
    avatarInitials: 'SR',
    phone: '+94 76 111 2220',
    email: 'sachini.rathnayake@busmate.lk',
    address: '5, University Road',
    city: 'Kandy',
    province: 'Central',
    emergencyContact: {
      name: 'Priyanka Rathnayake',
      relationship: 'Mother',
      phone: '+94 70 333 4440',
    },
    joinedDate: '2023-07-01',
    department: 'Operations',
    certificateNumber: 'CERT-CON-2023-040',
    certificationExpiryDate: '2028-07-01',
    languagesSpoken: ['Sinhala', 'Tamil', 'English'],
    assignedBusRegistration: null,
    assignedRoute: null,
    assignedRouteName: null,
    recentTrips: [],
    weeklySchedule: [
      { dayOfWeek: 1, dayName: 'Monday',    shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 2, dayName: 'Tuesday',   shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 3, dayName: 'Wednesday', shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 4, dayName: 'Thursday',  shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
      { dayOfWeek: 5, dayName: 'Friday',    shiftStart: '06:00', shiftEnd: '18:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 6, dayName: 'Saturday',  shiftStart: '06:00', shiftEnd: '13:00', isWorkingDay: true,  routeNumber: 'R-138', routeName: 'Colombo – Kandy' },
      { dayOfWeek: 0, dayName: 'Sunday',    shiftStart: '',       shiftEnd: '',       isWorkingDay: false },
    ],
    performance: {
      totalTripsCompleted: 180,
      onTimePercentage: 87.8,
      averageRating: 4.3,
      complaintsCount: 1,
      commendationsCount: 6,
      lastEvaluationDate: '2025-08-01',
    },
    createdAt: '2023-07-01T08:00:00Z',
    updatedAt: '2026-01-10T09:00:00Z',
  },
];

// Combined list
const ALL_STAFF: StaffMember[] = [...MOCK_DRIVERS, ...MOCK_CONDUCTORS];

// ---------------------------------------------------------------------------
// Service functions (replace with real API calls when backend is ready)
// ---------------------------------------------------------------------------

/** Simulate async network delay */
const delay = (ms = 300) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Fetch all staff members (drivers + conductors) */
export async function getAllStaff(): Promise<StaffMember[]> {
  await delay();
  return ALL_STAFF;
}

/** Fetch only drivers */
export async function getDrivers(): Promise<Driver[]> {
  await delay();
  return MOCK_DRIVERS;
}

/** Fetch only conductors */
export async function getConductors(): Promise<Conductor[]> {
  await delay();
  return MOCK_CONDUCTORS;
}

/** Fetch a single staff member by ID */
export async function getStaffById(id: string): Promise<StaffMember | null> {
  await delay();
  return ALL_STAFF.find(s => s.id === id) ?? null;
}

/** Compute aggregate stats */
export async function getStaffStats(): Promise<StaffStats> {
  await delay();
  const total    = ALL_STAFF.length;
  const drivers  = MOCK_DRIVERS.length;
  const conductors = MOCK_CONDUCTORS.length;
  const active   = ALL_STAFF.filter(s => s.status === 'ACTIVE').length;
  const available = ALL_STAFF.filter(s => s.shiftStatus === 'AVAILABLE').length;
  const assigned  = ALL_STAFF.filter(s => s.shiftStatus === 'ASSIGNED').length;
  const onLeave   = ALL_STAFF.filter(s => s.status === 'ON_LEAVE').length;

  return { totalStaff: total, totalDrivers: drivers, totalConductors: conductors,
           activeStaff: active, availableNow: available, assignedNow: assigned, onLeave };
}
