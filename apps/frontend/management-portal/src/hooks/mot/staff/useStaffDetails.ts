import { useState } from 'react';
import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { getStaffMemberById } from '@/data/mot/staff';

export function useStaffDetails() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.staffId as string;
  const staff = getStaffMemberById(staffId) || null;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => router.push(`/mot/staff/${staffId}/edit`);
  const handleDelete = () => setShowDeleteModal(true);
  const handleDeleteCancel = () => setShowDeleteModal(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsDeleting(false);
    setShowDeleteModal(false);
    router.push('/mot/staff');
  };

  const handleBack = () => router.back();

  useSetPageMetadata({
    title: staff?.fullName || 'Staff Details',
    description: 'Detailed view of staff member information',
    activeItem: 'staff',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Staff Management', href: '/mot/staff' },
      { label: staff?.fullName || 'Staff Details' },
    ],
  });

  useSetPageActions(
    React.createElement('div', { className: 'flex items-center gap-3 flex-wrap' },
      React.createElement('button', {
        onClick: handleBack,
        className: 'flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors',
      }, React.createElement(ArrowLeft, { className: 'w-4 h-4' }), 'Back'),
      React.createElement('button', {
        onClick: handleEdit,
        className: 'flex items-center gap-2 px-4 py-2 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors',
      }, React.createElement(Edit, { className: 'w-4 h-4' }), 'Edit Staff Member'),
      React.createElement('button', {
        onClick: handleDelete,
        className: 'flex items-center gap-2 px-4 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors',
      }, React.createElement(Trash2, { className: 'w-4 h-4' }), 'Delete'),
    )
  );

  return { staff, showDeleteModal, isDeleting, handleBack, handleDeleteCancel, handleDeleteConfirm };
}
