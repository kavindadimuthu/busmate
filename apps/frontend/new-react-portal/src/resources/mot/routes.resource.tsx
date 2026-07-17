import { Route as RouteIcon, ArrowRight, ArrowLeft, Ruler, Layers, Clock, Eye, Edit2, Trash2 } from 'lucide-react';
import {
  RouteManagementService,
  type RouteResponse,
  type RouteStatisticsResponse,
  type RouteFilterOptionsResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, Input, type ResourceConfig } from '@busmate/ui';
import { routesColumns } from '@/components/mot/routes/RoutesColumns';

export interface RouteFilters {
  routeGroupId: string;
  direction: string;
  minDistance: string;
  maxDistance: string;
  minDuration: string;
  maxDuration: string;
}

const num = (v: string) => (v ? parseFloat(v) : undefined);

export const routesResource: ResourceConfig<RouteResponse, RouteFilters> = defineResource<RouteResponse, RouteFilters>({
  name: 'routes',
  title: 'Route',
  getRowId: (r) => r.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const res = await RouteManagementService.getAllRoutes(
        page - 1,
        pageSize,
        sortColumn ?? 'name',
        sortDirection,
        search || undefined,
        filters.routeGroupId !== '__all__' ? filters.routeGroupId : undefined,
        filters.direction !== '__all__' ? (filters.direction as 'OUTBOUND' | 'INBOUND') : undefined,
        undefined,
        num(filters.minDistance),
        num(filters.maxDistance),
        num(filters.minDuration),
        num(filters.maxDuration),
      );
      return { content: res.content ?? [], totalElements: res.totalElements ?? 0 };
    },
    stats: () => RouteManagementService.getRouteStatistics(),
    filterOptions: () => RouteManagementService.getRouteFilterOptions(),
    // NOTE: real deletion is intentionally disabled — removing a single direction breaks
    // route-group integrity. The row/dialog stay (matching prior UX) but perform no destructive op.
    remove: async () => {},
    exportAll: async () => {
      const all = await RouteManagementService.getAllRoutesAsList();
      const headers = ['ID', 'Name', 'Description', 'Route Group', 'Direction', 'Start Stop', 'End Stop', 'Distance (km)', 'Duration (min)', 'Created At', 'Updated At'];
      const rows = all.map((r) =>
        [r.id, r.name, r.description, r.routeGroupName, r.direction, r.startStopName, r.endStopName, r.distanceKm, r.estimatedDurationMinutes, r.createdAt, r.updatedAt]
          .map((f) => `"${f ?? ''}"`)
          .join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routes-${new Date().toISOString().split('T')[0]}.csv`;
      a.style.visibility = 'hidden';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },

  columns: routesColumns as any,

  emptyState: (
    <EmptyState
      icon={<RouteIcon className="h-8 w-8" />}
      title="No routes found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  ),

  initialSort: { column: 'name', direction: 'asc' },
  initialFilters: {
    routeGroupId: '__all__',
    direction: '__all__',
    minDistance: '',
    maxDistance: '',
    minDuration: '',
    maxDuration: '',
  },
  searchPlaceholder: 'Search routes by name, description, group, or stop names…',

  filters: [
    { key: 'routeGroupId', label: 'Route Group', optionsKey: 'routeGroups', width: 'w-44' },
    {
      key: 'direction',
      label: 'Direction',
      options: [
        { value: 'OUTBOUND', label: 'Outbound' },
        { value: 'INBOUND', label: 'Inbound' },
      ],
      width: 'w-40',
    },
  ],

  renderExtraFilters: (c) => (
    <>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dist (km):</span>
        <Input type="number" placeholder="Min" value={c.state.filters.minDistance} onChange={(e) => c.setFilters({ minDistance: e.target.value })} className="w-16 h-9 text-xs" />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <Input type="number" placeholder="Max" value={c.state.filters.maxDistance} onChange={(e) => c.setFilters({ maxDistance: e.target.value })} className="w-16 h-9 text-xs" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground shrink-0">Dur (min):</span>
        <Input type="number" placeholder="Min" value={c.state.filters.minDuration} onChange={(e) => c.setFilters({ minDuration: e.target.value })} className="w-16 h-9 text-xs" />
        <span className="text-muted-foreground/70 text-xs">–</span>
        <Input type="number" placeholder="Max" value={c.state.filters.maxDuration} onChange={(e) => c.setFilters({ maxDuration: e.target.value })} className="w-16 h-9 text-xs" />
      </div>
    </>
  ),

  mapStats: (raw) => {
    const r = raw as RouteStatisticsResponse;
    return [
      { label: 'Total Routes', value: (r.totalRoutes ?? 0).toLocaleString(), icon: <RouteIcon className="h-5 w-5" /> },
      { label: 'Outbound', value: (r.outboundRoutes ?? 0).toLocaleString(), icon: <ArrowRight className="h-5 w-5" /> },
      { label: 'Inbound', value: (r.inboundRoutes ?? 0).toLocaleString(), icon: <ArrowLeft className="h-5 w-5" /> },
      { label: 'Avg Distance', value: `${(r.averageDistanceKm ?? 0).toFixed(1)} km`, icon: <Ruler className="h-5 w-5" /> },
      { label: 'Route Groups', value: (r.totalRouteGroups ?? 0).toLocaleString(), icon: <Layers className="h-5 w-5" /> },
      { label: 'Avg Duration', value: `${(r.averageDurationMinutes ?? 0).toFixed(0)} min`, icon: <Clock className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as RouteFilterOptionsResponse;
    return {
      routeGroups: ((r.routeGroups as any[]) ?? [])
        .map((rg) => ({ value: rg.id, label: rg.name }))
        .filter((rg) => rg.value),
    };
  },

  deleteConfirm: (r) => ({
    title: 'Delete Route',
    description: `Are you sure you want to delete route "${r?.name}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
  }),

  messages: {
    deleteSuccess: (r) => `${r.name} has been deleted successfully.`,
    loadError: 'Failed to load routes',
    exportError: 'Failed to export routes.',
  },

  rowActions: ({ row: route, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => route.routeGroupId && navigate?.(`/mot/routes/${route.routeGroupId}?highlight=${route.id}`)}
        title="View route"
      >
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => route.routeGroupId && navigate?.(`/mot/routes/workspace?routeGroupId=${route.routeGroupId}`)}
        title="Edit route"
      >
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => controller.deleteDialog.open(route)}
        title="Delete route"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  ),
});
