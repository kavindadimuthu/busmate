'use client';

import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { SwitchableTabs } from '@/components/shared/SwitchableTabs';
import { SearchFilterBar, SelectFilter } from '@/components/shared/SearchFilterBar';
import { DataPagination } from '@/components/shared/DataPagination';
import {
  SalaryStatsCards,
  SalaryTable,
  SalaryBreakdownPanel,
  SalaryTrendsChart,
  SalaryRulesPanel,
  SalaryActionButtons,
  SalaryDetailModal,
} from '@/components/operator/salary-mgmt';
import {
  useSalaryManagement,
  SALARY_TABS,
} from '@/hooks/operator/salary-mgmt/useSalaryManagement';

export default function SalaryManagementPage() {
  useSetPageMetadata({
    title: 'Salary Management',
    description: 'Track staff salaries, bonuses, deductions, and payment status across your operation',
    activeItem: 'salary-management',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Salary Management' }],
  });

  const {
    activeTab, setActiveTab, loading, allRecords, filteredRecords,
    sortedRecords, paginatedRecords, totalPages, stats, monthlySummaries,
    sort, currentPage, setCurrentPage, pageSize, searchTerm,
    detailRecord, filterSelectConfigs, activeChips,
    handleSort, handlePageSizeChange, handleSearchChange,
    handleClearAllFilters, handleExport, handleViewDetail, handleCloseDetail, loadData,
  } = useSalaryManagement();

  useSetPageActions(
    <SalaryActionButtons onExport={handleExport} onRefresh={loadData} isLoading={loading} />,
  );

  return (
    <div className="space-y-6">
      <SwitchableTabs tabs={SALARY_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab !== 'rules' && <SalaryStatsCards stats={stats} loading={loading} />}

      {activeTab !== 'rules' && (
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by staff name, ID, bus number, route..."
          totalCount={allRecords.length}
          filteredCount={sortedRecords.length}
          loadedCount={paginatedRecords.length}
          resultLabel="salary record"
          loading={loading}
          filters={
            filterSelectConfigs.length > 0 ? (
              <>{filterSelectConfigs.map(({ key, ...props }) => <SelectFilter key={key} {...props} />)}</>
            ) : undefined
          }
          activeChips={activeChips}
          onClearAllFilters={handleClearAllFilters}
        />
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
            data={paginatedRecords} loading={loading} currentSort={sort}
            onSort={handleSort} onViewDetail={handleViewDetail}
          />
          <DataPagination
            currentPage={currentPage} totalPages={totalPages} totalElements={sortedRecords.length}
            pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </>
      )}

      {activeTab === 'rules' && <SalaryRulesPanel />}

      <SalaryDetailModal record={detailRecord} onClose={handleCloseDetail} />
    </div>
  );
}
