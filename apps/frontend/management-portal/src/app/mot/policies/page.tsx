'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Download } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Button, ConfirmDialog, useDialog } from '@busmate/ui';

import { PoliciesTableNew } from '@/components/mot/policies/policies-table';
import { PoliciesFilterBar, type PolicyFiltersState } from '@/components/mot/policies/policies-filter-bar';
import { PoliciesStatsCardsNew } from '@/components/mot/policies/policies-stats-cards';

import {
  getPolicies,
  getPolicyStatistics,
  getPolicyFilterOptions,
  Policy,
} from '@/data/mot/policies';

function PoliciesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useSetPageMetadata({
    title: 'Policy Management',
    description: 'Manage and monitor transport policies',
    activeItem: 'policies',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Policies' }],
  });

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

  // Filter and sort policies
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

    // Sort
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

  // Paginate
  const paginatedPolicies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPolicies.slice(start, start + pageSize);
  }, [filteredPolicies, page, pageSize]);

  // Handlers
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
      {/* Stats Cards */}
      <PoliciesStatsCardsNew stats={statistics} />

      {/* Filters */}
      <PoliciesFilterBar
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearFilters}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
      />

      {/* Table */}
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

      {/* Delete Confirmation */}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-2 text-gray-600">Loading policies...</span>
        </div>
      }
    >
      <PoliciesListContent />
    </Suspense>
  );
}
