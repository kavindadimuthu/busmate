// Stage-based fare structure data for Sri Lankan public bus transportation
// Replace with API calls when backend is ready

// ── Types ─────────────────────────────────────────────────────────

export type PermitType = 'NORMAL' | 'SEMILUXURY' | 'LUXURY' | 'EXTRALUXURY';

export const PERMIT_TYPES: PermitType[] = ['NORMAL', 'SEMILUXURY', 'LUXURY', 'EXTRALUXURY'];

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  NORMAL: 'Normal',
  SEMILUXURY: 'Semi Luxury',
  LUXURY: 'Luxury',
  EXTRALUXURY: 'Extra Luxury',
};

export const PERMIT_TYPE_COLORS: Record<PermitType, string> = {
  NORMAL: 'bg-blue-50 text-blue-700 border-blue-200',
  SEMILUXURY: 'bg-amber-50 text-amber-700 border-amber-200',
  LUXURY: 'bg-purple-50 text-purple-700 border-purple-200',
  EXTRALUXURY: 'bg-rose-50 text-rose-700 border-rose-200',
};

export interface FareMatrixEntry {
  stage: number;
  fares: Record<PermitType, number>;
}

export type AmendmentStatus = 'ACTIVE' | 'SUPERSEDED' | 'DRAFT' | 'PENDING';

export const AMENDMENT_STATUS_COLORS: Record<AmendmentStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUPERSEDED: 'bg-gray-100 text-gray-600 border-gray-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING: 'bg-blue-50 text-blue-700 border-blue-200',
};

export interface FareAmendment {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  effectiveDate: string;
  approvedDate: string | null;
  approvedBy: string;
  status: AmendmentStatus;
  gazetteNumber: string;
  remarks: string;
  maxStages: number;
  matrix: FareMatrixEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface FareAmendmentSummary {
  id: string;
  referenceNumber: string;
  title: string;
  effectiveDate: string;
  approvedDate: string | null;
  status: AmendmentStatus;
  gazetteNumber: string;
  maxStages: number;
  createdAt: string;
}

export interface FareStatistics {
  totalAmendments: number;
  activeAmendment: string;
  totalPermitTypes: number;
  maxStages: number;
  averageNormalFare: number;
  lastUpdated: string;
}

export interface FareAmendmentFormData {
  referenceNumber: string;
  title: string;
  description: string;
  effectiveDate: string;
  gazetteNumber: string;
  remarks: string;
  maxStages: number;
  baseRates: Record<PermitType, number>;
  incrementRates: Record<PermitType, number>;
}

// ── Fare Matrix Generator ─────────────────────────────────────────

function generateFareMatrix(
  maxStages: number,
  baseRates: Record<PermitType, number>,
  incrementRates: Record<PermitType, number>,
): FareMatrixEntry[] {
  const matrix: FareMatrixEntry[] = [];

  for (let stage = 1; stage <= maxStages; stage++) {
    const fares = {} as Record<PermitType, number>;
    for (const permitType of PERMIT_TYPES) {
      const rawFare = baseRates[permitType] + (stage - 1) * incrementRates[permitType];
      fares[permitType] = Math.round(rawFare * 2) / 2;
    }
    matrix.push({ stage, fares });
  }

  return matrix;
}

// ── Sample Amendments ─────────────────────────────────────────────

const amendments: FareAmendment[] = [
  {
    id: 'FA-2026-001',
    referenceNumber: 'NTC/FARE/2026/001',
    title: 'Fare Revision - January 2026',
    description:
      'Revised fare structure effective from January 2026 reflecting increased fuel costs and operational expenses. This amendment updates fares across all permit types with an average increase of 8% compared to the previous structure.',
    effectiveDate: '2026-01-15',
    approvedDate: '2026-01-10',
    approvedBy: 'Ministry of Transport',
    status: 'ACTIVE',
    gazetteNumber: 'GZ-2026/01/15-2241',
    remarks: 'Approved by Cabinet Decision No. CD/2026/001. Applicable to all routes island-wide.',
    maxStages: 350,
    matrix: generateFareMatrix(350, {
      NORMAL: 20.00,
      SEMILUXURY: 26.00,
      LUXURY: 36.00,
      EXTRALUXURY: 50.00,
    }, {
      NORMAL: 1.80,
      SEMILUXURY: 2.35,
      LUXURY: 3.25,
      EXTRALUXURY: 4.50,
    }),
    createdAt: '2026-01-08',
    updatedAt: '2026-01-10',
  },
  {
    id: 'FA-2025-003',
    referenceNumber: 'NTC/FARE/2025/003',
    title: 'Fare Revision - July 2025',
    description:
      'Mid-year fare adjustment for July 2025 reflecting fuel price stabilization. Includes minor adjustments to semi-luxury and luxury categories.',
    effectiveDate: '2025-07-01',
    approvedDate: '2025-06-25',
    approvedBy: 'Ministry of Transport',
    status: 'SUPERSEDED',
    gazetteNumber: 'GZ-2025/07/01-2198',
    remarks: 'Superseded by FA-2026-001. Was in effect from July 2025 to January 2026.',
    maxStages: 350,
    matrix: generateFareMatrix(350, {
      NORMAL: 18.50,
      SEMILUXURY: 24.00,
      LUXURY: 33.50,
      EXTRALUXURY: 46.00,
    }, {
      NORMAL: 1.65,
      SEMILUXURY: 2.15,
      LUXURY: 3.00,
      EXTRALUXURY: 4.15,
    }),
    createdAt: '2025-06-20',
    updatedAt: '2025-06-25',
  },
  {
    id: 'FA-2025-001',
    referenceNumber: 'NTC/FARE/2025/001',
    title: 'Fare Revision - January 2025',
    description:
      'Annual fare revision for 2025 incorporating fuel surcharge adjustments and CPI-based indexation. Applicable from 1st January 2025.',
    effectiveDate: '2025-01-01',
    approvedDate: '2024-12-20',
    approvedBy: 'Ministry of Transport',
    status: 'SUPERSEDED',
    gazetteNumber: 'GZ-2025/01/01-2150',
    remarks: 'Superseded by FA-2025-003. Implemented CPI-based indexation for the first time.',
    maxStages: 350,
    matrix: generateFareMatrix(350, {
      NORMAL: 17.00,
      SEMILUXURY: 22.00,
      LUXURY: 31.00,
      EXTRALUXURY: 43.00,
    }, {
      NORMAL: 1.50,
      SEMILUXURY: 1.95,
      LUXURY: 2.80,
      EXTRALUXURY: 3.85,
    }),
    createdAt: '2024-12-15',
    updatedAt: '2024-12-20',
  },
  {
    id: 'FA-2024-002',
    referenceNumber: 'NTC/FARE/2024/002',
    title: 'Fare Revision - June 2024',
    description:
      'Emergency fare revision in response to significant fuel price increases. Implemented across all categories with immediate effect.',
    effectiveDate: '2024-06-01',
    approvedDate: '2024-05-28',
    approvedBy: 'Ministry of Transport',
    status: 'SUPERSEDED',
    gazetteNumber: 'GZ-2024/06/01-2098',
    remarks: 'Emergency revision. Superseded by FA-2025-001.',
    maxStages: 350,
    matrix: generateFareMatrix(350, {
      NORMAL: 15.00,
      SEMILUXURY: 19.50,
      LUXURY: 27.00,
      EXTRALUXURY: 37.50,
    }, {
      NORMAL: 1.35,
      SEMILUXURY: 1.75,
      LUXURY: 2.45,
      EXTRALUXURY: 3.40,
    }),
    createdAt: '2024-05-25',
    updatedAt: '2024-05-28',
  },
  {
    id: 'FA-2026-DRAFT',
    referenceNumber: 'NTC/FARE/2026/DRAFT-002',
    title: 'Proposed Fare Revision - Mid 2026',
    description:
      'Draft fare revision proposal for mid-2026 under review. Includes proposed adjustments based on projected fuel price changes and inflation forecasts.',
    effectiveDate: '2026-07-01',
    approvedDate: null,
    approvedBy: '',
    status: 'DRAFT',
    gazetteNumber: '',
    remarks: 'Under review by the fare committee. Subject to Cabinet approval.',
    maxStages: 350,
    matrix: generateFareMatrix(350, {
      NORMAL: 22.00,
      SEMILUXURY: 28.50,
      LUXURY: 40.00,
      EXTRALUXURY: 55.00,
    }, {
      NORMAL: 2.00,
      SEMILUXURY: 2.60,
      LUXURY: 3.60,
      EXTRALUXURY: 5.00,
    }),
    createdAt: '2026-02-15',
    updatedAt: '2026-02-20',
  },
];

// ── Service Functions ─────────────────────────────────────────────

export function getAmendments(): FareAmendment[] {
  return amendments;
}

export function getAmendmentSummaries(): FareAmendmentSummary[] {
  return amendments.map(({ id, referenceNumber, title, effectiveDate, approvedDate, status, gazetteNumber, maxStages, createdAt }) => ({
    id,
    referenceNumber,
    title,
    effectiveDate,
    approvedDate,
    status,
    gazetteNumber,
    maxStages,
    createdAt,
  }));
}

export function getAmendmentById(id: string): FareAmendment | undefined {
  return amendments.find((a) => a.id === id);
}

export function getActiveAmendment(): FareAmendment | undefined {
  return amendments.find((a) => a.status === 'ACTIVE');
}

export function getFareStatistics(): FareStatistics {
  const active = getActiveAmendment();
  const avgNormal =
    active
      ? active.matrix.reduce((sum, e) => sum + e.fares.NORMAL, 0) / active.matrix.length
      : 0;

  return {
    totalAmendments: amendments.length,
    activeAmendment: active?.referenceNumber ?? 'N/A',
    totalPermitTypes: PERMIT_TYPES.length,
    maxStages: active?.maxStages ?? 350,
    averageNormalFare: Math.round(avgNormal * 100) / 100,
    lastUpdated: active?.updatedAt ?? '',
  };
}

export function getAmendmentStatusOptions(): AmendmentStatus[] {
  return [...new Set(amendments.map((a) => a.status))];
}
