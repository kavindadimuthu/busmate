import { Building, CheckCircle, XCircle, MapPin, Users, Eye, Edit2, Trash2 } from 'lucide-react';
import {
  OperatorManagementService,
  type OperatorFilterOptionsResponse,
  type OperatorStatisticsResponse,
} from '@busmate/api-client-core';
import { UsersControllerService } from '@busmate/api-client-user';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { operatorsColumns } from '@/components/mot/operators/OperatorsColumns';
import type { OperatorResponseWithLink } from '@/types/operator';

export interface OperatorFilters {
  status: string;
  operatorType: string;
  region: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: 'PRIVATE', label: 'Private' },
  { value: 'CTB', label: 'CTB' },
];

function exportOperators(rows: OperatorResponseWithLink[]) {
  const dataToExport = rows.map((o) => ({
    ID: o.id || '',
    Name: o.name || '',
    'Operator Type': o.operatorType || '',
    Region: o.region || '',
    Status: o.status || '',
    'Created At': o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
    'Updated At': o.updatedAt ? new Date(o.updatedAt).toLocaleDateString() : '',
  }));
  if (dataToExport.length === 0) return;
  const headers = Object.keys(dataToExport[0]);
  const csv = [
    headers.join(','),
    ...dataToExport.map((row) =>
      headers
        .map((h) => {
          const v = row[h as keyof typeof row];
          return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
        })
        .join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `operators-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const operatorsResource: ResourceConfig<OperatorResponseWithLink, OperatorFilters> = defineResource<
  OperatorResponseWithLink,
  OperatorFilters
>({
  name: 'operators',
  title: 'Operators',
  getRowId: (op) => op.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const apiStatus = filters.status !== '__all__' ? filters.status : undefined;
      const apiType = filters.operatorType !== '__all__' ? filters.operatorType : undefined;
      const hasRegionFilter = filters.region !== '__all__';

      // Region isn't a server-side filter — when active, fetch everything, filter
      // client-side, then paginate locally. (Mirrors the original useOperators logic.)
      if (hasRegionFilter) {
        let all: OperatorResponseWithLink[] = [];
        let apiPage = 0;
        let hasMore = true;
        while (hasMore) {
          const res = await OperatorManagementService.getAllOperators(
            apiPage++,
            100,
            sortColumn ?? 'name',
            sortDirection,
            search || undefined,
            apiType,
            apiStatus,
          );
          all = [...all, ...((res.content as OperatorResponseWithLink[]) ?? [])];
          hasMore = !res.last && (res.content?.length ?? 0) === 100;
        }
        const filtered = all.filter((op) => op.region === filters.region);
        const start = (page - 1) * pageSize;
        return { content: filtered.slice(start, start + pageSize), totalElements: filtered.length };
      }

      const res = await OperatorManagementService.getAllOperators(
        page - 1,
        pageSize,
        sortColumn ?? 'name',
        sortDirection,
        search || undefined,
        apiType,
        apiStatus,
      );
      return { content: (res.content as OperatorResponseWithLink[]) ?? [], totalElements: res.totalElements ?? 0 };
    },
    stats: () => OperatorManagementService.getOperatorStatistics(),
    filterOptions: () => OperatorManagementService.getOperatorFilterOptions(),
    // Linked operators (userId set) deactivate via user-service (unified lifecycle syncs
    // status back to core-service); legacy unlinked operators hard-delete in core-service.
    remove: async (op) => {
      if (op.userId) await UsersControllerService.deleteUser(op.userId);
      else if (op.id) await OperatorManagementService.deleteOperator(op.id);
    },
    exportAll: async () => {
      const rows = ((await OperatorManagementService.getAllOperatorsAsList()) ?? []) as OperatorResponseWithLink[];
      exportOperators(rows);
    },
  },

  columns: operatorsColumns as any,

  emptyState: (
    <EmptyState
      icon={<Building className="h-8 w-8" />}
      title="No operators found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  ),

  initialSort: { column: 'name', direction: 'asc' },
  initialFilters: { status: '__all__', operatorType: '__all__', region: '__all__' },
  searchPlaceholder: 'Search operators by name or region…',

  filters: [
    { key: 'status', label: 'Statuses', options: STATUS_OPTIONS, width: 'w-40' },
    { key: 'operatorType', label: 'Types', options: TYPE_OPTIONS, width: 'w-36' },
    { key: 'region', label: 'Regions', optionsKey: 'regions', width: 'w-40' },
  ],

  mapStats: (raw) => {
    const r = raw as OperatorStatisticsResponse;
    return [
      { label: 'Total Operators', value: (r.totalOperators ?? 0).toLocaleString(), icon: <Building className="h-5 w-5" /> },
      { label: 'Active', value: (r.activeOperators ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Inactive', value: (r.inactiveOperators ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
      { label: 'Private', value: (r.privateOperators ?? 0).toLocaleString(), icon: <Building className="h-5 w-5" /> },
      { label: 'CTB', value: (r.ctbOperators ?? 0).toLocaleString(), icon: <Users className="h-5 w-5" /> },
      {
        label: 'Regions Covered',
        value: (r.operatorsByRegion ? Object.keys(r.operatorsByRegion).length : 0).toLocaleString(),
        icon: <MapPin className="h-5 w-5" />,
      },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as OperatorFilterOptionsResponse;
    return {
      regions: (r.regions ?? [])
        .filter((x) => x && x.trim() !== '')
        .map((x) => ({ value: x, label: x })),
    };
  },

  deleteConfirm: (op) => {
    const isLinked = !!op?.userId;
    return {
      title: isLinked ? 'Deactivate Operator' : 'Delete Operator',
      description: isLinked
        ? `Deactivate "${op?.name}"? This account will lose access until reactivated from the Admin dashboard.`
        : `Are you sure you want to delete "${op?.name}"? This action cannot be undone.`,
      confirmLabel: isLinked ? 'Deactivate' : 'Delete',
    };
  },

  messages: {
    deleteSuccess: (op) => (op.userId ? `${op.name} has been deactivated.` : `${op.name} has been deleted.`),
    deleteError: 'Failed to remove operator.',
    exportError: 'Failed to export data.',
    loadError: 'Failed to load operators',
  },

  rowActions: ({ row: op, controller, navigate }) => {
    const isLinked = !!op.userId;
    return (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/operators/${op.id}`)} title="View details">
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/operators/${op.id}/edit`)} title="Edit operator">
          <Edit2 className="h-3.5 w-3.5 text-warning/80" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => controller.deleteDialog.open(op)}
          title={isLinked ? 'Deactivate operator' : 'Delete operator'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  },
});
