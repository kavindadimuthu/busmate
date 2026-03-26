'use client';

import React from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import {
  ActionButton,
  ActionButtonsContainer,
} from '@/components/shared/ActionButton';
import type { OverflowMenuItem } from '@/components/shared/ActionButton';

interface NotificationDetailActionsProps {
  isReceived: boolean;
  isRead: boolean;
  onToggleRead: () => void;
  onDelete: () => void;
  hasNotification: boolean;
}

export function NotificationDetailActions({
  isReceived,
  isRead,
  onToggleRead,
  onDelete,
  hasNotification,
}: NotificationDetailActionsProps) {
  if (!hasNotification) return null;

  const overflowItems: OverflowMenuItem[] = [
    ...(isReceived
      ? [{ icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: isRead ? 'Marked as Read' : 'Mark as Read', onClick: onToggleRead }]
      : []),
    { icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', onClick: onDelete, variant: 'danger' as const },
  ];

  return (
    <ActionButtonsContainer overflowItems={overflowItems}>
      {isReceived && (
        <ActionButton
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={isRead ? 'Marked as Read' : 'Mark as Read'}
          variant={isRead ? 'success' : 'secondary'}
          onClick={onToggleRead}
          className="hidden sm:inline-flex"
        />
      )}
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
