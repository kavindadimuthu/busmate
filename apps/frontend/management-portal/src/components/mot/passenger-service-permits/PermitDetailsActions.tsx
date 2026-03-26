'use client';

import React from 'react';
import { ArrowLeft, Edit, Trash2, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface PermitDetailsActionsProps {
  onBack: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PermitDetailsActions({
  onBack,
  onRefresh,
  onEdit,
  onDelete,
}: PermitDetailsActionsProps) {
  const overflowItems: OverflowMenuItem[] = [
    { icon: <ArrowLeft className="h-3.5 w-3.5" />, label: 'Back', onClick: onBack },
    { icon: <RefreshCw className="h-3.5 w-3.5" />, label: 'Refresh', onClick: onRefresh },
    { icon: <Edit className="h-3.5 w-3.5" />, label: 'Edit Permit', onClick: onEdit },
    { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', onClick: onDelete, variant: 'danger' as const },
  ];

  return (
    <ActionButtonsContainer overflowItems={overflowItems}>
      <ActionButton
        icon={<ArrowLeft className="h-4 w-4" />}
        label="Back"
        variant="secondary"
        onClick={onBack}
        className="hidden sm:inline-flex"
      />
      <ActionButton
        icon={<RefreshCw className="h-4 w-4" />}
        label="Refresh"
        variant="secondary"
        onClick={onRefresh}
        className="hidden sm:inline-flex"
      />
      <ActionButton
        icon={<Edit className="h-4 w-4" />}
        label="Edit Permit"
        variant="secondary"
        onClick={onEdit}
        className="hidden sm:inline-flex"
      />
      <ActionButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        variant="danger"
        onClick={onDelete}
        className="hidden sm:inline-flex"
      />
    </ActionButtonsContainer>
  );
}
