import { MapPin, Accessibility, AlertCircle, Map, Building2, Eye, Edit2, Trash2 } from 'lucide-react';
import {
  BusStopManagementService,
  type StopResponse,
  type PageStopResponse,
  type StopStatisticsResponse,
  type StopFilterOptionsResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { busStopsColumns } from '@/components/mot/stops/BusStopsColumns';

export interface BusStopFilters {
  state: string;
  accessibility: string;
}

/**
 * Bus Stops uses an L2 composition (see pages/mot/stops/page.tsx) because of its
 * table/map view toggle. The getAllStops API doesn't accept state/accessibility
 * filters, so when any filter/search is active we fetch all stops and filter,
 * sort, and paginate client-side (mirrors the original useBusStops logic).
 */
export const stopsResource: ResourceConfig<StopResponse, BusStopFilters> = defineResource<StopResponse, BusStopFilters>({
  name: 'stops',
  title: 'Bus Stop',
  getRowId: (s) => s.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const hasFilters =
        !!search || (filters.state !== '__all__') || (filters.accessibility !== '__all__');

      if (!hasFilters) {
        const res: PageStopResponse = await BusStopManagementService.getAllStops(
          page - 1,
          pageSize,
          sortColumn ?? 'name',
          sortDirection,
        );
        return { content: res.content ?? [], totalElements: res.totalElements ?? 0 };
      }

      // Fetch all, then filter/sort/paginate in-memory.
      let all: StopResponse[] = [];
      let apiPage = 0;
      let hasMore = true;
      while (hasMore) {
        const res: PageStopResponse = await BusStopManagementService.getAllStops(
          apiPage++,
          500,
          sortColumn ?? 'name',
          sortDirection,
          search || undefined,
        );
        all = [...all, ...(res.content ?? [])];
        hasMore = !res.last && (res.content?.length ?? 0) === 500;
      }

      let filtered = all;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.location?.city?.toLowerCase().includes(q) ||
            s.location?.state?.toLowerCase().includes(q) ||
            s.location?.address?.toLowerCase().includes(q),
        );
      }
      if (filters.state !== '__all__') filtered = filtered.filter((s) => s.location?.state === filters.state);
      if (filters.accessibility !== '__all__') {
        const want = filters.accessibility === 'accessible';
        filtered = filtered.filter((s) => s.isAccessible === want);
      }

      const dir = sortDirection === 'asc' ? 1 : -1;
      const key = sortColumn ?? 'name';
      filtered = [...filtered].sort((a, b) => {
        const av = key === 'createdAt' ? (a.createdAt ?? '') : key === 'isAccessible' ? String(a.isAccessible) : (a.name ?? '');
        const bv = key === 'createdAt' ? (b.createdAt ?? '') : key === 'isAccessible' ? String(b.isAccessible) : (b.name ?? '');
        return av.localeCompare(bv) * dir;
      });

      const start = (page - 1) * pageSize;
      return { content: filtered.slice(start, start + pageSize), totalElements: filtered.length };
    },
    stats: () => BusStopManagementService.getStopStatistics(),
    filterOptions: () => BusStopManagementService.getStopFilterOptions(),
    remove: async (stop) => {
      if (stop.id) await BusStopManagementService.deleteStop(stop.id);
    },
  },

  columns: busStopsColumns,

  emptyState: (
    <EmptyState
      icon={<MapPin className="h-8 w-8" />}
      title="No bus stops found"
      description="Try adjusting your search or filters to find what you're looking for."
    />
  ),

  initialSort: { column: 'name', direction: 'asc' },
  initialFilters: { state: '__all__', accessibility: '__all__' },
  searchPlaceholder: 'Search by name, city, state, or address…',

  filters: [
    { key: 'state', label: 'States', optionsKey: 'states', width: 'w-40' },
    {
      key: 'accessibility',
      label: 'Accessibility',
      options: [
        { value: 'accessible', label: 'Accessible' },
        { value: 'non-accessible', label: 'Not Accessible' },
      ],
      width: 'w-40',
    },
  ],

  mapStats: (raw) => {
    const r = raw as StopStatisticsResponse;
    return [
      { label: 'Total Bus Stops', value: (r.totalStops ?? 0).toLocaleString(), icon: <MapPin className="h-5 w-5" /> },
      { label: 'Accessible', value: (r.accessibleStops ?? 0).toLocaleString(), icon: <Accessibility className="h-5 w-5" /> },
      { label: 'Not Accessible', value: (r.nonAccessibleStops ?? 0).toLocaleString(), icon: <AlertCircle className="h-5 w-5" /> },
      { label: 'States', value: Object.keys(r.stopsByState ?? {}).length.toLocaleString(), icon: <Map className="h-5 w-5" /> },
      { label: 'Cities', value: Object.keys(r.stopsByCity ?? {}).length.toLocaleString(), icon: <Building2 className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as StopFilterOptionsResponse;
    return {
      states: (r.states ?? []).filter((s) => s && s.trim() !== '').map((s) => ({ value: s, label: s })),
    };
  },

  deleteConfirm: (stop) => ({
    title: 'Delete Bus Stop',
    description: `Are you sure you want to delete "${stop?.name}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
  }),

  messages: {
    deleteSuccess: (stop) => `${stop.name} has been deleted.`,
    deleteError: 'Failed to delete bus stop.',
    loadError: 'Failed to load bus stops',
  },

  rowActions: ({ row: stop, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/stops/${stop.id}`)} title="View details">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/stops/${stop.id}/edit`)} title="Edit stop">
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => controller.deleteDialog.open(stop)} title="Delete stop">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  ),
});
