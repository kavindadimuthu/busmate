/**
 * Mock data for Operator Passenger Service Permits.
 *
 * This file provides static mock data for the operator portal until backend APIs are ready.
 * When backend APIs are implemented, replace the exported functions below
 * with real API calls while keeping the same return types / interfaces.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PermitStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'EXPIRED';
export type PermitType = 'REGULAR' | 'SPECIAL' | 'TEMPORARY';

export interface OperatorPermit {
  id: string;
  permitNumber: string;
  operatorId: string;
  operatorName: string;
  routeGroupId: string;
  routeGroupName: string;
  routeGroupCode: string;
  permitType: PermitType;
  status: PermitStatus;
  issueDate: string;       // ISO date string
  expiryDate: string;      // ISO date string
  maximumBusAssigned: number;
  issuedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorPermitStatistics {
  totalPermits: number;
  activePermits: number;
  inactivePermits: number;
  pendingPermits: number;
  expiredPermits: number;
  expiringSoonPermits: number; // expiring within 30 days
}

export interface OperatorPermitFilterOptions {
  statuses: PermitStatus[];
  permitTypes: PermitType[];
}

export interface RouteInfo {
  id: string;
  routeNumber: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
}

export interface OperatorPermitDetail extends OperatorPermit {
  routes: RouteInfo[];
  contactPerson: string;
  contactPhone: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const OPERATOR_ID = 'OP-2024-001'; // Replace with actual logged-in operator id

const MOCK_PERMITS: OperatorPermitDetail[] = [
  {
    id: 'PSP-2024-001',
    permitNumber: 'PSP/WP/2024/001',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-001',
    routeGroupName: 'Colombo - Kandy Express Group',
    routeGroupCode: 'CK-EXP',
    permitType: 'REGULAR',
    status: 'ACTIVE',
    issueDate: '2024-01-15',
    expiryDate: '2026-01-14',
    maximumBusAssigned: 5,
    issuedBy: 'Ministry of Transport - Western Province',
    notes: 'Renewal submitted 60 days prior to expiry.',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-06-10T14:20:00Z',
    routes: [
      {
        id: 'RT-001',
        routeNumber: '100',
        name: 'Colombo Fort - Kandy',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        distance: 116,
      },
      {
        id: 'RT-002',
        routeNumber: '100E',
        name: 'Colombo Fort - Kandy (Express)',
        origin: 'Colombo Fort',
        destination: 'Kandy',
        distance: 116,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
  {
    id: 'PSP-2024-002',
    permitNumber: 'PSP/WP/2024/002',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-002',
    routeGroupName: 'Colombo - Galle Southern Group',
    routeGroupCode: 'CG-STH',
    permitType: 'REGULAR',
    status: 'ACTIVE',
    issueDate: '2024-03-01',
    expiryDate: '2026-02-28',
    maximumBusAssigned: 3,
    issuedBy: 'Ministry of Transport - Western Province',
    notes: '',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-09-01T11:00:00Z',
    routes: [
      {
        id: 'RT-003',
        routeNumber: '2',
        name: 'Colombo Fort - Galle',
        origin: 'Colombo Fort',
        destination: 'Galle',
        distance: 119,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
  {
    id: 'PSP-2024-003',
    permitNumber: 'PSP/SP/2024/015',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-003',
    routeGroupName: 'Colombo - Negombo Airport Service',
    routeGroupCode: 'CN-AIR',
    permitType: 'SPECIAL',
    status: 'PENDING',
    issueDate: '2024-11-01',
    expiryDate: '2025-10-31',
    maximumBusAssigned: 2,
    issuedBy: 'Ministry of Transport - Western Province',
    notes: 'Application under review by MOT.',
    createdAt: '2024-11-01T10:30:00Z',
    updatedAt: '2024-11-05T08:15:00Z',
    routes: [
      {
        id: 'RT-004',
        routeNumber: '187',
        name: 'Colombo Fort - Negombo (Airport)',
        origin: 'Colombo Fort',
        destination: 'Bandaranaike International Airport',
        distance: 38,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
  {
    id: 'PSP-2023-008',
    permitNumber: 'PSP/WP/2023/008',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-004',
    routeGroupName: 'Colombo City Circular',
    routeGroupCode: 'CC-CIR',
    permitType: 'REGULAR',
    status: 'EXPIRED',
    issueDate: '2022-06-01',
    expiryDate: '2024-05-31',
    maximumBusAssigned: 4,
    issuedBy: 'Ministry of Transport - Western Province',
    notes: 'Renewal application pending.',
    createdAt: '2022-06-01T07:00:00Z',
    updatedAt: '2024-05-31T18:00:00Z',
    routes: [
      {
        id: 'RT-005',
        routeNumber: '138',
        name: 'Fort - Pettah - Maradana Circular',
        origin: 'Fort',
        destination: 'Fort (Circular)',
        distance: 12,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
  {
    id: 'PSP-2024-007',
    permitNumber: 'PSP/WP/2024/007',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-005',
    routeGroupName: 'Kadawatha - Colombo Commuter',
    routeGroupCode: 'KC-COM',
    permitType: 'TEMPORARY',
    status: 'INACTIVE',
    issueDate: '2024-07-01',
    expiryDate: '2025-12-31',
    maximumBusAssigned: 2,
    issuedBy: 'Ministry of Transport - Western Province',
    notes: 'Suspended due to route maintenance.',
    createdAt: '2024-07-01T08:00:00Z',
    updatedAt: '2024-10-15T12:00:00Z',
    routes: [
      {
        id: 'RT-006',
        routeNumber: '249',
        name: 'Kadawatha - Colombo Fort',
        origin: 'Kadawatha',
        destination: 'Colombo Fort',
        distance: 18,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
  {
    id: 'PSP-2025-001',
    permitNumber: 'PSP/WP/2025/001',
    operatorId: OPERATOR_ID,
    operatorName: 'Lanka Transport Services (Pvt) Ltd',
    routeGroupId: 'RG-006',
    routeGroupName: 'Colombo - Ratnapura Hill Country',
    routeGroupCode: 'CR-HLC',
    permitType: 'REGULAR',
    status: 'ACTIVE',
    issueDate: '2025-01-10',
    expiryDate: '2026-03-10', // Expiring within ~30 days from now (Feb 21, 2026)
    maximumBusAssigned: 3,
    issuedBy: 'Ministry of Transport - Sabaragamuwa Province',
    notes: 'Renewal required soon.',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
    routes: [
      {
        id: 'RT-007',
        routeNumber: '98',
        name: 'Colombo Fort - Ratnapura',
        origin: 'Colombo Fort',
        destination: 'Ratnapura',
        distance: 101,
      },
    ],
    contactPerson: 'Pradeep Jayawardena',
    contactPhone: '0112345678',
    address: 'No. 45, Kandy Road, Colombo 10',
  },
];

// ---------------------------------------------------------------------------
// Data Access Functions
// (Replace these with real API calls when the backend is ready)
// ---------------------------------------------------------------------------

export interface GetPermitsOptions {
  operatorId?: string;
  search?: string;
  status?: string;
  permitType?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface GetPermitsResult {
  permits: OperatorPermit[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

/**
 * Returns a paginated, filtered, and sorted list of permits for an operator.
 * Replace the body of this function with a real API call when ready.
 */
export function getMockPermits(options: GetPermitsOptions = {}): GetPermitsResult {
  const {
    search = '',
    status = 'all',
    permitType = 'all',
    sortBy = 'issueDate',
    sortDir = 'desc',
    page = 1,
    pageSize = 10,
  } = options;

  let filtered: OperatorPermit[] = [...MOCK_PERMITS];

  // Filter by search term
  if (search.trim()) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.permitNumber.toLowerCase().includes(term) ||
        p.routeGroupName.toLowerCase().includes(term) ||
        p.routeGroupCode.toLowerCase().includes(term)
    );
  }

  // Filter by status
  if (status !== 'all') {
    filtered = filtered.filter((p) => p.status === status.toUpperCase());
  }

  // Filter by permit type
  if (permitType !== 'all') {
    filtered = filtered.filter((p) => p.permitType === permitType.toUpperCase());
  }

  // Sort
  filtered.sort((a, b) => {
    const valA = (a as unknown as Record<string, unknown>)[sortBy] ?? '';
    const valB = (b as unknown as Record<string, unknown>)[sortBy] ?? '';
    const cmp = String(valA).localeCompare(String(valB));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return { permits: paged, total, page, totalPages, pageSize };
}

/**
 * Returns a single permit by ID.
 * Replace the body of this function with a real API call when ready.
 */
export function getMockPermitById(id: string): OperatorPermitDetail | null {
  return MOCK_PERMITS.find((p) => p.id === id) ?? null;
}

/**
 * Returns aggregate statistics for an operator's permits.
 * Replace the body of this function with a real API call when ready.
 */
export function getMockPermitStatistics(): OperatorPermitStatistics {
  const today = new Date();
  const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return {
    totalPermits: MOCK_PERMITS.length,
    activePermits: MOCK_PERMITS.filter((p) => p.status === 'ACTIVE').length,
    inactivePermits: MOCK_PERMITS.filter((p) => p.status === 'INACTIVE').length,
    pendingPermits: MOCK_PERMITS.filter((p) => p.status === 'PENDING').length,
    expiredPermits: MOCK_PERMITS.filter((p) => p.status === 'EXPIRED').length,
    expiringSoonPermits: MOCK_PERMITS.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      const expiry = new Date(p.expiryDate);
      return expiry > today && expiry <= thirtyDaysLater;
    }).length,
  };
}

/**
 * Returns available filter options for the permit list filters.
 */
export function getMockPermitFilterOptions(): OperatorPermitFilterOptions {
  return {
    statuses: ['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED'],
    permitTypes: ['REGULAR', 'SPECIAL', 'TEMPORARY'],
  };
}
