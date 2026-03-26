'use client';

import React from 'react';
import { Edit, Trash2, Power, Copy, RefreshCw } from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface ScheduleDetailsActionsProps {
  status?: string;
  onRefresh: () => void;
  onClone: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ScheduleDetailsActions({
  status,
  onRefresh,
  onClone,
  onDeactivate,
  onActivate,
  onEdit,
  onDelete,
}: ScheduleDetailsActionsProps) {
  const isActive = status === 'ACTIVE';

  const overflowItems: OverflowMenuItem[] = [
    { icon: <RefreshCw className="h-3.5 w-3.5" />, label: 'Refresh', onClick: onRefresh },
    { icon: <Copy className="h-3.5 w-3.5" />, label: 'Clone', onClick: onClone },
    isActive
      ? { icon: <Power className="h-3.5 w-3.5" />, label: 'Deactivate', onClick: onDeactivate, variant: 'warning' as const }
      : { icon: <Power className="h-3.5 w-3.5" />, label: 'Activate', onClick: onActivate },
    { icon: <Edit className="h-3.5 w-3.5" />, label: 'Edit', onClick: onEdit },
    { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', onClick: onDelete, variant: 'danger' as const },
  ];

  return (
    <ActionButtonsContainer overflowItems={overflowItems}>
      <ActionButton
        icon={<RefreshCw className="h-4 w-4" />}
        label="Refresh"
        variant="secondary"
        onClick={onRefresh}
        className="hidden sm:inline-flex"
      />
      <ActionButton
        icon={<Copy className="h-4 w-4" />}
        label="Clone"
        variant="secondary"
        onClick={onClone}
        className="hidden sm:inline-flex"
      />
      {isActive ? (
        <ActionButton
          icon={<Power className="h-4 w-4" />}
          label="Deactivate"
          variant="warning"
          onClick={onDeactivate}
          className="hidden sm:inline-flex"
        />
      ) : (
        <ActionButton
          icon={<Power className="h-4 w-4" />}
          label="Activate"
          variant="success"
          onClick={onActivate}
          className="hidden sm:inline-flex"
        />
      )}
      <ActionButton
        icon={<Edit className="h-4 w-4" />}
        label="Edit"
        variant="primary"
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
