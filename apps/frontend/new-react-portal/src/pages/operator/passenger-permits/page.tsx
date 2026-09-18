'use client';

import { Plus, RefreshCw, Info } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useOperatorPermits } from '@/hooks/operator/permits/useOperatorPermits';
import { PermitStatsCards } from '@/components/operator/permits/PermitStatsCards';
import { PermitFilters } from '@/components/operator/permits/PermitFilters';
import { PermitsTable } from '@/components/operator/permits/PermitsTable';
import { ErrorBanner } from '@/components/shared/form-primitives';

export default function ServicePermitsPage() {
  const router = useRouter();
  const {
    state, permits, totalItems, stats, isLoading, error, setError, refresh,
    setPage, setPageSize, setSort, setSearch, setFilters,
  } = useOperatorPermits();

  useSetPageMetadata({
    title: 'Service Permits',
    description: 'The passenger service permits your company holds',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Service Permits' }],
  });

  useSetPageActions(
    <div className="flex items-center gap-2">
      <button
        onClick={refresh}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </button>
      <button
        onClick={() => router.push('/operator/passenger-permits/create')}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Permit
      </button>
    </div>,
  );

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      <PermitStatsCards stats={stats} loading={isLoading && !stats} />

      <PermitFilters
        search={state.searchQuery}
        onSearch={setSearch}
        status={state.filters.status}
        onStatus={(status) => setFilters({ status })}
        permitType={state.filters.permitType}
        onPermitType={(permitType) => setFilters({ permitType })}
        onClearAll={() => setFilters({ status: '__all__', permitType: '__all__' })}
      />

      <PermitsTable
        permits={permits}
        totalItems={totalItems}
        loading={isLoading}
        page={state.page}
        pageSize={state.pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sortColumn={state.sortColumn ?? undefined}
        sortDirection={state.sortDirection}
        onSort={setSort}
        onView={(id) => router.push(`/operator/passenger-permits/${id}`)}
      />

      <div className="flex items-start gap-2.5 p-3.5 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Permits are applied for and issued outside BusMate. Record each permit you hold here so trips can be
          assigned to it; a recorded permit is in force immediately. The Ministry of Transport can see every
          permit and may suspend one.
        </span>
      </div>
    </div>
  );
}
