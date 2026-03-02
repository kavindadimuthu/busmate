'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  getActiveAmendment,
  getFareStatistics,
  getAmendmentSummaries,
  getAmendmentStatusOptions,
  PermitType,
  FareAmendmentSummary,
} from '@/data/mot/fares';
import { SwitchableTabs, TabItem } from '@/components/shared/SwitchableTabs';
import { FareStatsCards } from '@/components/mot/fares/FareStatsCards';
import { FareMatrixTable } from '@/components/mot/fares/FareMatrixTable';
import { FareMatrixFilters } from '@/components/mot/fares/FareMatrixFilters';
import { FareAmendmentsTable } from '@/components/mot/fares/FareAmendmentsTable';
import { FareAmendmentFilters } from '@/components/mot/fares/FareAmendmentFilters';
import { DataPagination } from '@/components/shared/DataPagination';
import { Plus, Download, Grid3X3, FileText } from 'lucide-react';

type FaresView = 'matrix' | 'amendments';

const VIEW_TABS: TabItem<FaresView>[] = [
  { id: 'matrix', label: 'Fare Matrix', icon: Grid3X3 },
  { id: 'amendments', label: 'Amendments', icon: FileText },
];

export default function FaresPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Fare Structures',
    description: 'View and manage stage-based fare structures for public bus transportation',
    activeItem: 'fares',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fares' }],
  });

  // Data
  const activeAmendment = useMemo(() => getActiveAmendment(), []);
  const stats = useMemo(() => getFareStatistics(), []);
  const allSummaries = useMemo(() => getAmendmentSummaries(), []);
  const statusOptions = useMemo(() => getAmendmentStatusOptions(), []);

  // View toggle
  const [activeView, setActiveView] = useState<FaresView>('matrix');

  // ── Matrix filters ──────────────────────────────────────────────
  const maxStages = activeAmendment?.maxStages ?? 350;
  const [stageFrom, setStageFrom] = useState(1);
  const [stageTo, setStageTo] = useState(Math.min(50, maxStages));
  const [searchFare, setSearchFare] = useState('');
  const [selectedPermitTypes, setSelectedPermitTypes] = useState<PermitType[]>([]);

  const handleClearMatrixFilters = useCallback(() => {
    setStageFrom(1);
    setStageTo(Math.min(50, maxStages));
    setSearchFare('');
    setSelectedPermitTypes([]);
  }, [maxStages]);

  // ── Amendments filters ──────────────────────────────────────────
  const [amendmentSearch, setAmendmentSearch] = useState('');
  const [amendmentStatusFilter, setAmendmentStatusFilter] = useState('all');
  const [amendmentSortField, setAmendmentSortField] = useState('effectiveDate');
  const [amendmentSortDir, setAmendmentSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredAmendments = useMemo(() => {
    let filtered = allSummaries;

    if (amendmentSearch) {
      const term = amendmentSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.referenceNumber.toLowerCase().includes(term) ||
          a.title.toLowerCase().includes(term) ||
          a.gazetteNumber.toLowerCase().includes(term)
      );
    }

    if (amendmentStatusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === amendmentStatusFilter);
    }

    filtered = [...filtered].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      switch (amendmentSortField) {
        case 'referenceNumber': aVal = a.referenceNumber; bVal = b.referenceNumber; break;
        case 'title': aVal = a.title; bVal = b.title; break;
        case 'effectiveDate': aVal = a.effectiveDate; bVal = b.effectiveDate; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        default: aVal = a.effectiveDate; bVal = b.effectiveDate;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return amendmentSortDir === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allSummaries, amendmentSearch, amendmentStatusFilter, amendmentSortField, amendmentSortDir]);

  // Amendments pagination
  const [amendmentPage, setAmendmentPage] = useState(0);
  const [amendmentPageSize, setAmendmentPageSize] = useState(10);
  const amendmentTotalPages = Math.max(1, Math.ceil(filteredAmendments.length / amendmentPageSize));
  const paginatedAmendments = filteredAmendments.slice(
    amendmentPage * amendmentPageSize,
    (amendmentPage + 1) * amendmentPageSize
  );

  const handleAmendmentSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setAmendmentSortField(field);
    setAmendmentSortDir(direction);
  }, []);

  const handleViewAmendment = useCallback((id: string) => {
    router.push(`/mot/fares/amendments/${id}`);
  }, [router]);

  const handleClearAmendmentFilters = useCallback(() => {
    setAmendmentSearch('');
    setAmendmentStatusFilter('all');
  }, []);

  const handleExport = useCallback(() => {
    alert('Export feature coming soon');
  }, []);

  useSetPageActions(
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => router.push('/mot/fares/amendments/new')}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Amendment
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <FareStatsCards stats={stats} />

      {/* View Tabs */}
      <SwitchableTabs<FaresView>
        tabs={VIEW_TABS}
        activeTab={activeView}
        onTabChange={setActiveView}
        ariaLabel="Fare management view"
      />

      {/* Matrix View */}
      {activeView === 'matrix' && activeAmendment && (
        <>
          {/* Active Amendment Info Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Current Fare Structure: {activeAmendment.referenceNumber}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {activeAmendment.title} — Effective from{' '}
                {new Date(activeAmendment.effectiveDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={() => handleViewAmendment(activeAmendment.id)}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              View full details
            </button>
          </div>

          {/* Matrix Filters */}
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

          {/* Matrix Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

      {/* Amendments View */}
      {activeView === 'amendments' && (
        <>
          <FareAmendmentFilters
            searchTerm={amendmentSearch}
            onSearchChange={setAmendmentSearch}
            statusFilter={amendmentStatusFilter}
            onStatusChange={setAmendmentStatusFilter}
            statusOptions={statusOptions}
            totalCount={allSummaries.length}
            filteredCount={filteredAmendments.length}
            onClearAll={handleClearAmendmentFilters}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <FareAmendmentsTable
              amendments={paginatedAmendments}
              onView={handleViewAmendment}
              onSort={handleAmendmentSort}
              currentSort={{ field: amendmentSortField, direction: amendmentSortDir }}
            />

            <DataPagination
              currentPage={amendmentPage}
              totalPages={amendmentTotalPages}
              totalElements={filteredAmendments.length}
              pageSize={amendmentPageSize}
              onPageChange={setAmendmentPage}
              onPageSizeChange={(size) => { setAmendmentPageSize(size); setAmendmentPage(0); }}
            />
          </div>
        </>
      )}
    </div>
  );
}
