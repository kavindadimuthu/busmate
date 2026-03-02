'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Eye,
  Car,
  UserCheck,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn, SortState } from '@/components/shared/DataTable';
import type { StaffMember, Driver, Conductor } from '@/data/operator/staff';

// ── Types ─────────────────────────────────────────────────────────

export type StaffTableMode = 'all' | 'drivers' | 'conductors';

interface StaffTableProps {
  staff: StaffMember[];
  mode: StaffTableMode;
  loading?: boolean;
  currentSort?: SortState;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

// ── Status badge ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-100   text-green-700   border-green-200',   Icon: CheckCircle2 },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-100    text-gray-600    border-gray-200',    Icon: XCircle },
  ON_LEAVE:  { label: 'On Leave',  cls: 'bg-yellow-100  text-yellow-700  border-yellow-200',  Icon: AlertCircle },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-100     text-red-700     border-red-200',     Icon: XCircle },
} as const;

const SHIFT_CONFIG = {
  AVAILABLE: { label: 'Available', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-orange-100  text-orange-700  border-orange-200' },
  OFF_DUTY:  { label: 'Off Duty',  cls: 'bg-gray-100    text-gray-500    border-gray-200' },
} as const;

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.INACTIVE;
  const { label, cls, Icon } = config;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

function ShiftBadge({ shift }: { shift: string }) {
  const config = SHIFT_CONFIG[shift as keyof typeof SHIFT_CONFIG] ?? SHIFT_CONFIG.OFF_DUTY;
  const { label, cls } = config;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'DRIVER') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <Car className="w-3 h-3" />
        Driver
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
      <UserCheck className="w-3 h-3" />
      Conductor
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function formatExpiry(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return '—';
  }
}

// ── Column builders ───────────────────────────────────────────────

function buildStaffColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'fullName',
    header: 'Staff',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (member) => {
      const initials = member.avatarInitials || member.fullName.charAt(0).toUpperCase();
      const avatarCls =
        member.role === 'DRIVER' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
      return (
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-black/5 ${avatarCls}`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {member.fullName}
            </p>
            <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
              {member.nic}
            </p>
          </div>
        </div>
      );
    },
  };
}

function buildContactColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'contact',
    header: 'Contact',
    minWidth: 'min-w-[160px]',
    render: (member) => (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-gray-300 shrink-0" />
          <span className="text-sm text-gray-700">{member.phone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-gray-300 shrink-0" />
          <span className="text-[11px] text-gray-400 truncate">{member.email}</span>
        </div>
      </div>
    ),
  };
}

function buildEmployeeIdColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'employeeId',
    header: 'Employee ID',
    sortable: true,
    cellClassName: 'whitespace-nowrap',
    render: (member) => (
      <span className="text-sm text-gray-600 font-mono">{member.employeeId}</span>
    ),
  };
}

function buildRouteColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'assignedRoute',
    header: 'Assigned Route',
    minWidth: 'min-w-[140px]',
    render: (member) =>
      member.assignedRoute ? (
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate leading-tight">
              {member.assignedRoute}
            </p>
            {member.assignedRouteName && (
              <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                {member.assignedRouteName}
              </p>
            )}
          </div>
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">Unassigned</span>
      ),
  };
}

function buildStatusColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'status',
    header: 'Status',
    sortable: true,
    cellClassName: 'whitespace-nowrap',
    render: (member) => <StatusBadge status={member.status} />,
  };
}

function buildShiftColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'shiftStatus',
    header: 'Shift',
    cellClassName: 'whitespace-nowrap',
    render: (member) => <ShiftBadge shift={member.shiftStatus} />,
  };
}

function buildActionsColumn(): DataTableColumn<StaffMember> {
  return {
    key: 'actions',
    header: 'Actions',
    headerClassName: 'text-center',
    cellClassName: 'whitespace-nowrap text-center',
    render: (member) => (
      <button
        onClick={() => window.location.href = `/operator/staff-management/${member.id}`}
        title="View staff details"
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
    ),
  };
}

// ── Main component ────────────────────────────────────────────────

/**
 * Unified staff data table for Drivers, Conductors, or all staff.
 *
 * Displays role-specific columns depending on `mode`:
 * - `'all'`        → common columns with a Role badge
 * - `'drivers'`    → adds a License column
 * - `'conductors'` → adds Certificate and Languages columns
 */
export function StaffTable({
  staff,
  mode,
  loading = false,
  currentSort = { field: '', direction: 'asc' },
  onSort,
}: StaffTableProps) {
  const columns = useMemo((): DataTableColumn<StaffMember>[] => {
    if (mode === 'all') {
      return [
        buildStaffColumn(),
        buildEmployeeIdColumn(),
        buildContactColumn(),
        {
          key: 'role',
          header: 'Role',
          cellClassName: 'whitespace-nowrap',
          render: (member) => <RoleBadge role={member.role} />,
        },
        buildRouteColumn(),
        buildStatusColumn(),
        buildShiftColumn(),
        buildActionsColumn(),
      ];
    }

    if (mode === 'drivers') {
      return [
        buildStaffColumn(),
        buildEmployeeIdColumn(),
        buildContactColumn(),
        {
          key: 'license',
          header: 'License',
          minWidth: 'min-w-[130px]',
          render: (member) => {
            const driver = member as Driver;
            return (
              <div>
                <p className="text-xs font-mono text-gray-700">
                  {driver.license?.licenseNumber ?? '—'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Exp:{' '}
                  {driver.license?.expiryDate
                    ? formatExpiry(driver.license.expiryDate)
                    : '—'}
                </p>
              </div>
            );
          },
        },
        buildRouteColumn(),
        buildStatusColumn(),
        buildShiftColumn(),
        buildActionsColumn(),
      ];
    }

    // Conductors mode
    return [
      buildStaffColumn(),
      buildEmployeeIdColumn(),
      buildContactColumn(),
      {
        key: 'certificate',
        header: 'Certificate',
        minWidth: 'min-w-[130px]',
        render: (member) => {
          const conductor = member as Conductor;
          return (
            <div>
              <p className="text-xs font-mono text-gray-700">
                {conductor.certificateNumber ?? '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Exp:{' '}
                {conductor.certificationExpiryDate
                  ? formatExpiry(conductor.certificationExpiryDate)
                  : '—'}
              </p>
            </div>
          );
        },
      },
      {
        key: 'languages',
        header: 'Languages',
        minWidth: 'min-w-[110px]',
        render: (member) => {
          const conductor = member as Conductor;
          const langs = conductor.languagesSpoken ?? [];
          return (
            <div className="flex flex-wrap gap-1">
              {langs.slice(0, 2).map((lang) => (
                <span
                  key={lang}
                  className="px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-100"
                >
                  {lang}
                </span>
              ))}
              {langs.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-gray-100 text-gray-500">
                  +{langs.length - 2}
                </span>
              )}
            </div>
          );
        },
      },
      buildRouteColumn(),
      buildStatusColumn(),
      buildShiftColumn(),
      buildActionsColumn(),
    ];
  }, [mode]);

  const emptyIcon =
    mode === 'drivers' ? (
      <Car className="w-10 h-10 mb-3 text-gray-300" />
    ) : mode === 'conductors' ? (
      <UserCheck className="w-10 h-10 mb-3 text-gray-300" />
    ) : (
      <Users className="w-10 h-10 mb-3 text-gray-300" />
    );

  const emptyLabel =
    mode === 'drivers'
      ? 'No drivers found'
      : mode === 'conductors'
      ? 'No conductors found'
      : 'No staff members found';

  return (
    <DataTable<StaffMember>
      columns={columns}
      data={staff}
      loading={loading}
      rowKey={(member) => member.id}
      currentSort={currentSort}
      onSort={onSort}
      emptyState={
        <div className="flex flex-col items-center py-12 text-gray-400">
          {emptyIcon}
          <p className="font-medium text-gray-500">{emptyLabel}</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      }
    />
  );
}
