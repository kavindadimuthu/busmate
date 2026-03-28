'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import { SearchFilterBar, SelectFilter } from '@/components/shared/SearchFilterBar';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  RevenueStatsCards,
  RevenueBreakdownPanel,
  RevenueTicketsTable,
  RevenueTrendsChart,
  RevenueActionButtons,
} from '@/components/operator/revenue-analytics';
import {
  useRevenueAnalytics,
  REVENUE_TABS,
} from '@/hooks/operator/revenue-analytics/useRevenueAnalytics';

export default function RevenueAnalyticsPage() {
  useSetPageMetadata({
    title: 'Revenue Analytics',
    description: 'Track ticket sales, revenue breakdowns, and financial performance across your fleet',
    activeItem: 'revenue-analytics',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Revenue Analytics' }],
  });

  const {
    activeTab, setActiveTab, loading, allTickets,
    sortedTickets, paginatedTickets, totalPages,
    kpis, busByRevenue, routeByRevenue, conductorByRevenue, paymentByRevenue, dailySummaries,
    sort, currentPage, setCurrentPage, pageSize,
    searchTerm, filterSelectConfigs, activeChips,
    handleSort, handlePageSizeChange, handleSearchChange,
    handleClearAllFilters, handleExport, loadData,
  } = useRevenueAnalytics();

  useSetPageActions(
    <RevenueActionButtons onExport={handleExport} onRefresh={loadData} isLoading={loading} />,
  );

  return (
    <div className="space-y-6">
      <SwitchableTabs tabs={REVENUE_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      <RevenueStatsCards kpis={kpis} loading={loading} />

      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search tickets by ID, bus, route, conductor, location..."
        totalCount={allTickets.length}
        filteredCount={sortedTickets.length}
        loadedCount={paginatedTickets.length}
        resultLabel="ticket"
        loading={loading}
        filters={
          filterSelectConfigs.length > 0 ? (
            <>{filterSelectConfigs.map(({ key, ...props }) => <SelectFilter key={key} {...props} />)}</>
          ) : undefined
        }
        activeChips={activeChips}
        onClearAllFilters={handleClearAllFilters}
      />

      {activeTab === 'overview' && (
        <>
          <RevenueTrendsChart data={dailySummaries} loading={loading} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RevenueBreakdownPanel title="Revenue by Bus" data={busByRevenue} loading={loading} />
            <RevenueBreakdownPanel title="Revenue by Route" data={routeByRevenue} loading={loading} />
            <RevenueBreakdownPanel title="Revenue by Conductor" data={conductorByRevenue} loading={loading} />
            <RevenueBreakdownPanel title="Revenue by Payment Method" data={paymentByRevenue} loading={loading} maxItems={4} />
          </div>
        </>
      )}

      {activeTab === 'tickets' && (
        <>
          <RevenueTicketsTable data={paginatedTickets} loading={loading} currentSort={sort} onSort={handleSort} />
          <DataPagination
            currentPage={currentPage} totalPages={totalPages} totalElements={sortedTickets.length}
            pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
