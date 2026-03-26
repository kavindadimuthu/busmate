'use client';

import { ArrowLeft, Car, UserCheck, CheckCircle, XCircle, AlertCircle, Clock, MapPin, Bus } from 'lucide-react';
import Link from 'next/link';
import type { StaffMember } from '@/data/operator/staff';

interface StaffDetailHeaderProps {
  staff: StaffMember;
}

function StatusBadge({ status }: { status: StaffMember['status'] }) {
  const map = {
    ACTIVE:    { label: 'Active',    cls: 'bg-success/15 text-success border-success/20',    icon: <CheckCircle className="w-4 h-4" /> },
    INACTIVE:  { label: 'Inactive',  cls: 'bg-muted text-foreground/80 border-border',       icon: <XCircle className="w-4 h-4" /> },
    ON_LEAVE:  { label: 'On Leave',  cls: 'bg-warning/15 text-warning border-warning/20', icon: <AlertCircle className="w-4 h-4" /> },
    SUSPENDED: { label: 'Suspended', cls: 'bg-destructive/15 text-destructive border-destructive/20',           icon: <XCircle className="w-4 h-4" /> },
  } as const;
  const { label, cls, icon } = map[status] ?? map.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

function ShiftBadge({ shift }: { shift: StaffMember['shiftStatus'] }) {
  const map = {
    AVAILABLE: { label: 'Available', cls: 'bg-success/15 text-success border-success/20' },
    ASSIGNED:  { label: 'On Duty / Assigned',  cls: 'bg-warning/15 text-warning border-orange-200' },
    OFF_DUTY:  { label: 'Off Duty',  cls: 'bg-muted text-muted-foreground border-border' },
  } as const;
  const { label, cls } = map[shift] ?? map.OFF_DUTY;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cls}`}>
      <Clock className="w-3.5 h-3.5" />{label}
    </span>
  );
}

export function StaffDetailHeader({ staff }: StaffDetailHeaderProps) {
  const isDriver = staff.role === 'DRIVER';
  const avatarBg = isDriver ? 'bg-success/15 text-success' : 'bg-[hsl(var(--purple-100))] text-[hsl(var(--purple-700))]';
  const roleBg   = isDriver ? 'bg-success/10 text-success border-success/20' : 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))] border-[hsl(var(--purple-200))]';
  const RoleIcon = isDriver ? Car : UserCheck;

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Profile section */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl ${avatarBg} flex items-center justify-center text-2xl font-bold shrink-0`}>
            {staff.avatarInitials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{staff.fullName}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBg}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {isDriver ? 'Driver' : 'Conductor'}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{staff.employeeId} • Joined {new Date(staff.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={staff.status} />
              <ShiftBadge shift={staff.shiftStatus} />
            </div>
          </div>

          {/* Current assignment pill */}
          {staff.assignedRoute && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center min-w-44">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Bus className="w-4 h-4 text-primary/80" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Current Assignment</span>
              </div>
              <p className="text-sm font-bold text-primary">{staff.assignedRoute}</p>
              <p className="text-xs text-primary truncate max-w-40">{staff.assignedRouteName}</p>
              {staff.assignedBusRegistration && (
                <p className="text-xs text-primary/80 mt-0.5">{staff.assignedBusRegistration}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
