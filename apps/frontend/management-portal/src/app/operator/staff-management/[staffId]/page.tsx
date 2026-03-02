'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSetPageMetadata, usePageContext } from '@/context/PageContext';
import { StaffDetailHeader }      from '@/components/operator/staff/StaffDetailHeader';
import { StaffContactCard }       from '@/components/operator/staff/StaffContactCard';
import { StaffCredentialsCard }   from '@/components/operator/staff/StaffCredentialsCard';
import { StaffAssignedTripsCard } from '@/components/operator/staff/StaffAssignedTripsCard';
import { StaffScheduleCard }      from '@/components/operator/staff/StaffScheduleCard';
import { StaffPerformanceCard }   from '@/components/operator/staff/StaffPerformanceCard';
import { StaffEmploymentCard }    from '@/components/operator/staff/StaffEmploymentCard';
import { getStaffById, type StaffMember } from '@/data/operator/staff';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

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

  const { setMetadata } = usePageContext();
  const params  = useParams();
  const staffId = params?.staffId as string;

  const [staff,   setStaff]   = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!staffId) return;
    let mounted = true;
    (async () => {
      const data = await getStaffById(staffId);
      if (mounted) {
        if (!data) setNotFound(true);
        else setStaff(data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [staffId]);

  // Update header when staff data is loaded
  useEffect(() => {
    if (staff) {
      const isDriver = staff.role === 'DRIVER';
      setMetadata({
        // title: staff.fullName,
        title: 'Staff Profile Details',
        description: `${isDriver ? 'Driver' : 'Conductor'} Profile`,
        breadcrumbs: [
          { label: 'Staff Management', href: '/operator/staff-management' },
          { label: staff.fullName },
        ],
      });
    }
  }, [staff, setMetadata]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-500">Loading staff profile…</span>
      </div>
    );
  }

  if (notFound || !staff) {
    return (
      <div className="p-6 max-w-md mx-auto text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Staff Member Not Found</h2>
        <p className="text-gray-500 mb-6">
          The staff member you&apos;re looking for could not be found.
        </p>
        <Link
          href="/operator/staff-management"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Back to Staff Management
        </Link>
      </div>
    );
  }

  const isDriver = staff.role === 'DRIVER';

  return (
    <div className="p-6 space-y-6 mx-auto">
        {/* Profile header */}
        <StaffDetailHeader staff={staff} />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column (narrower) */}
          <div className="space-y-6">
            <StaffContactCard    staff={staff} />
            <StaffEmploymentCard staff={staff} />
            <StaffCredentialsCard staff={staff} />
          </div>

          {/* Right column (wider) */}
          <div className="lg:col-span-2 space-y-6">
            <StaffAssignedTripsCard trips={staff.recentTrips} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StaffScheduleCard   schedule={staff.weeklySchedule} />
              <StaffPerformanceCard performance={staff.performance} />
            </div>
          </div>
        </div>

        {/* Read-only notice */}
        <p className="text-xs text-gray-400 text-center">
          This profile is read-only. Staff records are managed by BusMate administration.
        </p>
    </div>
  );
}
