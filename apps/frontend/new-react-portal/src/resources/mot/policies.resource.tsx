import { FileText, CheckCircle, Edit, Eye, Archive, Edit2, Trash2 } from 'lucide-react';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { policiesColumns } from '@/components/mot/policies/PoliciesColumns';
import {
  getPolicies,
  getPolicyStatistics,
  getPolicyFilterOptions,
  type Policy,
} from '@/data/mot/policies';

export interface PolicyFilters {
  status: string;
  type: string;
  department: string;
  priority: string;
}

/** Policies runs on client-side mock data (@/data/mot/policies) — filter/sort/paginate in api.list. */
export const policiesResource: ResourceConfig<Policy, PolicyFilters> = defineResource<Policy, PolicyFilters>({
  name: 'policies',
  title: 'Policy',
  getRowId: (p) => p.id,

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      let list = getPolicies();

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.type.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q) ||
            p.department.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q),
        );
      }
      if (filters.status !== '__all__') list = list.filter((p) => p.status === filters.status);
      if (filters.type !== '__all__') list = list.filter((p) => p.type === filters.type);
      if (filters.department !== '__all__') list = list.filter((p) => p.department === filters.department);
      if (filters.priority !== '__all__') list = list.filter((p) => p.priority === filters.priority);

      const col = sortColumn || 'lastModified';
      const dir = sortDirection === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = (a as any)[col] ?? '';
        const bv = (b as any)[col] ?? '';
        return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
      });

      const start = (page - 1) * pageSize;
      return { content: list.slice(start, start + pageSize), totalElements: list.length };
    },
    stats: async () => getPolicyStatistics(),
    filterOptions: async () => getPolicyFilterOptions(),
    remove: async () => {
      await new Promise((r) => setTimeout(r, 1000));
    },
    exportAll: async () => {
      const rows = getPolicies().map((p) => ({
        ID: p.id, Title: p.title, Type: p.type, Status: p.status, Version: p.version,
        Author: p.author, Department: p.department, Priority: p.priority,
        'Effective Date': p.effectiveDate, 'Last Modified': p.lastModified,
      }));
      const headers = Object.keys(rows[0] || {});
      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => {
            const v = row[h as keyof typeof row];
            return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
          }).join(','),
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `policies-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },

  columns: policiesColumns as any,

  emptyState: (
    <EmptyState icon={<FileText className="h-8 w-8" />} title="No policies found" description="Try adjusting your search or filters." />
  ),

  initialSort: { column: 'lastModified', direction: 'desc' },
  initialFilters: { status: '__all__', type: '__all__', department: '__all__', priority: '__all__' },
  searchPlaceholder: 'Search by title, type, author, or department…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-40' },
    { key: 'type', label: 'Type', optionsKey: 'types', width: 'w-40' },
    { key: 'department', label: 'Department', optionsKey: 'departments', width: 'w-44' },
    { key: 'priority', label: 'Priority', optionsKey: 'priorities', width: 'w-36' },
  ],

  mapStats: (raw) => {
    const r = raw as ReturnType<typeof getPolicyStatistics>;
    return [
      { label: 'Total Policies', value: String(r.totalPolicies ?? 0), icon: <FileText className="h-5 w-5" /> },
      { label: 'Published', value: String(r.publishedPolicies ?? 0), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Drafts', value: String(r.draftPolicies ?? 0), icon: <Edit className="h-5 w-5" /> },
      { label: 'Under Review', value: String(r.underReviewPolicies ?? 0), icon: <Eye className="h-5 w-5" /> },
      { label: 'Archived', value: String(r.archivedPolicies ?? 0), icon: <Archive className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as ReturnType<typeof getPolicyFilterOptions>;
    return {
      statuses: r.statuses.map((s) => ({ value: s, label: s })),
      types: r.types.map((t) => ({ value: t, label: t })),
      departments: r.departments.map((d) => ({ value: d, label: d })),
      priorities: r.priorities.map((p) => ({ value: p, label: p })),
    };
  },

  deleteConfirm: (p) => ({
    title: 'Delete Policy',
    description: `Are you sure you want to delete "${p?.title ?? 'this policy'}"? This action cannot be undone.`,
    confirmLabel: 'Delete Policy',
  }),

  messages: { deleteSuccess: (p) => `Policy "${p.title}" deleted successfully!`, loadError: 'Failed to load policies' },

  rowActions: ({ row: policy, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/policies/${policy.id}`)} title="View Policy">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/policies/${policy.id}/edit`)} title="Edit Policy">
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => controller.deleteDialog.open(policy)} title="Delete Policy">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  ),
});
