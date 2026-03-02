'use client';

import { useMemo } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import type { DataTableColumn } from '@/components/shared/DataTable';

// ── Types ─────────────────────────────────────────────────────────

interface StaffTableData {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  assignedLocation?: string;
  province?: string;
  staffType?: string;
  nic?: string;
  status?: string;
  createdAt?: string;
}

interface StaffTableProps {
  staff: StaffTableData[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onSort: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  activeFilters: Record<string, any>;
  loading: boolean;
  currentSort: { field: string; direction: 'asc' | 'desc' };
}

// ── Helpers ───────────────────────────────────────────────────────

function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getStatusStyle(status?: string): { className: string; Icon: React.ComponentType<{ className?: string }> } {
  switch (status) {
    case 'active':
      return { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', Icon: CheckCircle2 };
    case 'inactive':
      return { className: 'bg-red-50 text-red-600 border border-red-200', Icon: XCircle };
    default:
      return { className: 'bg-gray-50 text-gray-500 border border-gray-200', Icon: Users };
  }
}

function getTypeStyle(type?: string): { className: string; Icon: React.ComponentType<{ className?: string }> } {
  switch (type) {
    case 'timekeeper':
      return { className: 'bg-indigo-50 text-indigo-700 border border-indigo-200', Icon: Clock };
    case 'inspector':
      return { className: 'bg-purple-50 text-purple-700 border border-purple-200', Icon: Search };
    default:
      return { className: 'bg-gray-50 text-gray-500 border border-gray-200', Icon: Users };
  }
}

// ── Main component ────────────────────────────────────────────────

/**
 * Staff data table.
 *
 * Delegates rendering to the shared `<DataTable>` component with
 * staff-specific column definitions and custom cell renderers.
 */
export function StaffTable({
  staff,
  onView,
  onEdit,
  onDelete,
  onSort,
  loading,
  currentSort,
}: StaffTableProps) {
  const columns: DataTableColumn<StaffTableData>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Full Name',
        sortable: true,
        minWidth: 'min-w-[180px]',
        render: (member) => (
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center ring-1 ring-blue-200/60">
              <span className="text-sm font-semibold text-blue-600">
                {member.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {member.fullName}
              </p>
              <p className="text-[11px] text-gray-400 font-mono leading-tight mt-0.5 truncate">
                {member.nic || '—'}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'contact',
        header: 'Contact',
        minWidth: 'min-w-[160px]',
        render: (member) => (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-gray-300 shrink-0" />
              <span className="text-sm text-gray-700">{member.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-gray-300 shrink-0" />
              <span className="text-[11px] text-gray-400 truncate">{member.email || '—'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'staffType',
        header: 'Type',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (member) => {
          const { className, Icon } = getTypeStyle(member.staffType);
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${className}`}>
              <Icon className="w-3.5 h-3.5" />
              {member.staffType || 'Unknown'}
            </span>
          );
        },
      },
      {
        key: 'assignedLocation',
        header: 'Assignment',
        minWidth: 'min-w-[140px]',
        render: (member) => (
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-gray-700 truncate leading-tight">
                {member.assignedLocation || '—'}
              </p>
              {member.province && (
                <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
                  {member.province}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (member) => {
          const { className, Icon } = getStatusStyle(member.status);
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${className}`}>
              <Icon className="w-3.5 h-3.5" />
              {member.status || 'Unknown'}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Joined',
        sortable: true,
        cellClassName: 'whitespace-nowrap',
        render: (member) => (
          <span className="text-xs text-gray-500 tabular-nums">
            {formatDate(member.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center whitespace-nowrap',
        render: (member) => (
          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onView(member.id)}
              title="View details"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(member.id)}
              title="Edit staff member"
              className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(member.id, member.fullName)}
              title="Delete staff member"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable<StaffTableData>
      columns={columns}
      data={staff}
      loading={loading}
      currentSort={currentSort}
      onSort={onSort}
      rowKey={(member) => member.id}
      showRefreshing
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No staff members found</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      }
    />
  );
}
