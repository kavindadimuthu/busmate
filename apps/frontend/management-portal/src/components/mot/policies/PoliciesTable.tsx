'use client';

import { FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/shared/DataTable';
import { Policy } from '@/data/mot/policies';

interface PoliciesTableProps {
    policies: Policy[];
    onView: (policyId: string) => void;
    onEdit: (policyId: string) => void;
    onDelete: (policy: Policy) => void;
    onSort: (field: string, direction: 'asc' | 'desc') => void;
    currentSort: { field: string; direction: 'asc' | 'desc' };
    loading?: boolean;
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'published':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'draft':
            return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'under review':
            return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'archived':
            return 'bg-gray-100 text-gray-600 border border-gray-200';
        default:
            return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high':
            return 'bg-red-50 text-red-700 border border-red-200';
        case 'medium':
            return 'bg-orange-50 text-orange-700 border border-orange-200';
        case 'low':
            return 'bg-gray-50 text-gray-600 border border-gray-200';
        default:
            return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
};

export function PoliciesTable({
    policies,
    onView,
    onEdit,
    onDelete,
    onSort,
    currentSort,
    loading,
}: PoliciesTableProps) {
    const columns: DataTableColumn<Policy>[] = [
        {
            key: 'title',
            header: 'Policy Title',
            sortable: true,
            minWidth: 'min-w-[200px]',
            render: (policy) => (
                <div className="flex items-center gap-2.5">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center ring-1 ring-blue-200/60">
                        <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate leading-tight">{policy.title}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">{policy.department}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (policy) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    {policy.type}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            cellClassName: 'whitespace-nowrap',
            render: (policy) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(policy.status)}`}>
                    {policy.status}
                </span>
            ),
        },
        {
            key: 'priority',
            header: 'Priority',
            cellClassName: 'whitespace-nowrap',
            render: (policy) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getPriorityColor(policy.priority)}`}>
                    {policy.priority}
                </span>
            ),
        },
        {
            key: 'version',
            header: 'Version',
            render: (policy) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-gray-600 bg-gray-100 border border-gray-200">
                    {policy.version}
                </span>
            ),
        },
        {
            key: 'lastModified',
            header: 'Last Modified',
            sortable: true,
            cellClassName: 'whitespace-nowrap',
            render: (policy) => (
                <span className="text-xs text-gray-500 tabular-nums">{policy.lastModified}</span>
            ),
        },
        {
            key: 'author',
            header: 'Author',
            render: (policy) => (
                <span className="text-sm text-gray-600">{policy.author}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'text-center',
            cellClassName: 'text-center whitespace-nowrap',
            render: (policy) => (
                <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors duration-100"
                        onClick={() => onView(policy.id)}
                        title="View Policy"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors duration-100"
                        onClick={() => onEdit(policy.id)}
                        title="Edit Policy"
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors duration-100"
                        onClick={() => onDelete(policy)}
                        title="Delete Policy"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <DataTable<Policy>
            columns={columns}
            data={policies}
            loading={loading}
            currentSort={currentSort}
            onSort={onSort}
            rowKey={(policy) => policy.id}
            showRefreshing
            emptyState={
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                        <FileText className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No policies found</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Try adjusting your search or filters, or upload a new policy.
                    </p>
                </div>
            }
        />
    );
}
