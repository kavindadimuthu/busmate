'use client';

import React from 'react';
import {
  Edit,
  Trash2,
} from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface RouteGroupActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

/**
 * Route group page action buttons.
 *
 * Wraps the shared `<ActionButton>` and `<ActionButtonsContainer>` components
 * with route-group-specific actions.
 */
export function RouteGroupActionButtons({
  onEdit,
  onDelete,
  isDeleting = false,
}: RouteGroupActionButtonsProps) {
  const overflowItems: OverflowMenuItem[] = [
    { 
      icon: <Edit className="h-3.5 w-3.5" />, 
      label: 'Edit Route Group', 
      onClick: onEdit, 
      disabled: isDeleting 
    },
    { 
      icon: <Trash2 className="h-3.5 w-3.5" />, 
      label: isDeleting ? 'Deleting...' : 'Delete Route Group', 
      onClick: onDelete, 
      disabled: isDeleting,
      variant: 'danger' as const,
    },
  ];

  return (
    <ActionButtonsContainer overflowItems={overflowItems}>
      {/* Edit — sm+ only */}
      <ActionButton
        icon={<Edit className="h-4 w-4" />}
        label="Edit"
        variant="secondary"
        onClick={onEdit}
        disabled={isDeleting}
        className="hidden sm:inline-flex"
      />

      {/* Delete — sm+ only */}
      <ActionButton
        icon={<Trash2 className="h-4 w-4" />}
        label={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onClick={onDelete}
        disabled={isDeleting}
        className="hidden sm:inline-flex"
      />
    </ActionButtonsContainer>
  );
}
