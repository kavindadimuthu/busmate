'use client';

import React from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { ActionButton, ActionButtonsContainer } from '@/components/shared/ActionButton';

// ── Types ─────────────────────────────────────────────────────────

interface UserActionButtonsProps {
  onAddUser: () => void;
  onImportUsers?: () => void;
  onExportAll?: () => void;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────

export function UserActionButtons({
  onAddUser,
  onImportUsers,
  onExportAll,
  isLoading = false,
}: UserActionButtonsProps) {
  const overflowItems = [];

  if (onImportUsers) {
    overflowItems.push({
      icon: <Upload className="h-3.5 w-3.5" />,
      label: 'Import',
      onClick: onImportUsers,
      disabled: isLoading,
    });
  }

  if (onExportAll) {
    overflowItems.push({
      icon: <Download className="h-3.5 w-3.5" />,
      label: 'Export All',
      onClick: onExportAll,
      disabled: isLoading,
    });
  }

  return (
    <ActionButtonsContainer
      overflowItems={overflowItems.length > 0 ? overflowItems : undefined}
    >
      <ActionButton
        icon={<Plus className="h-4 w-4" />}
        label="Add User"
        variant="primary"
        onClick={onAddUser}
        disabled={isLoading}
      />
      {onImportUsers && (
        <ActionButton
          icon={<Upload className="h-4 w-4" />}
          label="Import"
          variant="ghost"
          onClick={onImportUsers}
          disabled={isLoading}
          className="hidden sm:inline-flex"
        />
      )}
      {onExportAll && (
        <ActionButton
          icon={<Download className="h-4 w-4" />}
          label="Export All"
          variant="secondary"
          onClick={onExportAll}
          disabled={isLoading}
          className="hidden sm:inline-flex"
        />
      )}
    </ActionButtonsContainer>
  );
}
