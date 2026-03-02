'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { 
  OperatorAdvancedFilters, 
  OperatorActionButtons, 
  OperatorStatsCards, 
  OperatorsTable 
} from '@/components/mot/operators';
import { DataPagination } from '@/components/shared/DataPagination';
import { OperatorManagementService, OperatorResponse } from '../../../../generated/api-clients/route-management';
import DeleteOperatorModal from '@/components/mot/users/operator/DeleteOperatorModal';

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  operatorType?: 'PRIVATE' | 'CTB';
  status?: 'pending' | 'active' | 'inactive' | 'cancelled';
}

interface FilterOptions {
  statuses: Array<'pending' | 'active' | 'inactive' | 'cancelled'>;
  operatorTypes: Array<'PRIVATE' | 'CTB'>;
  regions: Array<string>;
}

export default function OperatorsPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorTypeFilter, setOperatorTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    operatorTypes: [],
    regions: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc',
    search: '',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalOperators: { count: 0 },
    activeOperators: { count: 0 },
    inactiveOperators: { count: 0 },
    privateOperators: { count: 0 },
    ctbOperators: { count: 0 },
    totalRegions: { count: 0 }
  });

  // State for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<OperatorResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      setFilterOptionsLoading(true);
      const filterOptionsResponse = await OperatorManagementService.getFilterOptions();

      setFilterOptions({
        statuses: ['pending', 'active', 'inactive', 'cancelled'],
        operatorTypes: ['PRIVATE', 'CTB'],
        regions: filterOptionsResponse.regions || []
      });
    } catch (err) {
      console.error('Error loading filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const statsResponse = await OperatorManagementService.getOperatorStatistics();

      setStats({
        totalOperators: { count: statsResponse.totalOperators || 0 },
        activeOperators: { count: statsResponse.activeOperators || 0 },
        inactiveOperators: { count: statsResponse.inactiveOperators || 0 },
        privateOperators: { count: statsResponse.privateOperators || 0 },
        ctbOperators: { count: statsResponse.ctbOperators || 0 },
        totalRegions: { count: statsResponse.operatorsByRegion ? Object.keys(statsResponse.operatorsByRegion).length : 0 }
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, []);

  // Load operators from API
  const loadOperators = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await OperatorManagementService.getAllOperators(
        queryParams.page,
        queryParams.size,
        queryParams.sortBy,
        queryParams.sortDir,
        queryParams.search || undefined,
        queryParams.operatorType,
        queryParams.status
      );

      setOperators(response.content || []);
      setPagination({
        currentPage: response.number || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageSize: response.size || 10,
      });
    } catch (err) {
      console.error('Error loading operators:', err);
      setError('Failed to load operators. Please try again.');
      setOperators([]);
      setPagination({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: 10,
      });
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadFilterOptions();
    loadStatistics();
  }, [loadFilterOptions, loadStatistics]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  // Update query params with filters (optimized to prevent unnecessary updates)
  const updateQueryParams = useCallback((updates: Partial<QueryParams>) => {
    setQueryParams(prev => {
      const newParams = { ...prev, ...updates };

      // Handle explicit undefined values (for clearing filters)
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof QueryParams] === undefined) {
          delete newParams[key as keyof QueryParams];
        }
      });

      // Convert current filter states to API parameters (only if not explicitly overridden)
      if (!('status' in updates)) {
        if (statusFilter !== 'all') {
          newParams.status = statusFilter as 'pending' | 'active' | 'inactive' | 'cancelled';
        } else {
          delete newParams.status;
        }
      }

      if (!('operatorType' in updates)) {
        if (operatorTypeFilter !== 'all') {
          newParams.operatorType = operatorTypeFilter as 'PRIVATE' | 'CTB';
        } else {
          delete newParams.operatorType;
        }
      }

      // Only update if something actually changed
      const hasChanges = Object.keys(newParams).some(key => {
        const typedKey = key as keyof QueryParams;
        return newParams[typedKey] !== prev[typedKey];
      }) || Object.keys(prev).some(key => {
        const typedKey = key as keyof QueryParams;
        return prev[typedKey] !== newParams[typedKey];
      });

      return hasChanges ? newParams : prev;
    });
  }, [statusFilter, operatorTypeFilter]);

  // Apply filters when they change (with debounce for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParams({ page: 0 });
    }, 300); // Short debounce for filter changes

    return () => clearTimeout(timer);
  }, [statusFilter, operatorTypeFilter, updateQueryParams]);

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
    updateQueryParams({ search: searchTerm, page: 0 });
  };

  const handleSort = (sortBy: string, sortDir: 'asc' | 'desc') => {
    updateQueryParams({ sortBy, sortDir, page: 0 });
  };

  const handlePageChange = (page: number) => {
    updateQueryParams({ page });
  };

  const handlePageSizeChange = (size: number) => {
    updateQueryParams({ size, page: 0 });
  };

  const handleClearAllFilters = useCallback(() => {
    // Clear all filter states
    setSearchTerm('');
    setStatusFilter('all');
    setOperatorTypeFilter('all');
    setRegionFilter('all');
    
    // Immediately update query params to clear all filters and trigger new API call
    setQueryParams(prev => {
      const newParams = {
        ...prev,
        search: '',
        page: 0
      };
      
      // Remove all filter-related parameters
      delete newParams.status;
      delete newParams.operatorType;
      
      return newParams;
    });
  }, []);

  const handleAddNewOperator = () => {
    router.push('/mot/operators/add-new');
  };

  const handleImportOperators = () => {
    router.push('/mot/operators/import');
  };

  const handleExportAll = async () => {
    try {
      const dataToExport = operators.map(operator => ({
        ID: operator.id || '',
        Name: operator.name || '',
        'Operator Type': operator.operatorType || '',
        Region: operator.region || '',
        Status: operator.status || '',
        'Created At': operator.createdAt ? new Date(operator.createdAt).toLocaleDateString() : '',
        'Updated At': operator.updatedAt ? new Date(operator.updatedAt).toLocaleDateString() : '',
        'Created By': operator.createdBy || '',
        'Updated By': operator.updatedBy || '',
      }));

      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = Object.keys(dataToExport[0]);
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `operators-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleView = (operatorId: string) => {
    router.push(`/mot/operators/${operatorId}`);
  };

  const handleEdit = (operatorId: string) => {
    router.push(`/mot/operators/${operatorId}/edit`);
  };

  const handleDelete = (operatorId: string, operatorName: string) => {
    const operator = operators.find(o => o.id === operatorId);
    if (operator) {
      setOperatorToDelete(operator);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setOperatorToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!operatorToDelete?.id) return;

    try {
      setIsDeleting(true);
      await OperatorManagementService.deleteOperator(operatorToDelete.id);
      await loadOperators(); // Refresh the list
      await loadStatistics(); // Refresh stats
      setShowDeleteModal(false);
      setOperatorToDelete(null);
    } catch (error) {
      console.error('Error deleting operator:', error);
      setError('Failed to delete operator. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter operators for region (client-side since API doesn't support region filtering)
  const filteredOperators = React.useMemo(() => {
    if (regionFilter === 'all') return operators;
    return operators.filter(operator => operator.region === regionFilter);
  }, [operators, regionFilter]);

  // Transform operators for the table
  const transformedOperators = React.useMemo(() => {
    return filteredOperators.map(operator => ({
      id: operator.id || '',
      name: operator.name || '',
      operatorType: operator.operatorType,
      region: operator.region,
      status: operator.status,
      createdAt: operator.createdAt,
      updatedAt: operator.updatedAt,
    }));
  }, [filteredOperators]);

  useSetPageMetadata({
    title: 'Operators',
    description: 'Manage bus operators and their details',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Operators' }],
  });

  useSetPageActions(
    <OperatorActionButtons
      onAddOperator={handleAddNewOperator}
      onImportOperators={handleImportOperators}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />
  );

  if (isLoading && operators.length === 0) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <OperatorStatsCards stats={stats} />

        {/* Advanced Filters */}
        <OperatorAdvancedFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            operatorTypeFilter={operatorTypeFilter}
            setOperatorTypeFilter={setOperatorTypeFilter}
            regionFilter={regionFilter}
            setRegionFilter={setRegionFilter}
            filterOptions={filterOptions}
            loading={filterOptionsLoading}
            totalCount={pagination.totalElements}
            filteredCount={transformedOperators.length}
            onSearch={handleSearch}
            onClearAll={handleClearAllFilters}
          />

        {/* Operators Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <OperatorsTable
            operators={transformedOperators}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSort={handleSort}
            activeFilters={{
              search: searchTerm,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              operatorType: operatorTypeFilter !== 'all' ? operatorTypeFilter : undefined,
              region: regionFilter !== 'all' ? regionFilter : undefined,
            }}
            loading={isLoading}
            currentSort={{ field: queryParams.sortBy, direction: queryParams.sortDir }}
          />
          
          {/* Pagination */}
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={isLoading}
          />
        </div>

        {/* Delete Operator Modal */}
        <DeleteOperatorModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          operator={operatorToDelete}
          isDeleting={isDeleting}
          busCount={0} // TODO: Calculate bus count if needed
        />
      </div>
  );
}