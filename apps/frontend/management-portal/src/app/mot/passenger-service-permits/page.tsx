'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PermitManagementService,
  type PassengerServicePermitResponse,
} from '@busmate/api-client-route';
import { useDataTable, useDialog, ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useToast } from '@/hooks/use-toast';

import { PermitsStatsCardsNew } from '@/components/mot/permits/permits-stats-cards';
import { PermitsFilterBar, type PermitFilters } from '@/components/mot/permits/permits-filter-bar';
import { PermitsTableNew } from '@/components/mot/permits/permits-table';
import { PermitActionButtons } from '@/components/mot/permits/PermitActionButtons';

const INITIAL_FILTERS: PermitFilters = {
  status: '__all__',
  operatorId: '__all__',
  routeGroupId: '__all__',
  permitType: '__all__',
};

export default function PassengerServicePermitsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Table state (pagination, sort, search, filters) ─────────────
  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<PermitFilters>({
      initialPageSize: 10,
      initialSort: { column: 'createdAt', direction: 'desc' },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<PassengerServicePermitResponse>();

  // ── Server data ─────────────────────────────────────────────────
  const [permits, setPermits] = useState<PassengerServicePermitResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>({
    statuses: ['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED'],
    operators: [],
    routeGroups: [],
    permitTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useSetPageMetadata({
    title: 'Passenger Service Permits Management',
    description: 'Manage and monitor passenger service permits for all operators',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits' }],
  });

  // ── Export CSV ──────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const dataToExport = permits.map((permit) => ({
      'Permit Number': permit.permitNumber || '',
      'Operator Name': permit.operatorName || '',
      'Route Group': permit.routeGroupName || '',
      'Permit Type': permit.permitType || '',
      'Issue Date': permit.issueDate || '',
      'Expiry Date': permit.expiryDate || '',
      'Maximum Buses': permit.maximumBusAssigned || 0,
      Status: permit.status || '',
      'Created At': permit.createdAt ? new Date(permit.createdAt).toLocaleDateString() : '',
      'Updated At': permit.updatedAt ? new Date(permit.updatedAt).toLocaleDateString() : '',
    }));

    if (dataToExport.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(','),
      ...dataToExport.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `passenger-service-permits-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [permits, toast]);

  const handleImport = useCallback(() => {
    toast({ title: 'Import functionality will be implemented' });
  }, [toast]);

  useSetPageActions(
    <PermitActionButtons
      onAddPermit={() => router.push('/mot/passenger-service-permits/add-new')}
      onImportPermits={handleImport}
      onExportAll={handleExport}
      isLoading={isLoading}
    />,
  );

  // ── Initial load: filter options + statistics ───────────────────
  useEffect(() => {
    PermitManagementService.getPermitFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch(console.error);

    PermitManagementService.getPermitStatistics()
      .then((stats) => setStatistics(stats))
      .catch(() =>
        setStatistics({
          totalPermits: 0,
          activePermits: 0,
          inactivePermits: 0,
          expiringSoonPermits: 0,
          permitsByOperator: {},
          permitsByRouteGroup: {},
        }),
      );
  }, []);

  // ── Data load: re-runs when table state changes ─────────────────
  const loadPermits = useCallback(async () => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;

    try {
      setIsLoading(true);

      // Resolve filter values — skip __all__
      const statusFilter = filters.status !== '__all__' ? filters.status : undefined;
      const permitTypeFilter = filters.permitType !== '__all__' ? filters.permitType : undefined;

      let operatorNameFilter: string | undefined;
      if (filters.operatorId !== '__all__' && filterOptions.operators?.length > 0) {
        const op = filterOptions.operators.find((o: any) => o.id === filters.operatorId);
        operatorNameFilter = op?.name;
      }
      let routeGroupNameFilter: string | undefined;
      if (filters.routeGroupId !== '__all__' && filterOptions.routeGroups?.length > 0) {
        const rg = filterOptions.routeGroups.find((r: any) => r.id === filters.routeGroupId);
        routeGroupNameFilter = rg?.name;
      }

      // For client-side search, fetch a larger batch
      const fetchSize = searchQuery ? Math.max(pageSize * 5, 100) : pageSize;
      const fetchPage = searchQuery ? 0 : page - 1; // useDataTable is 1-based; Spring is 0-based

      const response = await PermitManagementService.getPermits(
        fetchPage,
        fetchSize,
        sortColumn ?? 'createdAt',
        sortDirection,
        statusFilter,
        permitTypeFilter,
        operatorNameFilter,
        routeGroupNameFilter,
      );

      let data = response.content || [];
      let total = response.totalElements || 0;

      // Client-side search filtering
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter(
          (p: any) =>
            p.permitNumber?.toLowerCase().includes(q) ||
            p.operatorName?.toLowerCase().includes(q) ||
            p.routeGroupName?.toLowerCase().includes(q) ||
            p.permitType?.toLowerCase().includes(q),
        );
        total = data.length;
        const start = (page - 1) * pageSize;
        data = data.slice(start, start + pageSize);
      }

      setPermits(data);
      setTotalElements(total);
    } catch (err) {
      console.error('Error loading permits:', err);
      toast({ title: 'Failed to load permits', variant: 'destructive' });
      setPermits([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [state, filterOptions, toast]);

  useEffect(() => {
    loadPermits();
  }, [
    state.searchQuery,
    state.sortColumn,
    state.sortDirection,
    state.page,
    state.pageSize,
    state.filters.status,
    state.filters.operatorId,
    state.filters.routeGroupId,
    state.filters.permitType,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete ─────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const permit = deleteDialog.data;
    if (!permit?.id) return;
    try {
      setIsDeleting(true);
      await PermitManagementService.deletePermit(permit.id);
      toast({ title: 'Permit Deleted', description: `Permit ${permit.permitNumber} has been deleted.` });
      deleteDialog.close();
      loadPermits();
      PermitManagementService.getPermitStatistics()
        .then((stats) => setStatistics(stats))
        .catch(console.error);
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete permit.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Active filter count ────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filters.status && state.filters.status !== '__all__') count++;
    if (state.filters.operatorId && state.filters.operatorId !== '__all__') count++;
    if (state.filters.routeGroupId && state.filters.routeGroupId !== '__all__') count++;
    if (state.filters.permitType && state.filters.permitType !== '__all__') count++;
    return count;
  }, [state.filters]);

  return (
    <div className="space-y-6">
      <PermitsStatsCardsNew stats={statistics} />

      <PermitsFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <PermitsTableNew
        data={permits}
        totalItems={totalElements}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={isLoading}
        onView={(permit) => router.push(`/mot/passenger-service-permits/${permit.id}`)}
        onEdit={(permit) => router.push(`/mot/passenger-service-permits/${permit.id}/edit`)}
        onDelete={deleteDialog.open}
        onAssignBus={(permit) => router.push(`/mot/passenger-service-permits/${permit.id}/assign-bus`)}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Permit"
        description={`Are you sure you want to delete permit "${deleteDialog.data?.permitNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}