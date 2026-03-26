'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useSetPageMetadata } from '@/context/PageContext';
import { StaffDetailHeader } from '@/components/operator/staff/StaffDetailHeader';
import { StaffContactCard } from '@/components/operator/staff/StaffContactCard';
import { StaffCredentialsCard } from '@/components/operator/staff/StaffCredentialsCard';
import { StaffAssignedTripsCard } from '@/components/operator/staff/StaffAssignedTripsCard';
import { StaffScheduleCard } from '@/components/operator/staff/StaffScheduleCard';
import { StaffPerformanceCard } from '@/components/operator/staff/StaffPerformanceCard';
import { StaffEmploymentCard } from '@/components/operator/staff/StaffEmploymentCard';
import { useStaffDetail } from '@/components/operator/staff/useStaffDetail';

export default function StaffDetailPage() {
  useSetPageMetadata({
    title: 'Staff Profile',
    description: 'Staff member details',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Staff Management', href: '/operator/staff-management' },
      { label: 'Staff Profile' },
    ],
    padding: 0,
  });

  const { staff, loading, notFound } = useStaffDetail();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3 text-muted-foreground">Loading staff profile…</span>
      </div>
    );
  }

  if (notFound || !staff) {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-warning/70 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Staff Member Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The staff member you&apos;re looking for could not be found.
        </p>
        <Link
          href="/operator/staff-management"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
        >
          Back to Staff Management
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      <StaffDetailHeader staff={staff} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <StaffContactCard staff={staff} />
          <StaffEmploymentCard staff={staff} />
          <StaffCredentialsCard staff={staff} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <StaffAssignedTripsCard trips={staff.recentTrips} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StaffScheduleCard schedule={staff.weeklySchedule} />
            <StaffPerformanceCard performance={staff.performance} />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground/70 text-center">
        This profile is read-only. Staff records are managed by BusMate administration.
      </p>
    </div>
  );
}
