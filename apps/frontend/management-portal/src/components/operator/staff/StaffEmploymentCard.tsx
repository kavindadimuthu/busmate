'use client';

import { Briefcase, Building2, CalendarDays } from 'lucide-react';
import type { StaffMember } from '@/data/operator/staff';

interface StaffEmploymentCardProps {
  staff: StaffMember;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-48 truncate">{value}</span>
    </div>
  );
}

export function StaffEmploymentCard({ staff }: StaffEmploymentCardProps) {
  const joined = new Date(staff.joinedDate);
  const now    = new Date();
  const yearsWithCompany = now.getFullYear() - joined.getFullYear();
  const monthsWithCompany = now.getMonth() - joined.getMonth() + yearsWithCompany * 12;
  const tenure = monthsWithCompany >= 12
    ? `${Math.floor(monthsWithCompany / 12)} year${Math.floor(monthsWithCompany / 12) !== 1 ? 's' : ''}`
    : `${monthsWithCompany} month${monthsWithCompany !== 1 ? 's' : ''}`;

  const roleLabel = staff.role === 'DRIVER' ? 'Driver' : 'Conductor';

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
        <Briefcase className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Employment Details</h2>
      </div>

      <div className="px-5 py-4">
        <InfoRow label="Employee ID"    value={staff.employeeId} />
        <InfoRow label="Role"           value={roleLabel} />
        <InfoRow label="Department"     value={staff.department} />
        <InfoRow
          label="Date Joined"
          value={joined.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        />
        <InfoRow label="Tenure"         value={tenure} />
        <InfoRow
          label="Assigned Bus"
          value={staff.assignedBusRegistration ?? 'Not assigned'}
        />
        <InfoRow
          label="Assigned Route"
          value={staff.assignedRoute ? `${staff.assignedRoute} – ${staff.assignedRouteName}` : 'Not assigned'}
        />
      </div>
    </div>
  );
}
