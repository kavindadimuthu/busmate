import { Bus, CheckCircle, XCircle, Users, Gauge, MapPin, Eye, Edit2, Settings, Trash2 } from 'lucide-react';
import {
  BusManagementService,
  type BusResponse,
  type BusFilterOptionsResponse,
  type BusStatisticsResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { busesColumns } from '@/components/mot/buses/BusesColumns';

export interface BusFilters {
  status: string;
  operatorId: string;
  model: string;
}

function toCsv(buses: BusResponse[]): string {
  const headers = ['Registration Number', 'Plate Number', 'Operator', 'Model', 'Capacity', 'Status', 'Created Date'];
  const rows = buses.map((bus) =>
    [
      `"${bus.ntcRegistrationNumber || ''}"`,
      `"${bus.plateNumber || ''}"`,
      `"${bus.operatorName || ''}"`,
      `"${bus.model || ''}"`,
      bus.capacity || 0,
      `"${bus.status || ''}"`,
      `"${bus.createdAt ? new Date(bus.createdAt).toLocaleDateString() : ''}"`,
    ].join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const busesResource: ResourceConfig<BusResponse, BusFilters> = defineResource<BusResponse, BusFilters>({
  name: 'buses',
  title: 'Buses',
  getRowId: (bus) => bus.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const response = await BusManagementService.getAllBuses(
        page - 1,
        pageSize,
        sortColumn ?? 'ntcRegistrationNumber',
        sortDirection,
        search || undefined,
        filters.operatorId !== '__all__' ? filters.operatorId : undefined,
        filters.status !== '__all__' ? (filters.status as any) : undefined,
      );
      return { content: response.content ?? [], totalElements: response.totalElements ?? 0 };
    },
    stats: () => BusManagementService.getBusStatistics(),
    filterOptions: () => BusManagementService.getBusFilterOptions(),
    remove: async (bus) => {
      if (bus.id) await BusManagementService.deleteBus(bus.id);
    },
    exportAll: async () => {
      const allBuses = (await BusManagementService.getAllBusesAsList()) ?? [];
      downloadCsv(toCsv(allBuses), `buses-export-${new Date().toISOString().split('T')[0]}.csv`);
    },
  },

  columns: busesColumns as any,

  emptyState: (
    <EmptyState
      icon={<Bus className="h-8 w-8" />}
      title="No buses found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  ),

  initialSort: { column: 'ntcRegistrationNumber', direction: 'asc' },
  initialFilters: { status: '__all__', operatorId: '__all__', model: '__all__' },
  searchPlaceholder: 'Search by registration, plate number, model, or operator…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-40' },
    { key: 'operatorId', label: 'Operator', optionsKey: 'operators', width: 'w-44' },
    { key: 'model', label: 'Model', optionsKey: 'models', width: 'w-40' },
  ],

  mapStats: (raw) => {
    const r = raw as BusStatisticsResponse;
    const totalOperators = r.averageBusesPerOperator
      ? Math.round((r.totalBuses ?? 0) / r.averageBusesPerOperator)
      : 0;
    return [
      { label: 'Total Buses', value: (r.totalBuses ?? 0).toLocaleString(), icon: <Bus className="h-5 w-5" /> },
      { label: 'Active', value: (r.activeBuses ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Inactive', value: (r.inactiveBuses ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
      { label: 'Operators', value: totalOperators.toLocaleString(), icon: <Users className="h-5 w-5" /> },
      { label: 'Avg Capacity', value: Math.round(r.averageCapacity ?? 0), icon: <Gauge className="h-5 w-5" /> },
      { label: 'Total Capacity', value: (r.totalCapacity ?? 0).toLocaleString(), icon: <MapPin className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as BusFilterOptionsResponse;
    return {
      statuses: (r.statuses ?? []).map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() })),
      operators: (r.operators ?? [])
        .map((op) => ({ value: op.id ?? '', label: op.name ?? '' }))
        .filter((op) => op.value),
      models: (r.models ?? []).map((m) => ({ value: m, label: m })),
    };
  },

  deleteConfirm: (bus) => ({
    title: 'Delete bus?',
    description: bus?.ntcRegistrationNumber
      ? `This will permanently delete bus ${bus.ntcRegistrationNumber}. This action cannot be undone.`
      : 'This action cannot be undone.',
  }),

  messages: {
    deleteSuccess: (bus) => `Bus ${bus.ntcRegistrationNumber ?? ''} has been deleted.`,
    deleteError: 'Failed to delete bus.',
    exportError: 'Failed to export buses.',
    loadError: 'Failed to load buses',
  },

  routes: {
    view: (bus) => `/mot/buses/${bus.id}`,
    edit: (bus) => `/mot/buses/${bus.id}/edit`,
  },

  rowActions: ({ row: bus, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate?.(`/mot/buses/${bus.id}`)}
        title="View details"
      >
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate?.(`/mot/buses/${bus.id}/edit`)}
        title="Edit"
      >
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate?.(`/mot/buses/${bus.id}/assign-route`)}
        title="Assign Route"
      >
        <Settings className="h-3.5 w-3.5 text-success" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => controller.deleteDialog.open(bus)}
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  ),
});
