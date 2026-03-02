// User management data layer for admin portal
// Replace these functions with API calls when backend is ready

// --- Types ---

export type UserType = 'mot' | 'timekeeper' | 'operator' | 'conductor' | 'driver' | 'passenger';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserBase {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nic: string;
  address: string;
  userType: UserType;
  status: UserStatus;
  createdAt: string;
  lastLogin: string | null;
  avatar?: string;
  notes?: string;
}

export interface MOTUser extends UserBase {
  userType: 'mot';
  employeeId: string;
  department: string;
  designation: string;
  officeLocation: string;
  securityClearance: 'basic' | 'standard' | 'enhanced' | 'top-secret';
  permissions: string[];
}

export interface TimekeeperUser extends UserBase {
  userType: 'timekeeper';
  employeeId: string;
  assignedTerminal: string;
  assignedRoute: string;
  shift: string;
  supervisor: string;
}

export interface OperatorUser extends UserBase {
  userType: 'operator';
  companyName: string;
  registrationNumber: string;
  operatorLicense: string;
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
}

export interface ConductorUser extends UserBase {
  userType: 'conductor';
  employeeId: string;
  assignedBus: string;
  assignedRoute: string;
  operatorId: string;
  operatorName: string;
  licenseNumber: string;
  totalTrips: number;
  rating: number;
}

export interface DriverUser extends UserBase {
  userType: 'driver';
  employeeId: string;
  drivingLicenseNumber: string;
  drivingLicenseExpiry: string;
  vehicleClasses: string[];
  assignedBus: string;
  assignedRoute: string;
  operatorId: string;
  operatorName: string;
  totalTrips: number;
  rating: number;
}

export interface PassengerUser extends UserBase {
  userType: 'passenger';
  totalTrips: number;
  totalSpent: number;
  walletBalance: number;
  savedRoutes: string[];
  preferredPayment: 'cash' | 'card' | 'wallet';
}

export type SystemUser = MOTUser | TimekeeperUser | OperatorUser | ConductorUser | DriverUser | PassengerUser;

export interface UserStatsData {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  byType: Record<UserType, number>;
}

export interface UserFiltersState {
  search: string;
  userType: UserType | 'all';
  status: UserStatus | 'all';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// --- Config Maps ---

export const USER_TYPE_CONFIG: Record<UserType, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  mot: { label: 'MOT Officer', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', icon: 'Shield' },
  timekeeper: { label: 'Timekeeper', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', icon: 'Clock' },
  operator: { label: 'Operator', color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: 'Truck' },
  conductor: { label: 'Conductor', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: 'CircleDot' },
  driver: { label: 'Driver', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: 'Car' },
  passenger: { label: 'Passenger', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: 'Users' },
};

export const USER_STATUS_CONFIG: Record<UserStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  active: { label: 'Active', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', dotColor: 'bg-emerald-500' },
  inactive: { label: 'Inactive', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', dotColor: 'bg-gray-400' },
  suspended: { label: 'Suspended', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', dotColor: 'bg-red-500' },
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', dotColor: 'bg-amber-500' },
};

// --- Mock Data ---

const mockUsers: SystemUser[] = [
  // MOT Officers (3)
  {
    id: 'USR-001', firstName: 'Sunimal', lastName: 'Nimantha', email: 'sunimal.nimantha@mot.lk',
    phone: '+94 76 456 7890', nic: '198523456789', address: '42 Galle Road, Colombo 03',
    userType: 'mot', status: 'active', createdAt: '2023-08-15', lastLogin: '2025-03-20T08:30:00Z',
    employeeId: 'MOT-0045', department: 'Route Management', designation: 'Senior Transport Officer',
    officeLocation: 'Ministry of Transport - Colombo', securityClearance: 'enhanced',
    permissions: ['route_management', 'schedule_management', 'operator_management', 'analytics'],
    notes: 'Senior officer handling Western Province route approvals.',
  },
  {
    id: 'USR-002', firstName: 'Ruwan', lastName: 'Jayawardena', email: 'ruwan.j@mot.lk',
    phone: '+94 77 890 1234', nic: '199012345678', address: '15 Temple Road, Kandy',
    userType: 'mot', status: 'active', createdAt: '2023-10-01', lastLogin: '2025-03-19T14:15:00Z',
    employeeId: 'MOT-0078', department: 'Permits & Licensing', designation: 'Transport Licensing Officer',
    officeLocation: 'Ministry of Transport - Kandy', securityClearance: 'standard',
    permissions: ['permits', 'inspections', 'analytics'],
  },
  {
    id: 'USR-003', firstName: 'Dilani', lastName: 'Wijesekara', email: 'dilani.w@mot.lk',
    phone: '+94 71 345 6789', nic: '198845678901', address: '8 Lake House, Galle',
    userType: 'mot', status: 'inactive', createdAt: '2022-05-20', lastLogin: '2024-12-10T09:00:00Z',
    employeeId: 'MOT-0012', department: 'System Administration', designation: 'IT Administrator',
    officeLocation: 'Ministry of Transport - Colombo', securityClearance: 'top-secret',
    permissions: ['user_management', 'system_settings', 'analytics', 'route_management', 'permits'],
    notes: 'On extended leave.',
  },
  // Timekeepers (3)
  {
    id: 'USR-004', firstName: 'Chaminda', lastName: 'Bandara', email: 'chaminda.p@busmate.lk',
    phone: '+94 77 345 6789', nic: '199234567890', address: '22 Station Road, Colombo 10',
    userType: 'timekeeper', status: 'active', createdAt: '2024-02-01', lastLogin: '2025-03-20T06:00:00Z',
    employeeId: 'TK-0123', assignedTerminal: 'Colombo Fort Bus Terminal',
    assignedRoute: 'Colombo - Kandy (Route 1)', shift: '6:00 AM - 2:00 PM', supervisor: 'Sunimal Nimantha',
  },
  {
    id: 'USR-005', firstName: 'Nadeeka', lastName: 'Fernando', email: 'nadeeka.f@busmate.lk',
    phone: '+94 75 456 7890', nic: '199456789012', address: '10 Main Street, Galle',
    userType: 'timekeeper', status: 'active', createdAt: '2024-01-15', lastLogin: '2025-03-20T05:45:00Z',
    employeeId: 'TK-0124', assignedTerminal: 'Galle Central Bus Stand',
    assignedRoute: 'Galle - Matara (Route 32)', shift: '2:00 PM - 10:00 PM', supervisor: 'Ruwan Jayawardena',
  },
  {
    id: 'USR-006', firstName: 'Saman', lastName: 'Kumara', email: 'saman.k@busmate.lk',
    phone: '+94 72 567 8901', nic: '198967890123', address: '5 Hill Street, Kandy',
    userType: 'timekeeper', status: 'suspended', createdAt: '2023-09-10', lastLogin: '2025-02-15T07:00:00Z',
    employeeId: 'TK-0089', assignedTerminal: 'Kandy Bus Terminal',
    assignedRoute: 'Kandy - Nuwara Eliya (Route 15)', shift: '6:00 AM - 2:00 PM', supervisor: 'Sunimal Nimantha',
    notes: 'Suspended due to repeated absence without notice.',
  },
  // Operators (3)
  {
    id: 'USR-007', firstName: 'Lanka', lastName: 'Express', email: 'lankaxpress.transport@yahoo.com',
    phone: '+94 11 234 5678', nic: 'PV-12345', address: '100 Baseline Road, Colombo 09',
    userType: 'operator', status: 'active', createdAt: '2023-06-10', lastLogin: '2025-03-20T10:00:00Z',
    companyName: 'Lanka Express Transport (Pvt) Ltd', registrationNumber: 'PV-12345',
    operatorLicense: 'OL-2023-0456', totalBuses: 25, activeBuses: 20, totalRoutes: 8,
  },
  {
    id: 'USR-008', firstName: 'Sunethra', lastName: 'Bus', email: 'sunethra.bus@gmail.com',
    phone: '+94 11 789 0123', nic: 'PV-67890', address: '45 Kandy Road, Kadawatha',
    userType: 'operator', status: 'active', createdAt: '2022-05-20', lastLogin: '2025-03-19T16:00:00Z',
    companyName: 'Sunethra Bus Service', registrationNumber: 'PV-67890',
    operatorLicense: 'OL-2022-0789', totalBuses: 12, activeBuses: 10, totalRoutes: 4,
  },
  {
    id: 'USR-009', firstName: 'Isuru', lastName: 'Transport', email: 'info@isurutransport.lk',
    phone: '+94 37 234 5678', nic: 'PV-11223', address: '78 Negombo Road, Ja-Ela',
    userType: 'operator', status: 'pending', createdAt: '2025-03-01', lastLogin: null,
    companyName: 'Isuru Transport Services', registrationNumber: 'PV-11223',
    operatorLicense: 'OL-2025-0012', totalBuses: 5, activeBuses: 0, totalRoutes: 0,
    notes: 'New registration pending document verification.',
  },
  // Conductors (3)
  {
    id: 'USR-010', firstName: 'Pradeep', lastName: 'Kumara Silva', email: 'kumara.silva@slbus.lk',
    phone: '+94 72 234 5678', nic: '199178901234', address: '30 Bus Depot Lane, Kaduwela',
    userType: 'conductor', status: 'active', createdAt: '2023-11-20', lastLogin: '2025-03-20T05:30:00Z',
    employeeId: 'COND-2345', assignedBus: 'NB-1234', assignedRoute: 'Colombo - Kandy',
    operatorId: 'USR-007', operatorName: 'Lanka Express Transport', licenseNumber: 'CLIC-2023-0456',
    totalTrips: 1250, rating: 4.5,
  },
  {
    id: 'USR-011', firstName: 'Asanka', lastName: 'Priyadarshana', email: 'asanka.p@slbus.lk',
    phone: '+94 76 345 6789', nic: '199389012345', address: '12 Lake Road, Matara',
    userType: 'conductor', status: 'active', createdAt: '2024-04-10', lastLogin: '2025-03-20T06:15:00Z',
    employeeId: 'COND-2678', assignedBus: 'SB-5678', assignedRoute: 'Galle - Matara',
    operatorId: 'USR-008', operatorName: 'Sunethra Bus Service', licenseNumber: 'CLIC-2024-0123',
    totalTrips: 340, rating: 4.8,
  },
  {
    id: 'USR-012', firstName: 'Kamal', lastName: 'Rathnayake', email: 'kamal.r@slbus.lk',
    phone: '+94 71 901 2345', nic: '198590123456', address: '55 Victoria Drive, Kandy',
    userType: 'conductor', status: 'inactive', createdAt: '2023-01-10', lastLogin: '2024-11-05T08:00:00Z',
    employeeId: 'COND-1890', assignedBus: '', assignedRoute: '',
    operatorId: 'USR-007', operatorName: 'Lanka Express Transport', licenseNumber: 'CLIC-2022-0890',
    totalTrips: 2100, rating: 3.9,
    notes: 'Resigned from service.',
  },
  // Drivers (3)
  {
    id: 'USR-013', firstName: 'Mahinda', lastName: 'Perera', email: 'mahinda.p@slbus.lk',
    phone: '+94 77 012 3456', nic: '198701234567', address: '8 Driver Quarters, Colombo 13',
    userType: 'driver', status: 'active', createdAt: '2023-03-15', lastLogin: '2025-03-20T05:00:00Z',
    employeeId: 'DRV-1001', drivingLicenseNumber: 'DL-45678-2020', drivingLicenseExpiry: '2026-05-15',
    vehicleClasses: ['B', 'C', 'D'], assignedBus: 'NB-1234', assignedRoute: 'Colombo - Kandy',
    operatorId: 'USR-007', operatorName: 'Lanka Express Transport', totalTrips: 1800, rating: 4.7,
  },
  {
    id: 'USR-014', firstName: 'Lasantha', lastName: 'Wickramasinghe', email: 'lasantha.w@slbus.lk',
    phone: '+94 78 123 4567', nic: '199112345678', address: '20 Gregory Road, Nuwara Eliya',
    userType: 'driver', status: 'active', createdAt: '2024-01-05', lastLogin: '2025-03-19T18:30:00Z',
    employeeId: 'DRV-1045', drivingLicenseNumber: 'DL-89012-2022', drivingLicenseExpiry: '2027-01-20',
    vehicleClasses: ['B', 'C', 'D', 'E'], assignedBus: 'SB-5678', assignedRoute: 'Galle - Matara',
    operatorId: 'USR-008', operatorName: 'Sunethra Bus Service', totalTrips: 560, rating: 4.9,
  },
  {
    id: 'USR-015', firstName: 'Dinesh', lastName: 'Gamage', email: 'dinesh.g@slbus.lk',
    phone: '+94 75 234 5678', nic: '198823456789', address: '3 Depot Road, Kurunegala',
    userType: 'driver', status: 'suspended', createdAt: '2022-11-01', lastLogin: '2025-01-30T07:00:00Z',
    employeeId: 'DRV-0890', drivingLicenseNumber: 'DL-34567-2019', drivingLicenseExpiry: '2025-06-30',
    vehicleClasses: ['B', 'D'], assignedBus: '', assignedRoute: '',
    operatorId: 'USR-007', operatorName: 'Lanka Express Transport', totalTrips: 3200, rating: 3.2,
    notes: 'Suspended due to traffic violation. License expiry approaching.',
  },
  // Passengers (5)
  {
    id: 'USR-016', firstName: 'Nimal', lastName: 'Perera', email: 'nimal.perera@gmail.com',
    phone: '+94 71 123 4567', nic: '199534567890', address: '10 Park Street, Colombo 02',
    userType: 'passenger', status: 'active', createdAt: '2024-01-15', lastLogin: '2025-03-20T12:00:00Z',
    totalTrips: 45, totalSpent: 8500, walletBalance: 1200, savedRoutes: ['Colombo - Kandy', 'Colombo - Galle'],
    preferredPayment: 'wallet',
  },
  {
    id: 'USR-017', firstName: 'Anura', lastName: 'Dissanayake', email: 'anura.d@gmail.com',
    phone: '+94 78 567 8901', nic: '198845678901', address: '22 Flower Road, Colombo 07',
    userType: 'passenger', status: 'active', createdAt: '2024-03-01', lastLogin: '2025-03-18T15:30:00Z',
    totalTrips: 12, totalSpent: 2400, walletBalance: 500, savedRoutes: ['Colombo - Galle'],
    preferredPayment: 'cash',
  },
  {
    id: 'USR-018', firstName: 'Malini', lastName: 'Fernando', email: 'malini.fernando@yahoo.com',
    phone: '+94 75 678 9012', nic: '199756789012', address: '5 Temple Lane, Matara',
    userType: 'passenger', status: 'pending', createdAt: '2025-03-15', lastLogin: null,
    totalTrips: 0, totalSpent: 0, walletBalance: 0, savedRoutes: [],
    preferredPayment: 'cash',
    notes: 'Pending email verification.',
  },
  {
    id: 'USR-019', firstName: 'Thilaka', lastName: 'Rajapakse', email: 'thilaka.r@gmail.com',
    phone: '+94 76 789 0123', nic: '200067890123', address: '18 Lotus Place, Gampaha',
    userType: 'passenger', status: 'active', createdAt: '2024-06-20', lastLogin: '2025-03-20T09:45:00Z',
    totalTrips: 78, totalSpent: 15600, walletBalance: 3000, savedRoutes: ['Colombo - Kandy', 'Kandy - Nuwara Eliya', 'Colombo - Negombo'],
    preferredPayment: 'card',
  },
  {
    id: 'USR-020', firstName: 'Sanduni', lastName: 'Abeysekara', email: 'sanduni.a@outlook.com',
    phone: '+94 77 890 1234', nic: '199878901234', address: '7 Sea View Road, Negombo',
    userType: 'passenger', status: 'suspended', createdAt: '2024-02-10', lastLogin: '2025-02-28T11:00:00Z',
    totalTrips: 23, totalSpent: 4600, walletBalance: 0, savedRoutes: ['Negombo - Colombo'],
    preferredPayment: 'wallet',
    notes: 'Account flagged for suspicious activity.',
  },
];

// --- Utility Functions ---

export function getUserDisplayName(user: SystemUser): string {
  if (user.userType === 'operator') {
    return (user as OperatorUser).companyName;
  }
  return `${user.firstName} ${user.lastName}`;
}

export function formatUserDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

// --- API Functions ---

export function getAllUsers(): SystemUser[] {
  return [...mockUsers];
}

export function getUserById(id: string): SystemUser | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getFilteredUsers(filters: UserFiltersState): SystemUser[] {
  let filtered = [...mockUsers];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter((u) => {
      const displayName = getUserDisplayName(u).toLowerCase();
      return (
        displayName.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.nic.toLowerCase().includes(q)
      );
    });
  }

  if (filters.userType !== 'all') {
    filtered = filtered.filter((u) => u.userType === filters.userType);
  }

  if (filters.status !== 'all') {
    filtered = filtered.filter((u) => u.status === filters.status);
  }

  filtered.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortBy) {
      case 'name':
        cmp = getUserDisplayName(a).localeCompare(getUserDisplayName(b));
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email);
        break;
      case 'userType':
        cmp = a.userType.localeCompare(b.userType);
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'lastLogin':
        cmp = (a.lastLogin || '').localeCompare(b.lastLogin || '');
        break;
      case 'createdAt':
      default:
        cmp = a.createdAt.localeCompare(b.createdAt);
        break;
    }
    return filters.sortOrder === 'desc' ? -cmp : cmp;
  });

  return filtered;
}

export function getUserStatsData(): UserStatsData {
  const users = mockUsers;
  const byType: Record<UserType, number> = { mot: 0, timekeeper: 0, operator: 0, conductor: 0, driver: 0, passenger: 0 };
  let active = 0, inactive = 0, suspended = 0, pending = 0;

  users.forEach((u) => {
    byType[u.userType]++;
    if (u.status === 'active') active++;
    else if (u.status === 'inactive') inactive++;
    else if (u.status === 'suspended') suspended++;
    else if (u.status === 'pending') pending++;
  });

  return { total: users.length, active, inactive, suspended, pending, byType };
}

export async function updateUser(id: string, data: Partial<SystemUser>): Promise<SystemUser | null> {
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  const updated = { ...mockUsers[idx], ...data } as SystemUser;
  mockUsers[idx] = updated;
  return updated;
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<boolean> {
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  (mockUsers[idx] as SystemUser).status = status;
  return true;
}

export async function deleteUserById(id: string): Promise<boolean> {
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  mockUsers.splice(idx, 1);
  return true;
}

export async function createUser(data: Partial<SystemUser>): Promise<SystemUser> {
  const newId = `USR-${String(mockUsers.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString().split('T')[0];
  const newUser = {
    ...data,
    id: newId,
    createdAt: now,
    lastLogin: null,
    status: data.status || 'pending',
  } as SystemUser;
  mockUsers.push(newUser);
  return newUser;
}

// --- Legacy compatibility exports ---

export function getUsers(): SystemUser[] {
  return getAllUsers();
}

export function getUserStats(): UserStatsData {
  return getUserStatsData();
}

export async function deleteUser(id: string): Promise<boolean> {
  return deleteUserById(id);
}

export async function createMOTUser(data: Partial<MOTUser>): Promise<SystemUser> {
  return createUser({ ...data, userType: 'mot' });
}

// Legacy profile types (kept for backward compatibility)
export interface PassengerProfile { id: string; name: string; email: string; phone: string; status: string; joinedDate: string; lastLogin: string; totalTrips: number; totalSpent: string; savedRoutes: string[]; recentTrips: { id: string; route: string; date: string; fare: string; }[]; }
export interface ConductorProfile { id: string; name: string; email: string; phone: string; status: string; employeeId: string; joinedDate: string; lastLogin: string; assignedBus: string; assignedRoute: string; totalTrips: number; rating: number; }
export interface FleetProfile { id: string; name: string; email: string; phone: string; status: string; registrationNumber: string; joinedDate: string; lastLogin: string; totalBuses: number; activeBuses: number; totalRoutes: number; buses: { id: string; registrationNumber: string; type: string; status: string; route: string; }[]; }
export interface TimekeeperProfile { id: string; name: string; email: string; phone: string; status: string; employeeId: string; joinedDate: string; lastLogin: string; assignedStop: string; shift: string; busesProcessed: number; }
export interface MOTProfile { id: string; name: string; email: string; phone: string; status: string; officerId: string; department: string; joinedDate: string; lastLogin: string; permissions: string[]; }

export function getPassengerProfile(_id: string): PassengerProfile { return {} as PassengerProfile; }
export function getConductorProfile(_id: string): ConductorProfile { return {} as ConductorProfile; }
export function getFleetProfile(_id: string): FleetProfile { return {} as FleetProfile; }
export function getTimekeeperProfile(_id: string): TimekeeperProfile { return {} as TimekeeperProfile; }
export function getMOTProfile(_id: string): MOTProfile { return {} as MOTProfile; }

export const mockData = {
  users: mockUsers,
};
