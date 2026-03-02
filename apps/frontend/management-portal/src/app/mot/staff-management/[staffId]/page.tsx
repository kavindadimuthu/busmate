'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Edit,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { StaffSummary, DeleteStaffModal } from '@/components/mot/staff';
import { getStaffMemberById, StaffMember } from '@/data/mot/staff';

export default function StaffDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const staffId = params.staffId as string;

    // Load staff from sample data
    const staff = getStaffMemberById(staffId) || null;

    // Delete modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handlers
    const handleEdit = () => {
        router.push(`/mot/staff-management/${staffId}/edit`);
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsDeleting(false);
        setShowDeleteModal(false);
        router.push('/mot/staff-management');
    };

    const handleBack = () => {
        router.back();
    };

    useSetPageMetadata({
        title: staff?.fullName || 'Staff Details',
        description: 'Detailed view of staff member information',
        activeItem: 'staff',
        showBreadcrumbs: true,
        breadcrumbs: [{ label: 'Staff Management', href: '/mot/staff-management' }, { label: staff?.fullName || 'Staff Details' }],
    });

    useSetPageActions(
        <div className="flex items-center gap-3 flex-wrap">
            <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </button>
            <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
                <Edit className="w-4 h-4" />
                Edit Staff Member
            </button>
            <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </button>
        </div>
    );

    // Error state
    if (!staff) {
        return (
                <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <div className="text-red-600 text-lg mb-4">
                        Staff member not found
                    </div>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
        );
    }

    return (
            <div className="space-y-6">
                {/* Staff Summary Card */}
                <StaffSummary staff={staff} />

                {/* Delete Staff Modal */}
                <DeleteStaffModal
                    isOpen={showDeleteModal}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    staff={staff}
                    isDeleting={isDeleting}
                />
            </div>
    );
}
