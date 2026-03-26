'use client';

import { useRouter } from 'next/navigation';
import { Plus, Download, Grid3X3, FileText } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@busmate/ui';
import { FareMatrixTabContent } from '@/components/mot/fares/FareMatrixTabContent';
import { FaresStatsCardsNew } from '@/components/mot/fares/fares-stats-cards';
import { FaresAmendmentsTableNew } from '@/components/mot/fares/fares-amendments-table';
import { FaresFilterBar } from '@/components/mot/fares/fares-filter-bar';
import { useFares } from '@/components/mot/fares/useFares';

export default function FaresPage() {
  const router = useRouter();

  const {
    activeAmendment, stats, statusOptions, activeView, setActiveView, maxStages,
    stageFrom, setStageFrom, stageTo, setStageTo, searchFare, setSearchFare,
    selectedPermitTypes, setSelectedPermitTypes, handleClearMatrixFilters,
    amendmentSearch, handleAmendmentSearchChange, amendmentStatusFilter,
    handleAmendmentStatusChange, filteredAmendments, paginatedAmendments,
    amendmentSortColumn, amendmentSortDir, handleAmendmentSort, amendmentPage,
    setAmendmentPage, amendmentPageSize, handleAmendmentPageSizeChange,
    activeAmendmentFilterCount, handleClearAmendmentFilters, handleViewAmendment, handleExport,
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
            <FareMatrixTabContent
              amendment={activeAmendment}
              stageFrom={stageFrom} onStageFromChange={setStageFrom}
              stageTo={stageTo} onStageToChange={setStageTo}
              maxStages={maxStages} searchFare={searchFare}
              onSearchFareChange={setSearchFare}
              selectedPermitTypes={selectedPermitTypes}
              onPermitTypesChange={setSelectedPermitTypes}
              onClearFilters={handleClearMatrixFilters}
              onViewDetails={handleViewAmendment}
            />
          )}
        </TabsContent>

        <TabsContent value="amendments" className="space-y-6 mt-6">
          <FaresFilterBar
            searchValue={amendmentSearch} onSearchChange={handleAmendmentSearchChange}
            filters={{ status: amendmentStatusFilter }} onFiltersChange={handleAmendmentStatusChange}
            onClearAll={handleClearAmendmentFilters} statusOptions={statusOptions}
            activeFilterCount={activeAmendmentFilterCount}
          />
          <FaresAmendmentsTableNew
            data={paginatedAmendments} totalItems={filteredAmendments.length}
            page={amendmentPage} pageSize={amendmentPageSize}
            onPageChange={setAmendmentPage} onPageSizeChange={handleAmendmentPageSizeChange}
            sortColumn={amendmentSortColumn} sortDirection={amendmentSortDir}
            onSort={handleAmendmentSort} onView={handleViewAmendment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
