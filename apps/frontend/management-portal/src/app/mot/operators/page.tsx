'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { OperatorManagementService } from '@busmate/api-client-route';
import type { OperatorResponse } from '@busmate/api-client-route';
import { useDataTable, useDialog, ConfirmDialog } from '@busmate/ui';

import { OperatorsStatsCards } from '@/components/mot/operators/operators-stats-cards';
import { OperatorsFilterBar, type OperatorFilters } from '@/components/mot/operators/operators-filter-bar';
import { OperatorsTable } from '@/components/mot/operators/operators-table';
import { OperatorActionButtons } from '@/components/mot/operators';
import { useToast } from '@/hooks/use-toast';
import { useSetPageActions, useSetPageMetadata } from '@/context/PageContext';

const INITIAL_FILTERS: OperatorFilters = {
  status: '__all__',
  operatorType: '__all__',
  region: '__all__',
};

export default function OperatorsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── Table state (pagination, sort, filters) ──────────────────────
  const { state, setPage, setPageSize, setSort, setSearch, setFilters, clearFilters } =
    useDataTable<OperatorFilters>({
      initialPageSize: 10,
      initialSort: { column: 'name', direction: 'asc' },
      initialFilters: INITIAL_FILTERS,
    });

  const deleteDialog = useDialog<OperatorResponse>();

  // ── Server data ──────────────────────────────────────────────────
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalOperators: { count: 0 },
    activeOperators: { count: 0 },
    inactiveOperators: { count: 0 },
    privateOperators: { count: 0 },
    ctbOperators: { count: 0 },
    totalRegions: { count: 0 },
  });
  const [filterOptions, setFilterOptions] = useState<{ regions: string[] }>({ regions: [] });

  useSetPageMetadata({
    title: 'Operators',
    description: 'Manage bus operators and their details',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Operators' }],
  });

  useSetPageActions(
    <OperatorActionButtons
      onAddOperator={() => router.push('/mot/operators/add-new')}
      onImportOperators={() => router.push('/mot/operators/import')}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />,
  );

  // ── Initial load: filter options + statistics ────────────────────
  useEffect(() => {
    OperatorManagementService.getOperatorFilterOptions()
      .then((res) =>
        setFilterOptions({ regions: (res.regions || []).filter((r) => r && r.trim() !== '') }),
      )
      .catch(console.error);

    loadStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStatistics = useCallback(() => {
    OperatorManagementService.getOperatorStatistics()
      .then((res) =>
        setStats({
          totalOperators: { count: res.totalOperators || 0 },
          activeOperators: { count: res.activeOperators || 0 },
          inactiveOperators: { count: res.inactiveOperators || 0 },
          privateOperators: { count: res.privateOperators || 0 },
          ctbOperators: { count: res.ctbOperators || 0 },
          totalRegions: { count: res.operatorsByRegion ? Object.keys(res.operatorsByRegion).length : 0 },
        }),
      )
      .catch(console.error);
  }, []);

  // ── Data load: re-runs when state changes ────────────────────────
  const loadOperators = useCallback(async () => {
    const { searchQuery, sortColumn, sortDirection, page, pageSize, filters } = state;

    // Region is client-side only; status + operatorType are server-side
    const apiStatus = filters.status && filters.status !== '__all__' ? filters.status : undefined;
    const apiOperatorType =
      filters.operatorType && filters.operatorType !== '__all__' ? filters.operatorType : undefined;
    const hasRegionFilter = filters.region && filters.region !== '__all__';

    try {
      setIsLoading(true);

      if (hasRegionFilter) {
        // Fetch all pages for client-side region filtering
        let results: OperatorResponse[] = [];
        let apiPage = 0;
        let hasMore = true;
        while (hasMore) {
          const res = await OperatorManagementService.getAllOperators(
            apiPage++,
            100,
            sortColumn ?? 'name',
            sortDirection,
            searchQuery || undefined,
            apiOperatorType,
            apiStatus,
          );
          results = [...results, ...(res.content ?? [])];
          hasMore = !res.last && (res.content?.length ?? 0) === 100;
        }
        setOperators(results);
        // totalItems will be computed client-side after region filter; see filteredTableData
      } else {
        // Server-side pagination
        const res = await OperatorManagementService.getAllOperators(
          page - 1, // useDataTable is 1-based; API is 0-based
          pageSize,
          sortColumn ?? 'name',
          sortDirection,
          searchQuery || undefined,
          apiOperatorType,
          apiStatus,
        );
        setOperators(res.content ?? []);
        setTotalItems(res.totalElements ?? 0);
      }
    } catch {
      toast({ title: 'Failed to load operators', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [state, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOperators();
  }, [
    state.searchQuery,
    state.sortColumn,
    state.sortDirection,
    state.page,
    state.pageSize,
    state.filters.status,
    state.filters.operatorType,
    state.filters.region,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Client-side region filter + paginate ────────────────────────
  const filteredTableData = useMemo(() => {
    const { filters, page, pageSize } = state;
    const hasRegionFilter = filters.region && filters.region !== '__all__';

    if (!hasRegionFilter) {
      return { data: operators, totalItems };
    }

    const filtered = operators.filter((op) => op.region === filters.region);
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), totalItems: total };
  }, [operators, state, totalItems]);

  // ── Delete ───────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const operator = deleteDialog.data;
    if (!operator?.id) return;
    try {
      setIsDeleting(true);
      await OperatorManagementService.deleteOperator(operator.id);
      toast({ title: 'Operator Deleted', description: `${operator.name} has been deleted.` });
      deleteDialog.close();
      loadOperators();
      loadStatistics();
    } catch {
      toast({ title: 'Delete Failed', description: 'Failed to delete operator.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Export ───────────────────────────────────────────────────────
  function handleExportAll() {
    try {
      const dataToExport = operators.map((operator) => ({
        ID: operator.id || '',
        Name: operator.name || '',
        'Operator Type': operator.operatorType || '',
        Region: operator.region || '',
        Status: operator.status || '',
        'Created At': operator.createdAt ? new Date(operator.createdAt).toLocaleDateString() : '',
        'Updated At': operator.updatedAt ? new Date(operator.updatedAt).toLocaleDateString() : '',
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
      link.download = `operators-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Export Failed', description: 'Failed to export data.', variant: 'destructive' });
    }
  }

  const activeFilterCount =
    (state.filters.status && state.filters.status !== '__all__' ? 1 : 0) +
    (state.filters.operatorType && state.filters.operatorType !== '__all__' ? 1 : 0) +
    (state.filters.region && state.filters.region !== '__all__' ? 1 : 0);

  return (
    <div className="space-y-6">
      <OperatorsStatsCards stats={stats} />

      <OperatorsFilterBar
        searchValue={state.searchQuery}
        onSearchChange={setSearch}
        filters={state.filters}
        onFiltersChange={setFilters}
        onClearAll={clearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <OperatorsTable
        data={filteredTableData.data}
        totalItems={filteredTableData.totalItems}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn}
        sortDirection={state.sortDirection}
        onSort={setSort}
        loading={isLoading}
        onView={(op) => router.push(`/mot/operators/${op.id}`)}
        onEdit={(op) => router.push(`/mot/operators/${op.id}/edit`)}
        onDelete={deleteDialog.open}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Operator"
        description={`Are you sure you want to delete "${deleteDialog.data?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}

