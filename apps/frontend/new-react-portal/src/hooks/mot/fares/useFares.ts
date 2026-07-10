'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getActiveAmendment,
  getFareStatistics,
  getAmendmentSummaries,
  getAmendmentStatusOptions,
  PermitType,
} from '@/data/mot/fares';

export function useFares() {
  const router = useRouter();

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
          a.gazetteNumber.toLowerCase().includes(term),
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
    [router],
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

  const handleAmendmentSearchChange = useCallback((v: string) => {
    setAmendmentSearch(v);
    setAmendmentPage(1);
  }, []);

  const handleAmendmentStatusChange = useCallback((f: { status?: string }) => {
    if (f.status !== undefined) {
      setAmendmentStatusFilter(f.status);
      setAmendmentPage(1);
    }
  }, []);

  const handleAmendmentPageSizeChange = useCallback((size: number) => {
    setAmendmentPageSize(size);
    setAmendmentPage(1);
  }, []);

  return {
    // Data
    activeAmendment,
    stats,
    statusOptions,
    // View
    activeView,
    setActiveView,
    // Matrix filters
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
    // Amendments
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
  };
}
