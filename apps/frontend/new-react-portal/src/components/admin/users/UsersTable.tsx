'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import {
  USER_STATUS_CONFIG,
  getUserDisplayName,
  timeAgo,
} from '@/data/admin/users';
import type { AdminUser } from '@/data/admin/users';

// ── Types ─────────────────────────────────────────────────────────

interface UsersTableProps
  extends Pick<
    DataTableProps<any>,
    | 'page'
    | 'pageSize'
    | 'onPageChange'
    | 'onPageSizeChange'
    | 'sortColumn'
    | 'sortDirection'
    | 'onSort'
    | 'loading'
  > {
  users: AdminUser[];
  totalItems: number;
  /** The signed-in admin's own userId — disables self-deactivation in the actions column. */
  currentUserId?: string | null;
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  activeFilters?: Record<string, any>;
}

// ── Component ─────────────────────────────────────────────────────

export function UsersTable({
  users,
  totalItems,
  currentUserId,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
  loading,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  activeFilters = {},
}: UsersTableProps) {
  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        sortable: true,
        width: 'min-w-[220px]',
        cell: ({ row: user }) => {
          const displayName = getUserDisplayName(user);
          const initials = `${user.firstName[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?';
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">{user.username || user.id}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'email',
        header: 'Email',
        sortable: true,
        width: 'min-w-[200px]',
        cell: ({ row: user }) => (
          <span className="text-muted-foreground truncate block">
            {user.email}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: ({ row: user }) => {
          const statusConfig = USER_STATUS_CONFIG[user.status];
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                {statusConfig.label}
              </span>
              {user.userType === 'operator' && user.operatorSyncStatus && (
                <span title={user.operatorSyncStatus === 'FAILED' ? 'Sync failed' : 'Sync pending'}>
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'lastLogin',
        header: 'Last Login',
        sortable: true,
        width: 'min-w-[110px]',
        cell: ({ row: user }) => (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {timeAgo(user.lastLogin)}
          </span>
        ),
      },
      {
        id: 'createdAt',
        header: 'Created',
        sortable: true,
        width: 'min-w-[110px]',
        cell: ({ row: user }) => (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {timeAgo(user.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: ({ row: user }) => {
          const isActive = user.status === 'active';
          const isSelf = !!currentUserId && user.id === currentUserId;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(user);
                }}
                className="p-1.5 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(user);
                }}
                className="p-1.5 text-muted-foreground/70 hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                title="Edit User"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSelf) onToggleStatus(user);
                }}
                disabled={isSelf}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  isActive
                    ? 'text-muted-foreground/70 hover:text-warning hover:bg-warning/10'
                    : 'text-muted-foreground/70 hover:text-success hover:bg-success/10'
                }`}
                title={isSelf ? "You can't change your own status" : isActive ? 'Deactivate User' : 'Reactivate User'}
              >
                {isActive ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSelf) onDelete(user);
                }}
                disabled={isSelf}
                className="p-1.5 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={isSelf ? "You can't deactivate your own account" : 'Deactivate User'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onToggleStatus, onDelete, currentUserId],
  );

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable<AdminUser>
      columns={columns}
      data={users}
      totalItems={totalItems}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      getRowId={(user) => user.id}
      loading={loading}
      emptyState={
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={hasActiveFilters ? 'No users found matching your criteria' : 'No users found'}
          description={hasActiveFilters ? 'Try adjusting your filters or search term.' : 'Add a new user to get started.'}
        />
      }
    />
  );
}

