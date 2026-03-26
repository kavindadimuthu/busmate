'use client';

import { Suspense } from 'react';
import { RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useServicePermits } from '@/hooks/useServicePermits';
import { PermitStatsCards } from '@/components/operator/permits/PermitStatsCards';
import { PermitFilters } from '@/components/operator/permits/PermitFilters';
import { PermitsTable } from '@/components/operator/permits/PermitsTable';
import { DataPagination } from '@/components/shared/DataPagination';

function ServicePermitsContent() {
  useSetPageMetadata({
    title: 'Service Permits',
    description: 'View your passenger service permits issued by the Ministry of Transport',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Service Permits' }],
  });

  const {
    permits, statistics, filterOptions, error, setError, loading, initialized,
    filters, pagination, sort, handleView, handleSort, handleFilterChange,
    handleClearFilters, handleRefresh, onPageChange, onPageSizeChange,
  } = useServicePermits();

  useSetPageActions(
    <button onClick={handleRefresh} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>,
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Failed to load permits</p>
            <p className="text-sm text-destructive mt-0.5">{error}</p>
            <button onClick={() => setError(null)} className="text-sm text-destructive hover:text-destructive underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      <PermitStatsCards stats={statistics} loading={!initialized} />

      <PermitFilters
        searchTerm={filters.search}
        setSearchTerm={(v) => handleFilterChange({ search: v })}
        statusFilter={filters.status}
        setStatusFilter={(v) => handleFilterChange({ status: v })}
        permitTypeFilter={filters.permitType}
        setPermitTypeFilter={(v) => handleFilterChange({ permitType: v })}
        filterOptions={filterOptions}
        loading={loading}
        totalCount={statistics?.totalPermits ?? 0}
        filteredCount={pagination.totalElements}
        onClearAll={handleClearFilters}
      />

      <div className="bg-card shadow-sm rounded-xl border border-border overflow-hidden">
        <PermitsTable permits={permits} loading={loading} currentSort={sort} onSort={handleSort} onView={handleView} />
        <DataPagination
          currentPage={pagination.currentPage} totalPages={pagination.totalPages}
          totalElements={pagination.totalElements} pageSize={pagination.pageSize}
          onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} loading={loading}
        />
      </div>

      <div className="flex items-start gap-2.5 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Service permits are issued and managed by the Ministry of Transport. This view is read-only. Contact the MOT to request changes or renewals.</span>
      </div>
    </div>
  );
}

export default function ServicePermitsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    }>
      <ServicePermitsContent />
    </Suspense>
  );
}
