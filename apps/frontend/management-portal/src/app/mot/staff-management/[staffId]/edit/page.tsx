'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import StaffForm from '@/components/mot/staff/StaffForm';
import type { StaffMember } from '@/data/mot/staff';

export default function EditStaffPage() {
    const router = useRouter();
    const params = useParams();
    const staffId = params.staffId as string;

    useSetPageMetadata({
        title: 'Edit Staff Member',
        description: 'Update staff member information',
        activeItem: 'staff',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Staff Management', href: '/mot/staff-management' }, { label: 'Edit' }],
    });

    useSetPageActions(
        <button
            onClick={() => router.push(`/mot/staff-management/${staffId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Staff Details
        </button>
    );

    const handleSuccess = (staff: StaffMember) => {
        // Redirect back to the staff details page
        router.push(`/mot/staff-management/${staff.id}`);
    };

    const handleCancel = () => {
        router.push(`/mot/staff-management/${staffId}`);
    };

    return (
            <div className="mx-auto space-y-6">
                {/* Form */}
                <StaffForm
                    staffId={staffId}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
    );
}
