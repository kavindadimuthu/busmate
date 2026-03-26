'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDialog } from '@busmate/ui';
import {
  getPolicies,
  getPolicyStatistics,
  getPolicyFilterOptions,
  Policy,
} from '@/data/mot/policies';
import type { PolicyFiltersState } from './PoliciesFilterBar';

// ── Hook ──────────────────────────────────────────────────────────

export function usePolicies() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load data
  const allPolicies = useMemo(() => getPolicies(), []);
  const statistics = useMemo(() => getPolicyStatistics(), []);
  const filterOptions = useMemo(() => getPolicyFilterOptions(), []);

  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<PolicyFiltersState>({
    status: searchParams.get('status') || '__all__',
    type: searchParams.get('type') || '__all__',
    department: searchParams.get('department') || '__all__',
    priority: searchParams.get('priority') || '__all__',
  });

  // Pagination (1-based for DataTable)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sort
  const [sortColumn, setSortColumn] = useState<string | null>('lastModified');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Delete dialog
  const deleteDialog = useDialog<Policy>();
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Filter and sort ───────────────────────────────────────────

  const filteredPolicies = useMemo(() => {
    let filtered = allPolicies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.type.toLowerCase().includes(term) ||
          p.author.toLowerCase().includes(term) ||
          p.department.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (filters.status !== '__all__') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters.type !== '__all__') {
      filtered = filtered.filter((p) => p.type === filters.type);
    }
    if (filters.department !== '__all__') {
      filtered = filtered.filter((p) => p.department === filters.department);
    }
    if (filters.priority !== '__all__') {
      filtered = filtered.filter((p) => p.priority === filters.priority);
    }

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = (a as any)[sortColumn] || '';
        const bVal = (b as any)[sortColumn] || '';
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return filtered;
  }, [allPolicies, searchTerm, filters, sortColumn, sortDir]);

  const paginatedPolicies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, page, pageSize]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleView = useCallback(
    (policy: any) => router.push(`/mot/policies/${policy.id}`),
    [router]
  );

  const handleEdit = useCallback(
    (policy: any) => router.push(`/mot/policies/${policy.id}/edit`),
    [router]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.data) return;
    try {
      setIsDeleting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      deleteDialog.close();
      alert(`Policy "${deleteDialog.data.title}" deleted successfully!`);
    } catch {
      alert('Failed to delete policy. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteDialog]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleFiltersChange = useCallback((partial: Partial<PolicyFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const activeFilterCount = [
    filters.status !== '__all__',
    filters.type !== '__all__',
    filters.department !== '__all__',
    filters.priority !== '__all__',
  ].filter(Boolean).length;

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({ status: '__all__', type: '__all__', department: '__all__', priority: '__all__' });
    setPage(1);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return column;
      }
      setSortDir('asc');
      return column;
    });
    setPage(1);
  }, []);

  const handleExport = useCallback(() => {
    try {
      const dataToExport = filteredPolicies.map((p) => ({
        ID: p.id,
        Title: p.title,
        Type: p.type,
        Status: p.status,
        Version: p.version,
        Author: p.author,
        Department: p.department,
        Priority: p.priority,
        'Effective Date': p.effectiveDate,
        'Last Modified': p.lastModified,
      }));

      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map((row) =>
          headers
            .map((h) => {
              const val = row[h as keyof typeof row];
              return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            })
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `policies-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export. Please try again.');
    }
  }, [filteredPolicies]);

  return {
    // Data
    paginatedPolicies,
    filteredPolicies,
    statistics,
    filterOptions,

    // Filter state
    searchTerm,
    filters,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    activeFilterCount,

    // Table state
    page,
    setPage,
    pageSize,
    setPageSize,
    sortColumn,
    sortDir,
    handleSort,

    // Dialog
    deleteDialog,
    isDeleting,
    handleDeleteConfirm,

    // Actions
    handleView,
    handleEdit,
    handleExport,
  };
}
