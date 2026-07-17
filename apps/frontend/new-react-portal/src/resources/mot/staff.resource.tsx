import { Users, UserCheck, UserX, Clock, ShieldCheck, MapPin, Eye, Edit2, Trash2 } from 'lucide-react';
import { defineResource, Button, EmptyState, type ResourceConfig } from '@busmate/ui';
import { staffColumns } from '@/components/mot/staff/StaffColumns';
import {
  getStaffMembers,
  getStaffStatistics,
  getStaffFilterOptions,
  type StaffMember,
} from '@/data/mot/staff';

export interface StaffFilters {
  status: string;
  province: string;
  /** Driven by the StaffTypeTabs (all/timekeeper/inspector), not a select. '__all__' = All. */
  staffType: string;
}

/**
 * Staff runs entirely on client-side mock data (@/data/mot/staff) and has a
 * staff-type tab, so it's an L2 composition (see pages/mot/staff/page.tsx).
 * All filter/sort/paginate happens in api.list against the in-memory dataset.
 */
export const staffResource: ResourceConfig<StaffMember, StaffFilters> = defineResource<StaffMember, StaffFilters>({
  name: 'staff',
  title: 'Staff Member',
  getRowId: (s) => s.id,

  api: {
    list: async ({ page, pageSize, sortColumn, sortDirection, search, filters }) => {
      let list = getStaffMembers();

      if (filters.staffType !== '__all__') list = list.filter((s) => s.staffType === filters.staffType);
      if (filters.status !== '__all__') list = list.filter((s) => s.status === filters.status);
      if (filters.province !== '__all__') list = list.filter((s) => s.province === filters.province);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (s) =>
            s.fullName.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.nic.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q) ||
            s.assignedLocation.toLowerCase().includes(q),
        );
      }

      const col = sortColumn || 'fullName';
      const dir = sortDirection === 'asc' ? 1 : -1;
      list = [...list].sort((a, b) => String((a as any)[col] ?? '').localeCompare(String((b as any)[col] ?? '')) * dir);

      const start = (page - 1) * pageSize;
      return { content: list.slice(start, start + pageSize), totalElements: list.length };
    },
    stats: async () => getStaffStatistics(),
    filterOptions: async () => getStaffFilterOptions(),
    // Mock delete — no backend; matches prior simulated behaviour.
    remove: async () => {
      await new Promise((r) => setTimeout(r, 500));
    },
    exportAll: async () => {
      const rows = getStaffMembers().map((s) => ({
        ID: s.id, 'Full Name': s.fullName, Phone: s.phone, Email: s.email, NIC: s.nic,
        'Staff Type': s.staffType, Province: s.province, 'Assigned Location': s.assignedLocation,
        Status: s.status, 'Created At': s.createdAt,
      }));
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((row) =>
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
      link.download = `staff-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  },

  columns: staffColumns as any,

  emptyState: (
    <EmptyState icon={<Users className="h-8 w-8" />} title="No staff found" description="Try adjusting your search or filters." />
  ),

  initialSort: { column: 'fullName', direction: 'asc' },
  initialFilters: { status: '__all__', province: '__all__', staffType: '__all__' },
  searchPlaceholder: 'Search by name, email, NIC, phone, or location…',

  filters: [
    { key: 'status', label: 'Status', optionsKey: 'statuses', width: 'w-40' },
    { key: 'province', label: 'Province', optionsKey: 'provinces', width: 'w-44' },
  ],

  mapStats: (raw) => {
    const r = raw as ReturnType<typeof getStaffStatistics>;
    return [
      { label: 'Total Staff', value: r.totalStaff.toLocaleString(), icon: <Users className="h-5 w-5" /> },
      { label: 'Active', value: r.activeStaff.toLocaleString(), icon: <UserCheck className="h-5 w-5" /> },
      { label: 'Inactive', value: r.inactiveStaff.toLocaleString(), icon: <UserX className="h-5 w-5" /> },
      { label: 'Timekeepers', value: r.totalTimekeepers.toLocaleString(), icon: <Clock className="h-5 w-5" /> },
      { label: 'Inspectors', value: r.totalInspectors.toLocaleString(), icon: <ShieldCheck className="h-5 w-5" /> },
      { label: 'Provinces', value: r.provincesCount.toLocaleString(), icon: <MapPin className="h-5 w-5" /> },
    ];
  },

  mapFilterOptions: (raw) => {
    const r = raw as ReturnType<typeof getStaffFilterOptions>;
    return {
      statuses: r.statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
      provinces: r.provinces.map((p) => ({ value: p, label: p })),
    };
  },

  deleteConfirm: (s) => ({
    title: 'Delete Staff Member',
    description: `Are you sure you want to delete "${s?.fullName}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
  }),

  messages: { deleteSuccess: (s) => `${s.fullName} has been deleted.`, loadError: 'Failed to load staff' },

  rowActions: ({ row: s, controller, navigate }) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/staff/${s.id}`)} title="View details">
        <Eye className="h-3.5 w-3.5 text-primary" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate?.(`/mot/staff/${s.id}/edit`)} title="Edit">
        <Edit2 className="h-3.5 w-3.5 text-warning/80" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => controller.deleteDialog.open(s)} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  ),
});
