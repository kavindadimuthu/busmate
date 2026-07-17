import { Calendar, CheckCircle, XCircle, Clock, Zap, Route, Eye, Edit2, Users, Trash2 } from 'lucide-react';
import {
  ScheduleManagementService,
  RouteManagementService,
  type ScheduleResponse,
} from '@busmate/api-client-core';
import { defineResource, Button, EmptyState, Input, type ResourceConfig } from '@busmate/ui';
import { schedulesColumns } from '@/components/mot/schedules/SchedulesColumns';

export interface ScheduleFilters {
  status: string;
  scheduleType: string;
  routeId: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
}

export const schedulesResource: ResourceConfig<ScheduleResponse, ScheduleFilters> = defineResource<
  ScheduleResponse,
  ScheduleFilters
>({
  name: 'schedules',
  title: 'Schedule',
  getRowId: (s) => s.id ?? '',

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      const response = await ScheduleManagementService.getSchedules(
        page - 1,
        pageSize,
        sortColumn || 'name',
        sortDirection || 'asc',
        filters.routeId !== '__all__' ? filters.routeId : undefined,
        undefined,
        filters.scheduleType !== '__all__' ? (filters.scheduleType as 'REGULAR' | 'SPECIAL') : undefined,
        filters.status !== '__all__' ? (filters.status as 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELLED') : undefined,
        search || undefined,
      );
      return { content: response.content ?? [], totalElements: response.totalElements ?? 0 };
    },
    stats: () => ScheduleManagementService.getScheduleStatistics(),
    filterOptions: async () => {
      const [statuses, scheduleTypes, routes] = await Promise.all([
        ScheduleManagementService.getDistinctStatuses(),
        ScheduleManagementService.getDistinctScheduleTypes(),
        RouteManagementService.getAllRoutesAsList(),
      ]);
      return { statuses, scheduleTypes, routes };
    },
    remove: async (s) => {
      if (s.id) await ScheduleManagementService.deleteSchedule(s.id);
    },
    exportAll: async () => {
      const all = await ScheduleManagementService.getAllSchedules();
      if (!all || all.length === 0) return;
      const headers = ['Name', 'Route', 'Type', 'Status', 'Effective Start', 'Effective End', 'Created At'];
      const rows = all.map((s) =>
        [s.name, s.routeName, s.scheduleType, s.status, s.effectiveStartDate, s.effectiveEndDate, s.createdAt].map((v) => `"${v || ''}"`).join(','),
      );
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedules_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.style.visibility = 'hidden';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },

  columns: schedulesColumns as any,

  emptyState: (
    <EmptyState icon={<Calendar className="h-8 w-8" />} title="No schedules found" description="Try adjusting your search or filters." />
  ),

  initialSort: { column: 'name', direction: 'asc' },
  initialFilters: { status: '__all__', scheduleType: '__all__', routeId: '__all__', effectiveStartDate: '', effectiveEndDate: '' },
  searchPlaceholder: 'Search schedules…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-40' },
    { key: 'scheduleType', label: 'Type', optionsKey: 'scheduleTypes', width: 'w-36' },
    { key: 'routeId', label: 'Route', optionsKey: 'routes', width: 'w-48' },
  ],

  renderExtraFilters: (c) => (
    <>
      <Input
        type="date"
        value={c.state.filters.effectiveStartDate ?? ''}
        onChange={(e) => c.setFilters({ effectiveStartDate: e.target.value })}
        className="w-40 h-9 text-xs"
      />
      <Input
        type="date"
        value={c.state.filters.effectiveEndDate ?? ''}
        onChange={(e) => c.setFilters({ effectiveEndDate: e.target.value })}
        className="w-40 h-9 text-xs"
      />
    </>
  ),

  mapStats: (raw) => {
    const s = raw as Record<string, number>;
    return [
      { label: 'Total Schedules', value: (s.totalSchedules ?? 0).toLocaleString(), icon: <Calendar className="h-5 w-5" /> },
      { label: 'Active', value: (s.activeSchedules ?? 0).toLocaleString(), icon: <CheckCircle className="h-5 w-5" /> },
      { label: 'Inactive', value: (s.inactiveSchedules ?? 0).toLocaleString(), icon: <XCircle className="h-5 w-5" /> },
      { label: 'Regular', value: (s.regularSchedules ?? 0).toLocaleString(), icon: <Clock className="h-5 w-5" /> },
      { label: 'Special', value: (s.specialSchedules ?? 0).toLocaleString(), icon: <Zap className="h-5 w-5" /> },
      { label: 'Routes Covered', value: (s.totalRoutes ?? 0).toLocaleString(), icon: <Route className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as { statuses: string[]; scheduleTypes: string[]; routes: Array<{ id?: string; name?: string }> };
    return {
      statuses: (r.statuses ?? []).map((s) => ({ value: s, label: s })),
      scheduleTypes: (r.scheduleTypes ?? []).map((t) => ({ value: t, label: t })),
      routes: (r.routes ?? []).map((route) => ({ value: route.id ?? '', label: route.name || 'Unnamed Route' })).filter((r) => r.value),
    };
  },

  deleteConfirm: (s) => ({
    title: 'Delete Schedule',
    description: `Are you sure you want to delete "${s?.name}"? All associated data will be permanently removed. This action cannot be undone.`,
    confirmLabel: 'Delete Schedule',
  }),

  messages: {
    deleteSuccess: (s) => `Schedule "${s.name}" deleted successfully`,
    deleteError: 'Failed to delete schedule',
    loadError: 'Failed to load schedules',
  },

  rowActions: ({ row: s, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/schedules/${s.id}`)} title="View details">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => s.routeId && navigate?.(`/mot/schedules/workspace?routeId=${s.routeId}&scheduleId=${s.id}`)}
        title="Edit schedule"
      >
        <Edit2 className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/schedules/${s.id}/assign-buses`)} title="Assign buses">
        <Users className="h-3.5 w-3.5 text-success" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => controller.deleteDialog.open(s)} title="Delete">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  ),
});
