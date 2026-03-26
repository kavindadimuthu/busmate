'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Download } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Button, ConfirmDialog } from '@busmate/ui';

import { PoliciesTableNew } from '@/components/mot/policies/policies-table';
import { PoliciesFilterBar } from '@/components/mot/policies/policies-filter-bar';
import { PoliciesStatsCardsNew } from '@/components/mot/policies/policies-stats-cards';
import { usePolicies } from '@/components/mot/policies/usePolicies';

function PoliciesListContent() {
  const router = useRouter();

  const {
    paginatedPolicies,
    filteredPolicies,
    statistics,
    filterOptions,
    searchTerm,
    filters,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    activeFilterCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDir,
    handleSort,
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,
    handleView,
    handleEdit,
    handleExport,
  } = usePolicies();

  useSetPageMetadata({
    title: 'Policy Management',
    description: 'Manage and monitor transport policies',
    activeItem: 'policies',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Policies' }],
  });

  useSetPageActions(
    <div className="flex items-center gap-2">
      <Button onClick={() => router.push('/mot/policies/upload')}>
        <Upload className="w-4 h-4" />
        Upload Policy
      </Button>
      <Button variant="outline" onClick={handleExport}>
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PoliciesStatsCardsNew stats={statistics} />

      <PoliciesFilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      <PoliciesTableNew
        data={paginatedPolicies}
        totalItems={filteredPolicies.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size: number) => { setPageSize(size); setPage(1); }}
        sortColumn={sortColumn}
        sortDirection={sortDir}
        onSort={handleSort}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(policy: any) => deleteDialog.open(policy)}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete Policy"
        description={`Are you sure you want to delete "${deleteDialog.data?.title ?? 'this policy'}"? This action cannot be undone.`}
        confirmLabel="Delete Policy"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-2 text-muted-foreground">Loading policies...</span>
        </div>
      }
    >
      <PoliciesListContent />
    </Suspense>
  );
}
