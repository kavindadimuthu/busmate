'use client';

import { useRouter } from 'next/navigation';
import { Plus, Download, Grid3X3, FileText } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@busmate/ui';
import { FareMatrixTable } from '@/components/mot/fares/FareMatrixTable';
import { FareMatrixFilters } from '@/components/mot/fares/FareMatrixFilters';
import { FaresStatsCardsNew } from '@/components/mot/fares/fares-stats-cards';
import { FaresAmendmentsTableNew } from '@/components/mot/fares/fares-amendments-table';
import { FaresFilterBar } from '@/components/mot/fares/fares-filter-bar';
import { useFares } from '@/components/mot/fares/useFares';

export default function FaresPage() {
  const router = useRouter();

  const {
    activeAmendment,
    stats,
    statusOptions,
    activeView,
    setActiveView,
    maxStages,
    stageFrom,
    setStageFrom,
    stageTo,
    setStageTo,
    searchFare,
    setSearchFare,
    selectedPermitTypes,
    setSelectedPermitTypes,
    handleClearMatrixFilters,
    amendmentSearch,
    handleAmendmentSearchChange,
    amendmentStatusFilter,
    handleAmendmentStatusChange,
    filteredAmendments,
    paginatedAmendments,
    amendmentSortColumn,
    amendmentSortDir,
    handleAmendmentSort,
    amendmentPage,
    setAmendmentPage,
    amendmentPageSize,
    handleAmendmentPageSizeChange,
    activeAmendmentFilterCount,
    handleClearAmendmentFilters,
    handleViewAmendment,
    handleExport,
  } = useFares();

  useSetPageMetadata({
    title: 'Fare Structures',
    description: 'View and manage stage-based fare structures for public bus transportation',
    activeItem: 'fares',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fares' }],
  });

  useSetPageActions(
    <div className="flex items-center gap-2 shrink-0">
      <Button onClick={() => router.push('/mot/fares/amendments/new')}>
        <Plus className="w-4 h-4" />
        New Amendment
      </Button>
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>,
  );

  return (
    <div className="space-y-6">
      <FaresStatsCardsNew stats={stats} />

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="matrix">
            <Grid3X3 className="w-4 h-4 mr-1.5" />
            Fare Matrix
          </TabsTrigger>
          <TabsTrigger value="amendments">
            <FileText className="w-4 h-4 mr-1.5" />
            Amendments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6 mt-6">
          {activeAmendment && (
            <>
              <div className="bg-success/10 border border-success/20 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-success">
                    Current Fare Structure: {activeAmendment.referenceNumber}
                  </p>
                  <p className="text-xs text-success mt-0.5">
                    {activeAmendment.title} — Effective from{' '}
                    {new Date(activeAmendment.effectiveDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleViewAmendment(activeAmendment)}
                  className="text-xs font-medium text-success hover:text-success/70 hover:underline"
                >
                  View full details
                </button>
              </div>

              <FareMatrixFilters
                stageFrom={stageFrom}
                onStageFromChange={setStageFrom}
                stageTo={stageTo}
                onStageToChange={setStageTo}
                maxStages={maxStages}
                searchFare={searchFare}
                onSearchFareChange={setSearchFare}
                selectedPermitTypes={selectedPermitTypes}
                onPermitTypesChange={setSelectedPermitTypes}
                onClearAll={handleClearMatrixFilters}
              />

              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <FareMatrixTable
                  matrix={activeAmendment.matrix}
                  stageFrom={stageFrom}
                  stageTo={stageTo}
                  searchFare={searchFare}
                  highlightPermitTypes={selectedPermitTypes}
                />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="amendments" className="space-y-6 mt-6">
          <FaresFilterBar
            searchValue={amendmentSearch}
            onSearchChange={handleAmendmentSearchChange}
            filters={{ status: amendmentStatusFilter }}
            onFiltersChange={handleAmendmentStatusChange}
            onClearAll={handleClearAmendmentFilters}
            statusOptions={statusOptions}
            activeFilterCount={activeAmendmentFilterCount}
          />

          <FaresAmendmentsTableNew
            data={paginatedAmendments}
            totalItems={filteredAmendments.length}
            page={amendmentPage}
            pageSize={amendmentPageSize}
            onPageChange={setAmendmentPage}
            onPageSizeChange={handleAmendmentPageSizeChange}
            sortColumn={amendmentSortColumn}
            sortDirection={amendmentSortDir}
            onSort={handleAmendmentSort}
            onView={handleViewAmendment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
