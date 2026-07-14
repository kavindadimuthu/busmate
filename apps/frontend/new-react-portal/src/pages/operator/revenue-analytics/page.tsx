'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { FilterBar, FilterSelect, Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import { BarChart3, Ticket } from 'lucide-react';
import {
  RevenueStatsCards,
  RevenueBreakdownPanel,
  RevenueTicketsTable,
  RevenueTrendsChart,
  RevenueActionButtons,
} from '@/components/operator/revenue-analytics';
import {
  useRevenueAnalytics,
  type RevenueTab,
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
    searchTerm, filterSelectConfigs, activeFilterCount,
    handleSort, handlePageSizeChange, handleSearchChange,
    handleClearAllFilters, handleExport, loadData,
  } = useRevenueAnalytics();

  useSetPageActions(
    <RevenueActionButtons onExport={handleExport} onRefresh={loadData} isLoading={loading} />,
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RevenueTab)}>
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="tickets"><Ticket className="h-4 w-4" /> All Tickets</TabsTrigger>
        </TabsList>
      </Tabs>
      <RevenueStatsCards kpis={kpis} loading={loading} />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search tickets by ID, bus, route, conductor, location..."
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
      >
        {filterSelectConfigs.map(({ key, ...props }) => <FilterSelect key={key} {...props} />)}
      </FilterBar>

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
          <RevenueTicketsTable
            data={paginatedTickets}
            loading={loading}
            sortColumn={sort.field}
            sortDirection={sort.direction}
            onSort={handleSort}
            totalItems={sortedTickets.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
