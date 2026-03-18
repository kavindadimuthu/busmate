'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Download, Grid3X3, FileText } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, FilterBar, FilterSelect } from '@busmate/ui';
import {
  getActiveAmendment,
  getFareStatistics,
  getAmendmentSummaries,
  getAmendmentStatusOptions,
  PermitType,
} from '@/data/mot/fares';
import { FareMatrixTable } from '@/components/mot/fares/FareMatrixTable';
import { FareMatrixFilters } from '@/components/mot/fares/FareMatrixFilters';
import { FaresStatsCardsNew } from '@/components/mot/fares/fares-stats-cards';
import { FaresAmendmentsTableNew } from '@/components/mot/fares/fares-amendments-table';

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
  const [activeView, setActiveView] = useState('matrix');

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

  // ── Amendments state ──────────────────────────────────────────
  const [amendmentSearch, setAmendmentSearch] = useState('');
  const [amendmentStatusFilter, setAmendmentStatusFilter] = useState('__all__');
  const [amendmentSortColumn, setAmendmentSortColumn] = useState<string | null>('effectiveDate');
  const [amendmentSortDir, setAmendmentSortDir] = useState<'asc' | 'desc'>('desc');
  const [amendmentPage, setAmendmentPage] = useState(1);
  const [amendmentPageSize, setAmendmentPageSize] = useState(10);

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

    if (amendmentStatusFilter !== '__all__') {
      filtered = filtered.filter((a) => a.status === amendmentStatusFilter);
    }

    if (amendmentSortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = String((a as any)[amendmentSortColumn] ?? '');
        const bVal = String((b as any)[amendmentSortColumn] ?? '');
        const comparison = aVal.localeCompare(bVal);
        return amendmentSortDir === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [allSummaries, amendmentSearch, amendmentStatusFilter, amendmentSortColumn, amendmentSortDir]);

  const paginatedAmendments = useMemo(() => {
    const start = (amendmentPage - 1) * amendmentPageSize;
    return filteredAmendments.slice(start, start + amendmentPageSize);
  }, [filteredAmendments, amendmentPage, amendmentPageSize]);

  const handleAmendmentSort = useCallback((column: string) => {
    setAmendmentSortColumn((prev) => {
      if (prev === column) {
        setAmendmentSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setAmendmentSortDir('asc');
      return column;
    });
  }, []);

  const handleViewAmendment = useCallback(
    (amendment: any) => router.push(`/mot/fares/amendments/${amendment.id}`),
    [router]
  );

  const activeAmendmentFilterCount = [amendmentStatusFilter !== '__all__'].filter(Boolean).length;

  const handleClearAmendmentFilters = useCallback(() => {
    setAmendmentSearch('');
    setAmendmentStatusFilter('__all__');
    setAmendmentPage(1);
  }, []);

  const handleExport = useCallback(() => {
    alert('Export feature coming soon');
  }, []);

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
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <FaresStatsCardsNew stats={stats} />

      {/* Tabbed Views */}
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

        {/* Matrix View */}
        <TabsContent value="matrix" className="space-y-6 mt-6">
          {activeAmendment && (
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
                  onClick={() => handleViewAmendment(activeAmendment)}
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
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
        </TabsContent>

        {/* Amendments View */}
        <TabsContent value="amendments" className="space-y-6 mt-6">
          <FilterBar
            searchValue={amendmentSearch}
            onSearchChange={(v: string) => { setAmendmentSearch(v); setAmendmentPage(1); }}
            searchPlaceholder="Search by reference, title, or gazette number…"
            activeFilterCount={activeAmendmentFilterCount}
            onClearAll={handleClearAmendmentFilters}
          >
            <FilterSelect
              label="Status"
              value={amendmentStatusFilter}
              onChange={(v: string) => { setAmendmentStatusFilter(v); setAmendmentPage(1); }}
              options={statusOptions.map((s: string) => ({ value: s, label: s }))}
              placeholder="All Statuses"
            />
          </FilterBar>

          <FaresAmendmentsTableNew
            data={paginatedAmendments}
            totalItems={filteredAmendments.length}
            page={amendmentPage}
            pageSize={amendmentPageSize}
            onPageChange={setAmendmentPage}
            onPageSizeChange={(size: number) => { setAmendmentPageSize(size); setAmendmentPage(1); }}
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
