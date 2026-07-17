import { Calendar, CheckCircle, Clock, MapPin, XCircle, Eye, Trash2 } from 'lucide-react';
import {
  TripManagementService,
  type TripResponse,
  type TripStatisticsResponse,
  type TripFilterOptionsResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, Input, type ResourceConfig } from '@busmate/ui';
import { tripsColumns } from '@/components/mot/trips/TripsColumns';

export interface TripFilters {
  status: string;
  routeId: string;
  operatorId: string;
  scheduleId: string;
  busId: string;
  pspId: string;
  fromDate: string;
  toDate: string;
  hasPsp: string;
  hasBus: string;
  hasDriver: string;
  hasConductor: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', completed: 'Completed', pending: 'Pending', cancelled: 'Cancelled', delayed: 'Delayed', in_transit: 'In Transit',
};
const BOOLEAN_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];
const bool = (v: string) => (v !== '__all__' ? v === 'true' : undefined);
const sel = (v: string) => (v !== '__all__' ? v : undefined);

/** Dedupe option lists by value — some trip filter option lists (e.g. PSPs) repeat. */
function dedupe(opts: { value: string; label: string }[]) {
  return Array.from(new Map(opts.filter((o) => o.value).map((o) => [o.value, o])).values());
}

export const tripsResource: ResourceConfig<TripResponse, TripFilters> = defineResource<TripResponse, TripFilters>({
  name: 'trips',
  title: 'Trip',
  getRowId: (t) => t.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters: f }) => {
      const response = await TripManagementService.getAllTrips(
        page - 1,
        pageSize,
        sortColumn || 'tripDate',
        sortDirection || 'desc',
        search || undefined,
        sel(f.status) as any,
        sel(f.routeId),
        sel(f.operatorId),
        sel(f.scheduleId),
        sel(f.pspId),
        sel(f.busId),
        f.fromDate || undefined,
        f.toDate || undefined,
        bool(f.hasPsp),
        bool(f.hasBus),
        bool(f.hasDriver),
        bool(f.hasConductor),
      );
      return { content: response.content ?? [], totalElements: response.totalElements ?? 0 };
    },
    stats: () => TripManagementService.getTripStatistics(),
    filterOptions: () => TripManagementService.getTripFilterOptions(),
    remove: async (t) => {
      if (t.id) await TripManagementService.deleteTrip(t.id);
    },
  },

  columns: tripsColumns as any,

  emptyState: (
    <EmptyState icon={<Calendar className="h-8 w-8" />} title="No trips found" description="Try adjusting your search or filters." />
  ),

  initialSort: { column: 'tripDate', direction: 'desc' },
  initialFilters: {
    status: '__all__', routeId: '__all__', operatorId: '__all__', scheduleId: '__all__', busId: '__all__', pspId: '__all__',
    fromDate: '', toDate: '', hasPsp: '__all__', hasBus: '__all__', hasDriver: '__all__', hasConductor: '__all__',
  },
  searchPlaceholder: 'Search trips…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-36' },
    { key: 'routeId', label: 'Route', optionsKey: 'routes', width: 'w-44' },
    { key: 'operatorId', label: 'Operator', optionsKey: 'operators', width: 'w-40' },
    { key: 'scheduleId', label: 'Schedule', optionsKey: 'schedules', width: 'w-40' },
    { key: 'busId', label: 'Bus', optionsKey: 'buses', width: 'w-36' },
    { key: 'pspId', label: 'PSP', optionsKey: 'passengerServicePermits', width: 'w-36' },
    { key: 'hasPsp', label: 'Has PSP', options: BOOLEAN_OPTIONS, placeholder: 'Any', width: 'w-28' },
    { key: 'hasBus', label: 'Has Bus', options: BOOLEAN_OPTIONS, placeholder: 'Any', width: 'w-28' },
    { key: 'hasDriver', label: 'Has Driver', options: BOOLEAN_OPTIONS, placeholder: 'Any', width: 'w-28' },
    { key: 'hasConductor', label: 'Has Conductor', options: BOOLEAN_OPTIONS, placeholder: 'Any', width: 'w-32' },
  ],

  renderExtraFilters: (c) => (
    <>
      <Input type="date" value={c.state.filters.fromDate ?? ''} onChange={(e) => c.setFilters({ fromDate: e.target.value })} className="w-40 h-9 text-xs" />
      <Input type="date" value={c.state.filters.toDate ?? ''} onChange={(e) => c.setFilters({ toDate: e.target.value })} className="w-40 h-9 text-xs" />
    </>
  ),

  mapStats: (raw) => {
    const s = raw as TripStatisticsResponse;
    return [
      { label: 'Total Trips', value: (s.totalTrips ?? 0).toLocaleString(), icon: <Calendar className="h-5 w-5" /> },
      { label: 'Active', value: (s.activeTrips ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Completed', value: (s.completedTrips ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Pending', value: (s.pendingTrips ?? 0).toLocaleString(), icon: <Clock className="h-5 w-5" /> },
      { label: 'In Transit', value: (s.inTransitTrips ?? 0).toLocaleString(), icon: <MapPin className="h-5 w-5" /> },
      { label: 'Cancelled', value: (s.cancelledTrips ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as TripFilterOptionsResponse & {
      routes?: Array<{ id?: string; name?: string; routeGroupName?: string }>;
      operators?: Array<{ id?: string; name?: string }>;
      schedules?: Array<{ id?: string; name?: string }>;
      buses?: Array<{ id?: string; plateNumber?: string }>;
      passengerServicePermits?: Array<{ id?: string; permitNumber?: string }>;
    };
    return {
      statuses: dedupe(((r.statuses as string[]) ?? []).map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))),
      routes: dedupe((r.routes ?? []).map((x) => ({ value: x.id ?? '', label: x.routeGroupName ? `${x.name} (${x.routeGroupName})` : x.name ?? '' }))),
      operators: dedupe((r.operators ?? []).map((x) => ({ value: x.id ?? '', label: x.name ?? '' }))),
      schedules: dedupe((r.schedules ?? []).map((x) => ({ value: x.id ?? '', label: x.name ?? '' }))),
      buses: dedupe((r.buses ?? []).map((x) => ({ value: x.id ?? '', label: x.plateNumber ?? '' }))),
      passengerServicePermits: dedupe((r.passengerServicePermits ?? []).map((x) => ({ value: x.id ?? '', label: x.permitNumber ?? '' }))),
    };
  },

  deleteConfirm: (t) => ({
    title: 'Delete Trip',
    description: `Are you sure you want to delete the trip "${t?.routeName}" on ${t?.tripDate ? new Date(t.tripDate).toLocaleDateString() : ''}? This action cannot be undone.`,
    confirmLabel: 'Delete',
  }),

  messages: { deleteError: 'Failed to delete trip', loadError: 'Failed to load trips' },

  // Delete is only offered for pending/cancelled trips (matches prior table logic).
  rowActions: ({ row: trip, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/trips/${trip.id}`)} title="View details">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      {['pending', 'cancelled'].includes(trip.status?.toLowerCase() ?? '') && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => controller.deleteDialog.open(trip)} title="Delete trip">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
    </div>
  ),
});
