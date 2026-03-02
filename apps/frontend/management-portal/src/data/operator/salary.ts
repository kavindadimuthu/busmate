/**
 * @module data/operator/salary
 *
 * Mock salary data for the operator portal salary management.
 *
 * Links with existing staff data from `@/data/operator/staff` and provides
 * salary computation, payment tracking, and reporting functions.
 * Replace with real API integrations when backend is available.
 */

import { getAllStaff, type StaffMember } from './staff';

// ── Types ─────────────────────────────────────────────────────────

/** Payment status for a salary record. */
export type SalaryPaymentStatus = 'PAID' | 'PENDING' | 'PROCESSING' | 'FAILED';

/** Salary calculation period. */
export type SalaryPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

/** Performance rating for bonus calculation. */
export type PerformanceRating = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE';

/** Predefined salary rules per role. */
export interface SalaryRule {
  role: 'DRIVER' | 'CONDUCTOR';
  baseDailyRate: number;
  overtimeHourlyRate: number;
  bonusPerTrip: number;
  performanceMultiplier: Record<PerformanceRating, number>;
}

/** Deduction line item. */
export interface DeductionItem {
  type: 'ABSENCE' | 'LATE' | 'DAMAGE' | 'ADVANCE' | 'OTHER';
  label: string;
  amount: number;
}

/** Bonus line item. */
export interface BonusItem {
  type: 'PERFORMANCE' | 'ATTENDANCE' | 'OVERTIME' | 'TRIP_BONUS' | 'FESTIVAL' | 'OTHER';
  label: string;
  amount: number;
}

/** Individual salary record for a staff member for a given period. */
export interface SalaryRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: 'DRIVER' | 'CONDUCTOR';
  busAssigned: string;
  routeAssigned: string;

  // Period
  period: SalaryPeriod;
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date

  // Hours
  regularHours: number;
  overtimeHours: number;
  totalHours: number;

  // Trip metrics
  tripsCompleted: number;
  onTimePercentage: number;

  // Performance
  performanceRating: PerformanceRating;
  customerRating: number; // 1-5

  // Salary breakdown
  baseSalary: number;
  overtimePay: number;
  bonuses: BonusItem[];
  deductions: DeductionItem[];
  totalBonuses: number;
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;

  // Payment info
  paymentStatus: SalaryPaymentStatus;
  paymentDate: string | null;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
  bankAccount?: string;

  // Metadata
  createdAt: string;
  approvedBy: string | null;
  notes: string;
}

/** Summary statistics for salary management dashboard. */
export interface SalaryStats {
  totalPaid: number;
  totalPending: number;
  totalProcessing: number;
  totalStaff: number;
  avgSalary: number;
  totalBonuses: number;
  totalDeductions: number;
  totalGross: number;
  paidCount: number;
  pendingCount: number;
  processingCount: number;
}

/** Monthly summary for trend charts. */
export interface MonthlySalarySummary {
  month: string; // e.g. "2026-01"
  label: string; // e.g. "Jan 2026"
  totalGross: number;
  totalNet: number;
  totalBonuses: number;
  totalDeductions: number;
  staffCount: number;
}

/** Filter options for salary management. */
export interface SalaryFilterOptions {
  roles: { value: string; label: string }[];
  statuses: { value: SalaryPaymentStatus; label: string }[];
  periods: { value: SalaryPeriod; label: string }[];
  performanceRatings: { value: PerformanceRating; label: string }[];
  buses: { value: string; label: string }[];
  routes: { value: string; label: string }[];
}

// ── Salary rules (configurable) ───────────────────────────────────

export const SALARY_RULES: SalaryRule[] = [
  {
    role: 'DRIVER',
    baseDailyRate: 1800,
    overtimeHourlyRate: 300,
    bonusPerTrip: 50,
    performanceMultiplier: {
      EXCELLENT: 1.2,
      GOOD: 1.1,
      AVERAGE: 1.0,
      BELOW_AVERAGE: 0.9,
    },
  },
  {
    role: 'CONDUCTOR',
    baseDailyRate: 1400,
    overtimeHourlyRate: 250,
    bonusPerTrip: 40,
    performanceMultiplier: {
      EXCELLENT: 1.2,
      GOOD: 1.1,
      AVERAGE: 1.0,
      BELOW_AVERAGE: 0.9,
    },
  },
];

// ── Mock data generation ──────────────────────────────────────────

const BUSES_ASSIGNED = ['ND 4536', 'ND 7892', 'ND 3421', 'ND 8765', 'ND 9876'];
const ROUTES_ASSIGNED = [
  'Matara — Galle', 'Matara — Colombo', 'Matara — Tangalle',
  'Matara — Hambantota', 'Matara — Weligama',
];

const PERFORMANCE_RATINGS: PerformanceRating[] = ['EXCELLENT', 'GOOD', 'GOOD', 'AVERAGE', 'AVERAGE', 'BELOW_AVERAGE'];
const PAYMENT_STATUSES: SalaryPaymentStatus[] = ['PAID', 'PAID', 'PAID', 'PAID', 'PENDING', 'PROCESSING', 'FAILED'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

async function generateSalaryRecords(): Promise<SalaryRecord[]> {
  const rand = seededRandom(7777);
  const records: SalaryRecord[] = [];
  const staff = await getAllStaff();

  // Generate daily salary records for the last 30 days
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (const member of staff) {
      // Skip some staff on some days (days off)
      if (rand() < 0.15) continue;

      const rule = SALARY_RULES.find((r) => r.role === member.role)!;
      const bus = BUSES_ASSIGNED[Math.floor(rand() * BUSES_ASSIGNED.length)];
      const route = ROUTES_ASSIGNED[Math.floor(rand() * ROUTES_ASSIGNED.length)];

      const regularHours = 8;
      const overtimeHours = rand() > 0.6 ? Math.round(rand() * 3 * 10) / 10 : 0;
      const tripsCompleted = Math.floor(rand() * 8) + 3;
      const onTime = Math.round((70 + rand() * 30) * 10) / 10;
      const perfRating = PERFORMANCE_RATINGS[Math.floor(rand() * PERFORMANCE_RATINGS.length)];
      const custRating = Math.round((3 + rand() * 2) * 10) / 10;

      const baseSalary = rule.baseDailyRate;
      const overtimePay = Math.round(overtimeHours * rule.overtimeHourlyRate);
      const tripBonus = tripsCompleted * rule.bonusPerTrip;

      const bonuses: BonusItem[] = [
        { type: 'TRIP_BONUS', label: `${tripsCompleted} trips completed`, amount: tripBonus },
      ];

      if (perfRating === 'EXCELLENT') {
        bonuses.push({ type: 'PERFORMANCE', label: 'Excellent performance bonus', amount: 300 });
      } else if (perfRating === 'GOOD') {
        bonuses.push({ type: 'PERFORMANCE', label: 'Good performance bonus', amount: 150 });
      }

      if (onTime >= 95) {
        bonuses.push({ type: 'ATTENDANCE', label: 'Perfect punctuality bonus', amount: 200 });
      }

      if (overtimeHours > 0) {
        bonuses.push({ type: 'OVERTIME', label: `${overtimeHours}h overtime`, amount: overtimePay });
      }

      const deductions: DeductionItem[] = [];
      if (rand() < 0.1) {
        deductions.push({ type: 'LATE', label: 'Late arrival penalty', amount: Math.floor(rand() * 200) + 50 });
      }
      if (rand() < 0.05) {
        deductions.push({ type: 'ADVANCE', label: 'Salary advance recovery', amount: 500 });
      }

      const totalBonuses = bonuses.reduce((s, b) => s + b.amount, 0);
      const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
      const grossSalary = baseSalary + totalBonuses;
      const netSalary = grossSalary - totalDeductions;

      const paymentStatus = dayOffset > 2
        ? 'PAID'
        : PAYMENT_STATUSES[Math.floor(rand() * PAYMENT_STATUSES.length)];

      records.push({
        id: `sal-${dateStr}-${member.id}`,
        staffId: member.id,
        staffName: member.fullName,
        role: member.role,
        busAssigned: bus,
        routeAssigned: route,
        period: 'DAILY',
        periodStart: dateStr,
        periodEnd: dateStr,
        regularHours,
        overtimeHours,
        totalHours: regularHours + overtimeHours,
        tripsCompleted,
        onTimePercentage: onTime,
        performanceRating: perfRating,
        customerRating: custRating,
        baseSalary,
        overtimePay,
        bonuses,
        deductions,
        totalBonuses,
        totalDeductions,
        grossSalary,
        netSalary,
        paymentStatus,
        paymentDate: paymentStatus === 'PAID' ? dateStr : null,
        paymentMethod: rand() > 0.3 ? 'BANK_TRANSFER' : 'CASH',
        bankAccount: rand() > 0.3 ? `****${Math.floor(rand() * 9000 + 1000)}` : undefined,
        createdAt: `${dateStr}T20:00:00`,
        approvedBy: paymentStatus === 'PAID' ? 'Operator Admin' : null,
        notes: '',
      });
    }
  }

  records.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  return records;
}

// ── Singleton cache ───────────────────────────────────────────────

let _salaryCache: SalaryRecord[] | null = null;

async function getSalaryData(): Promise<SalaryRecord[]> {
  if (!_salaryCache) {
    _salaryCache = await generateSalaryRecords();
  }
  return _salaryCache;
}

// ── Public service functions ──────────────────────────────────────

/**
 * Get all salary records (simulates async backend call).
 */
export async function getAllSalaryRecords(): Promise<SalaryRecord[]> {
  const data = await getSalaryData();
  return data;
}

/**
 * Get salary records filtered by date range.
 */
export async function getSalaryRecordsByDateRange(startDate: string, endDate: string): Promise<SalaryRecord[]> {
  const data = await getSalaryData();
  return data.filter((r) => r.periodStart >= startDate && r.periodEnd <= endDate);
}

/**
 * Get salary records for a specific staff member.
 */
export async function getSalaryRecordsByStaff(staffId: string): Promise<SalaryRecord[]> {
  const data = await getSalaryData();
  return data.filter((r) => r.staffId === staffId);
}

/**
 * Compute salary summary stats from a set of records.
 */
export function computeSalaryStats(records: SalaryRecord[]): SalaryStats {
  const paid = records.filter((r) => r.paymentStatus === 'PAID');
  const pending = records.filter((r) => r.paymentStatus === 'PENDING');
  const processing = records.filter((r) => r.paymentStatus === 'PROCESSING');
  const uniqueStaff = new Set(records.map((r) => r.staffId)).size;

  return {
    totalPaid: paid.reduce((s, r) => s + r.netSalary, 0),
    totalPending: pending.reduce((s, r) => s + r.netSalary, 0),
    totalProcessing: processing.reduce((s, r) => s + r.netSalary, 0),
    totalStaff: uniqueStaff,
    avgSalary: records.length > 0 ? Math.round(records.reduce((s, r) => s + r.netSalary, 0) / records.length) : 0,
    totalBonuses: records.reduce((s, r) => s + r.totalBonuses, 0),
    totalDeductions: records.reduce((s, r) => s + r.totalDeductions, 0),
    totalGross: records.reduce((s, r) => s + r.grossSalary, 0),
    paidCount: paid.length,
    pendingCount: pending.length,
    processingCount: processing.length,
  };
}

/**
 * Get monthly salary summaries for trend charts.
 */
export function getMonthlySalarySummaries(records: SalaryRecord[]): MonthlySalarySummary[] {
  const months = new Map<string, SalaryRecord[]>();

  for (const r of records) {
    const month = r.periodStart.substring(0, 7);
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(r);
  }

  const summaries: MonthlySalarySummary[] = [];
  for (const [month, group] of months) {
    const [year, m] = month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    summaries.push({
      month,
      label: `${monthNames[parseInt(m) - 1]} ${year}`,
      totalGross: group.reduce((s, r) => s + r.grossSalary, 0),
      totalNet: group.reduce((s, r) => s + r.netSalary, 0),
      totalBonuses: group.reduce((s, r) => s + r.totalBonuses, 0),
      totalDeductions: group.reduce((s, r) => s + r.totalDeductions, 0),
      staffCount: new Set(group.map((r) => r.staffId)).size,
    });
  }

  return summaries.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Get filter options for salary management UI.
 */
export function getSalaryFilterOptions(): SalaryFilterOptions {
  return {
    roles: [
      { value: 'DRIVER', label: 'Driver' },
      { value: 'CONDUCTOR', label: 'Conductor' },
    ],
    statuses: [
      { value: 'PAID', label: 'Paid' },
      { value: 'PENDING', label: 'Pending' },
      { value: 'PROCESSING', label: 'Processing' },
      { value: 'FAILED', label: 'Failed' },
    ],
    periods: [
      { value: 'DAILY', label: 'Daily' },
      { value: 'WEEKLY', label: 'Weekly' },
      { value: 'MONTHLY', label: 'Monthly' },
    ],
    performanceRatings: [
      { value: 'EXCELLENT', label: 'Excellent' },
      { value: 'GOOD', label: 'Good' },
      { value: 'AVERAGE', label: 'Average' },
      { value: 'BELOW_AVERAGE', label: 'Below Average' },
    ],
    buses: BUSES_ASSIGNED.map((b) => ({ value: b, label: b })),
    routes: ROUTES_ASSIGNED.map((r) => ({ value: r, label: r })),
  };
}

/**
 * Get the salary rule for a given role.
 */
export function getSalaryRuleForRole(role: 'DRIVER' | 'CONDUCTOR'): SalaryRule {
  return SALARY_RULES.find((r) => r.role === role)!;
}
