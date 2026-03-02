'use client';

import React, { useMemo } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { DataTable, type DataTableColumn, type SortState } from '@/components/shared/DataTable';
import {
  USER_TYPE_CONFIG,
  USER_STATUS_CONFIG,
  getUserDisplayName,
  timeAgo,
} from '@/data/admin/users';
import type { SystemUser } from '@/data/admin/users';

// ── Types ─────────────────────────────────────────────────────────

interface UsersTableProps {
  users: SystemUser[];
  loading?: boolean;
  currentSort: { sortBy: string; sortOrder: 'asc' | 'desc' };
  onSort: (field: string) => void;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
  activeFilters?: Record<string, any>;
}

// ── Component ─────────────────────────────────────────────────────

export function UsersTable({
  users,
  loading = false,
  currentSort,
  onSort,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  activeFilters = {},
}: UsersTableProps) {
  const columns = useMemo<DataTableColumn<SystemUser>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        minWidth: 'min-w-[220px]',
        render: (user) => {
          const displayName = getUserDisplayName(user);
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.id}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        minWidth: 'min-w-[200px]',
        render: (user) => (
          <span className="text-gray-600 truncate block">
            {user.email}
          </span>
        ),
      },
      {
        key: 'userType',
        header: 'Type',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (user) => {
          const typeConfig = USER_TYPE_CONFIG[user.userType];
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.bgColor} ${typeConfig.color} ${typeConfig.borderColor}`}
            >
              {typeConfig.label}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (user) => {
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
        key: 'lastLogin',
        header: 'Last Login',
        sortable: true,
        minWidth: 'min-w-[110px]',
        render: (user) => (
          <span className="text-gray-500 text-xs whitespace-nowrap">
            {timeAgo(user.lastLogin)}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        sortable: true,
        minWidth: 'min-w-[110px]',
        render: (user) => (
          <span className="text-gray-500 text-xs whitespace-nowrap">
            {timeAgo(user.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        render: (user) => {
          const isActive = user.status === 'active';
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(user);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(user);
                }}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                    ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
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
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    onSort(sortBy);
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <DataTable<SystemUser>
      columns={columns}
      data={users}
      loading={loading}
      currentSort={{ field: currentSort.sortBy, direction: currentSort.sortOrder }}
      onSort={handleSort}
      rowKey={(user) => user.id}
      showRefreshing={loading && users.length > 0}
      rowClassName={() => 'hover:bg-blue-50/30 cursor-pointer'}
      emptyState={
        <div className="text-center py-16 px-4">
          <p className="text-gray-500 text-sm">
            {hasActiveFilters
              ? 'No users found matching your criteria.'
              : 'No users found.'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {hasActiveFilters
              ? 'Try adjusting your filters or search term.'
              : 'Add a new user to get started.'}
          </p>
        </div>
      }
    />
  );
}

