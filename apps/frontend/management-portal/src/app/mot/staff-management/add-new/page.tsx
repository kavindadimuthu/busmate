'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import StaffForm from '@/components/mot/staff/StaffForm';
import type { StaffMember } from '@/data/mot/staff';

export default function AddNewStaffPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Staff Member',
    description: 'Create a new staff member',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Staff Management', href: '/mot/staff-management' }, { label: 'Add New' }],
  });

  useSetPageActions(
    <button
      onClick={() => router.push('/mot/staff-management')}
      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      Back to Staff Management
    </button>
  );

  const handleSuccess = (staff: StaffMember) => {
    // Redirect to the newly created staff member's details page
    if (staff?.id) {
      router.push(`/mot/staff-management/${staff.id}`);
    } else {
      router.push('/mot/staff-management');
    }
  };

  const handleCancel = () => {
    router.push('/mot/staff-management');
  };

  return (
      <div className="mx-auto space-y-6">
        {/* Form */}
        <StaffForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
  );
}
