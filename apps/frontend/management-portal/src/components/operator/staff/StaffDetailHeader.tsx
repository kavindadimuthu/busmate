'use client';

import { ArrowLeft, Car, UserCheck, CheckCircle, XCircle, AlertCircle, Clock, MapPin, Bus } from 'lucide-react';
import Link from 'next/link';
import type { StaffMember } from '@/data/operator/staff';

interface StaffDetailHeaderProps {
  staff: StaffMember;
}

function StatusBadge({ status }: { status: StaffMember['status'] }) {
  const map = {
    ACTIVE:    { label: 'Active',    cls: 'bg-green-100 text-green-800 border-green-200',    icon: <CheckCircle className="w-4 h-4" /> },
    INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-700 border-gray-200',       icon: <XCircle className="w-4 h-4" /> },
    ON_LEAVE:  { label: 'On Leave',  cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <AlertCircle className="w-4 h-4" /> },
    SUSPENDED: { label: 'Suspended', cls: 'bg-red-100 text-red-800 border-red-200',           icon: <XCircle className="w-4 h-4" /> },
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
    AVAILABLE: { label: 'Available', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ASSIGNED:  { label: 'On Duty / Assigned',  cls: 'bg-orange-100 text-orange-800 border-orange-200' },
    OFF_DUTY:  { label: 'Off Duty',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
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
  const avatarBg = isDriver ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
  const roleBg   = isDriver ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200';
  const RoleIcon = isDriver ? Car : UserCheck;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
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
              <h1 className="text-2xl font-bold text-gray-900">{staff.fullName}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBg}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {isDriver ? 'Driver' : 'Conductor'}
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-3">{staff.employeeId} • Joined {new Date(staff.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={staff.status} />
              <ShiftBadge shift={staff.shiftStatus} />
            </div>
          </div>

          {/* Current assignment pill */}
          {staff.assignedRoute && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center min-w-44">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Bus className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Current Assignment</span>
              </div>
              <p className="text-sm font-bold text-blue-900">{staff.assignedRoute}</p>
              <p className="text-xs text-blue-700 truncate max-w-40">{staff.assignedRouteName}</p>
              {staff.assignedBusRegistration && (
                <p className="text-xs text-blue-500 mt-0.5">{staff.assignedBusRegistration}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
