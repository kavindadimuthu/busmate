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
  ACTIVE:    { label: 'Active',    cls: 'bg-success/15   text-success   border-success/20',   Icon: CheckCircle2 },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-muted    text-muted-foreground    border-border',    Icon: XCircle },
  ON_LEAVE:  { label: 'On Leave',  cls: 'bg-warning/15  text-warning  border-warning/20',  Icon: AlertCircle },
  SUSPENDED: { label: 'Suspended', cls: 'bg-destructive/15     text-destructive     border-destructive/20',     Icon: XCircle },
} as const;

const SHIFT_CONFIG = {
  AVAILABLE: { label: 'Available', cls: 'bg-success/15 text-success border-success/20' },
  ASSIGNED:  { label: 'Assigned',  cls: 'bg-warning/15  text-orange-700  border-orange-200' },
  OFF_DUTY:  { label: 'Off Duty',  cls: 'bg-muted    text-muted-foreground    border-border' },
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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
        <Car className="w-3 h-3" />
        Driver
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border border-[hsl(var(--purple-200))]">
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
        member.role === 'DRIVER' ? 'bg-success/15 text-success' : 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]';
      return (
        <div className="flex items-center gap-3">
          <div
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-black/5 ${avatarCls}`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {member.fullName}
            </p>
            <p className="text-[11px] text-muted-foreground/70 font-mono leading-tight mt-0.5 truncate">
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
          <Phone className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-sm text-foreground/80">{member.phone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] text-muted-foreground/70 truncate">{member.email}</span>
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
      <span className="text-sm text-muted-foreground font-mono">{member.employeeId}</span>
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
          <MapPin className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate leading-tight">
              {member.assignedRoute}
            </p>
            {member.assignedRouteName && (
              <p className="text-[11px] text-muted-foreground/70 truncate leading-tight mt-0.5">
                {member.assignedRouteName}
              </p>
            )}
          </div>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground/70 italic">Unassigned</span>
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
        className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors duration-100"
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
                <p className="text-xs font-mono text-foreground/80">
                  {driver.license?.licenseNumber ?? '—'}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">
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
              <p className="text-xs font-mono text-foreground/80">
                {conductor.certificateNumber ?? '—'}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
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
                  className="px-1.5 py-0.5 rounded text-[11px] bg-primary/10 text-primary border border-primary/10"
                >
                  {lang}
                </span>
              ))}
              {langs.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-muted text-muted-foreground">
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
      <Car className="w-10 h-10 mb-3 text-muted-foreground/50" />
    ) : mode === 'conductors' ? (
      <UserCheck className="w-10 h-10 mb-3 text-muted-foreground/50" />
    ) : (
      <Users className="w-10 h-10 mb-3 text-muted-foreground/50" />
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
        <div className="flex flex-col items-center py-12 text-muted-foreground/70">
          {emptyIcon}
          <p className="font-medium text-muted-foreground">{emptyLabel}</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      }
    />
  );
}
