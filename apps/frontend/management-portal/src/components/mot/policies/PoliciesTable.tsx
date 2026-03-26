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
            return 'bg-success/10 text-success border border-success/20';
        case 'draft':
            return 'bg-warning/10 text-warning border border-warning/20';
        case 'under review':
            return 'bg-primary/10 text-primary border border-primary/20';
        case 'archived':
            return 'bg-muted text-muted-foreground border border-border';
        default:
            return 'bg-muted text-muted-foreground border border-border';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'high':
            return 'bg-destructive/10 text-destructive border border-destructive/20';
        case 'medium':
            return 'bg-warning/10 text-orange-700 border border-orange-200';
        case 'low':
            return 'bg-muted text-muted-foreground border border-border';
        default:
            return 'bg-muted text-muted-foreground border border-border';
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
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-blue-200/60">
                        <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate leading-tight">{policy.title}</div>
                        <div className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{policy.department}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            render: (policy) => (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted border border-border">
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
                <span className="text-xs text-muted-foreground tabular-nums">{policy.lastModified}</span>
            ),
        },
        {
            key: 'author',
            header: 'Author',
            render: (policy) => (
                <span className="text-sm text-muted-foreground">{policy.author}</span>
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
                        className="p-1.5 rounded-lg text-primary/80 hover:bg-primary/10 transition-colors duration-100"
                        onClick={() => onView(policy.id)}
                        title="View Policy"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                        className="p-1.5 rounded-lg text-warning/80 hover:bg-warning/10 transition-colors duration-100"
                        onClick={() => onEdit(policy.id)}
                        title="Edit Policy"
                    >
                        <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                        className="p-1.5 rounded-lg text-destructive/80 hover:bg-destructive/10 transition-colors duration-100"
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
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <FileText className="w-7 h-7 text-primary/70" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">No policies found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Try adjusting your search or filters, or upload a new policy.
                    </p>
                </div>
            }
        />
    );
}
