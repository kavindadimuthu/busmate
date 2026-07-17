import { FileText, CheckCircle, XCircle, Clock, Users, MapPin, Eye, Edit2, Settings, Trash2 } from 'lucide-react';
import {
  PermitManagementService,
  type PassengerServicePermitResponse,
  type PassengerServicePermitStatisticsResponse,
  type PassengerServicePermitFilterOptionsResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { permitsColumns } from '@/components/mot/passenger-permits/PermitsColumns';

export interface PermitFilters {
  status: string;
  /** Value is the operator NAME (getPermits filters by name); '__all__' = All. */
  operatorId: string;
  /** Value is the route-group NAME. */
  routeGroupId: string;
  permitType: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending', EXPIRED: 'Expired',
};

export const permitsResource: ResourceConfig<PassengerServicePermitResponse, PermitFilters> = defineResource<
  PassengerServicePermitResponse,
  PermitFilters
>({
  name: 'permits',
  title: 'Permit',
  getRowId: (p) => p.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const fetchSize = search ? Math.max(pageSize * 5, 100) : pageSize;
      const fetchPage = search ? 0 : page - 1;

      const response = await PermitManagementService.getPermits(
        fetchPage,
        fetchSize,
        sortColumn ?? 'createdAt',
        sortDirection,
        filters.status !== '__all__' ? filters.status : undefined,
        filters.permitType !== '__all__' ? filters.permitType : undefined,
        filters.operatorId !== '__all__' ? filters.operatorId : undefined,
        filters.routeGroupId !== '__all__' ? filters.routeGroupId : undefined,
      );

      let data = response.content ?? [];
      let total = response.totalElements ?? 0;

      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (p) =>
            p.permitNumber?.toLowerCase().includes(q) ||
            p.operatorName?.toLowerCase().includes(q) ||
            p.routeGroupName?.toLowerCase().includes(q) ||
            p.permitType?.toLowerCase().includes(q),
        );
        total = data.length;
        const start = (page - 1) * pageSize;
        data = data.slice(start, start + pageSize);
      }

      return { content: data, totalElements: total };
    },
    stats: () => PermitManagementService.getPermitStatistics(),
    filterOptions: () => PermitManagementService.getPermitFilterOptions(),
    remove: async (permit) => {
      if (permit.id) await PermitManagementService.deletePermit(permit.id);
    },
    exportAll: async () => {
      // Export current page's data set (matches prior behaviour, which exported loaded rows).
      const response = await PermitManagementService.getPermits(0, 1000, 'createdAt', 'desc');
      const permits = response.content ?? [];
      const rows = permits.map((permit) => ({
        'Permit Number': permit.permitNumber || '', 'Operator Name': permit.operatorName || '',
        'Route Group': permit.routeGroupName || '', 'Permit Type': permit.permitType || '',
        'Issue Date': permit.issueDate || '', 'Expiry Date': permit.expiryDate || '',
        'Maximum Buses': permit.maximumBusAssigned || 0, Status: permit.status || '',
        'Created At': permit.createdAt ? new Date(permit.createdAt).toLocaleDateString() : '',
        'Updated At': permit.updatedAt ? new Date(permit.updatedAt).toLocaleDateString() : '',
      }));
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          headers.map((h) => {
            const v = row[h as keyof typeof row];
            return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
          }).join(','),
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `passenger-service-permits-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },

  columns: permitsColumns as any,

  emptyState: (
    <EmptyState icon={<FileText className="h-8 w-8" />} title="No permits found" description="Try adjusting your search or filters." />
  ),

  initialSort: { column: 'createdAt', direction: 'desc' },
  initialFilters: { status: '__all__', operatorId: '__all__', routeGroupId: '__all__', permitType: '__all__' },
  searchPlaceholder: 'Search by permit number, operator, or route group…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-40' },
    { key: 'operatorId', label: 'Operator', optionsKey: 'operators', width: 'w-44' },
    { key: 'routeGroupId', label: 'Route Group', optionsKey: 'routeGroups', width: 'w-44' },
    { key: 'permitType', label: 'Permit Type', optionsKey: 'permitTypes', width: 'w-40' },
  ],

  mapStats: (raw) => {
    const r = raw as PassengerServicePermitStatisticsResponse;
    return [
      { label: 'Total Permits', value: (r.totalPermits ?? 0).toLocaleString(), icon: <FileText className="h-5 w-5" /> },
      { label: 'Active', value: (r.activePermits ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Inactive', value: (r.inactivePermits ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
      { label: 'Expiring Soon', value: (r.expiringSoonPermits ?? 0).toLocaleString(), icon: <Clock className="h-5 w-5" /> },
      { label: 'Operators', value: Object.keys(r.permitsByOperator ?? {}).length.toLocaleString(), icon: <Users className="h-5 w-5" /> },
      { label: 'Route Groups', value: Object.keys(r.permitsByRouteGroup ?? {}).length.toLocaleString(), icon: <MapPin className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as PassengerServicePermitFilterOptionsResponse & {
      operators?: Array<{ id: string; name: string }>;
      routeGroups?: Array<{ id: string; name: string }>;
    };
    return {
      statuses: (r.statuses ?? []).map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s })),
      // Use the NAME as the value — getPermits filters by operator/route-group name.
      operators: (r.operators ?? []).map((o) => ({ value: o.name, label: o.name })).filter((o) => o.value),
      routeGroups: (r.routeGroups ?? []).map((rg) => ({ value: rg.name, label: rg.name })).filter((rg) => rg.value),
      permitTypes: (r.permitTypes ?? []).map((t) => ({ value: t, label: t })),
    };
  },

  deleteConfirm: (p) => ({
    title: 'Delete Permit',
    description: `Are you sure you want to delete permit "${p?.permitNumber}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
  }),

  messages: {
    deleteSuccess: (p) => `Permit ${p.permitNumber} has been deleted.`,
    deleteError: 'Failed to delete permit.',
    loadError: 'Failed to load permits',
  },

  rowActions: ({ row: permit, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/passenger-permits/${permit.id}`)} title="View details">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/passenger-permits/${permit.id}/edit`)} title="Edit">
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/passenger-permits/${permit.id}/assign-bus`)} title="Assign Bus">
        <Settings className="h-3.5 w-3.5 text-success" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => controller.deleteDialog.open(permit)} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  ),
});
