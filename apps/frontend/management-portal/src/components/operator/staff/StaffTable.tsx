'use client';

import { useMemo } from 'react';
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
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import type { StaffMember, Driver, Conductor } from '@/data/operator/staff';

// ── Types ─────────────────────────────────────────────────────────

export type StaffTableMode = 'all' | 'drivers' | 'conductors';

interface StaffTableProps
  extends Pick<
    DataTableProps<any>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  staff: StaffMember[];
  mode: StaffTableMode;
  totalItems: number;
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

function buildStaffColumn(): ColumnDef<StaffMember> {
  return {
    id: 'fullName',
    header: 'Staff',
    sortable: true,
    width: 'min-w-[180px]',
    cell: ({ row: member }) => {
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

function buildContactColumn(): ColumnDef<StaffMember> {
  return {
    id: 'contact',
    header: 'Contact',
    width: 'min-w-[160px]',
    cell: ({ row: member }) => (
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

function buildEmployeeIdColumn(): ColumnDef<StaffMember> {
  return {
    id: 'employeeId',
    header: 'Employee ID',
    sortable: true,
    cell: ({ row: member }) => (
      <span className="text-sm text-muted-foreground font-mono whitespace-nowrap">{member.employeeId}</span>
    ),
  };
}

function buildRouteColumn(): ColumnDef<StaffMember> {
  return {
    id: 'assignedRoute',
    header: 'Assigned Route',
    width: 'min-w-[140px]',
    cell: ({ row: member }) =>
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

function buildStatusColumn(): ColumnDef<StaffMember> {
  return {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: ({ row: member }) => <StatusBadge status={member.status} />,
  };
}

function buildShiftColumn(): ColumnDef<StaffMember> {
  return {
    id: 'shiftStatus',
    header: 'Shift',
    cell: ({ row: member }) => <ShiftBadge shift={member.shiftStatus} />,
  };
}

function buildActionsColumn(): ColumnDef<StaffMember> {
  return {
    id: 'actions',
    header: 'Actions',
    align: 'center',
    cell: ({ row: member }) => (
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
  loading,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
}: StaffTableProps) {
  const columns = useMemo((): ColumnDef<StaffMember>[] => {
    if (mode === 'all') {
      return [
        buildStaffColumn(),
        buildEmployeeIdColumn(),
        buildContactColumn(),
        {
          id: 'role',
          header: 'Role',
          cell: ({ row: member }) => <RoleBadge role={member.role} />,
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
          id: 'license',
          header: 'License',
          width: 'min-w-[130px]',
          cell: ({ row: member }) => {
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
        id: 'certificate',
        header: 'Certificate',
        width: 'min-w-[130px]',
        cell: ({ row: member }) => {
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
        id: 'languages',
        header: 'Languages',
        width: 'min-w-[110px]',
        cell: ({ row: member }) => {
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
      <Car className="h-8 w-8" />
    ) : mode === 'conductors' ? (
      <UserCheck className="h-8 w-8" />
    ) : (
      <Users className="h-8 w-8" />
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
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(member) => member.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={emptyIcon}
          title={emptyLabel}
          description="Try adjusting your search or filters"
        />
      }
    />
  );
}
