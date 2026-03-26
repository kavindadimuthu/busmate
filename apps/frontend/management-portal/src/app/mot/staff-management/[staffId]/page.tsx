'use client';

import { AlertCircle } from 'lucide-react';
import { StaffSummary, DeleteStaffModal } from '@/components/mot/staff';
import { useStaffDetails } from '@/components/mot/staff/useStaffDetails';

export default function StaffDetailsPage() {
  const { staff, showDeleteModal, isDeleting, handleBack, handleDeleteCancel, handleDeleteConfirm } = useStaffDetails();

  if (!staff) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive/70 mx-auto mb-4" />
        <div className="text-destructive text-lg mb-4">Staff member not found</div>
        <button onClick={handleBack} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaffSummary staff={staff} />
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
