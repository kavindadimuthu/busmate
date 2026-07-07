'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';
import { DataTable, EmptyState } from '@busmate/ui';
import type { ColumnDef, DataTableProps } from '@busmate/ui';
import {
  USER_STATUS_CONFIG,
  getUserDisplayName,
  timeAgo,
} from '@/data/admin/users';
import type { SystemUser } from '@/data/admin/users';

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
  users: SystemUser[];
  totalItems: number;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
  activeFilters?: Record<string, any>;
}

// ── Component ─────────────────────────────────────────────────────

export function UsersTable({
  users,
  totalItems,
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
  const columns = useMemo<ColumnDef<SystemUser>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        sortable: true,
        width: 'min-w-[220px]',
        cell: ({ row: user }) => {
          const displayName = getUserDisplayName(user);
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">{user.id}</p>
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
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
              {statusConfig.label}
            </span>
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
                  onToggleStatus(user);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-muted-foreground/70 hover:text-warning hover:bg-warning/10'
                    : 'text-muted-foreground/70 hover:text-success hover:bg-success/10'
                }`}
                title={isActive ? 'Deactivate User' : 'Reactivate User'}
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
                  onDelete(user);
                }}
                className="p-1.5 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Delete User"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onToggleStatus, onDelete],
  );

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable<SystemUser>
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

