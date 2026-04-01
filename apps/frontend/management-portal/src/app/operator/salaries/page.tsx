'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { FilterBar, FilterSelect, Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import { BarChart3, BookOpen, TableProperties } from 'lucide-react';
import {
  SalaryStatsCards,
  SalaryTable,
  SalaryBreakdownPanel,
  SalaryTrendsChart,
  SalaryRulesPanel,
  SalaryActionButtons,
  SalaryDetailModal,
} from '@/components/operator/salaries';
import {
  useSalaryManagement,
  type SalaryTab,
} from '@/hooks/operator/salaries/useSalaryManagement';

export default function SalaryManagementPage() {
  useSetPageMetadata({
    title: 'Salary Management',
    description: 'Track staff salaries, bonuses, deductions, and payment status across your operation',
    activeItem: 'salaries',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Salary Management' }],
  });

  const {
    activeTab, setActiveTab, loading, allRecords, filteredRecords,
    sortedRecords, paginatedRecords, totalPages, stats, monthlySummaries,
    sort, currentPage, setCurrentPage, pageSize, searchTerm,
    detailRecord, filterSelectConfigs, activeFilterCount,
    handleSort, handlePageSizeChange, handleSearchChange,
    handleClearAllFilters, handleExport, handleViewDetail, handleCloseDetail, loadData,
  } = useSalaryManagement();

  useSetPageActions(
    <SalaryActionButtons onExport={handleExport} onRefresh={loadData} isLoading={loading} />,
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SalaryTab)}>
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="records"><TableProperties className="h-4 w-4" /> Salary Records</TabsTrigger>
          <TabsTrigger value="rules"><BookOpen className="h-4 w-4" /> Salary Rules</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab !== 'rules' && <SalaryStatsCards stats={stats} loading={loading} />}

      {activeTab !== 'rules' && (
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by staff name, ID, bus number, route..."
          activeFilterCount={activeFilterCount}
          onClearAll={handleClearAllFilters}
        >
          {filterSelectConfigs.map(({ key, ...props }) => <FilterSelect key={key} {...props} />)}
        </FilterBar>
      )}

      {activeTab === 'overview' && (
        <>
          <SalaryTrendsChart data={monthlySummaries} loading={loading} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SalaryBreakdownPanel records={filteredRecords} loading={loading} />
          </div>
        </>
      )}

      {activeTab === 'records' && (
        <>
          <SalaryTable
            data={paginatedRecords}
            loading={loading}
            sortColumn={sort.field}
            sortDirection={sort.direction}
            onSort={handleSort}
            totalItems={sortedRecords.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            onViewDetail={handleViewDetail}
          />
        </>
      )}

      {activeTab === 'rules' && <SalaryRulesPanel />}

      <SalaryDetailModal record={detailRecord} onClose={handleCloseDetail} />
    </div>
  );
}
