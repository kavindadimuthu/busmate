'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { BusStatsCards } from '@/components/mot/buses/BusStatsCards';
import BusAdvancedFilters from '@/components/mot/buses/BusAdvancedFilters';
import { BusActionButtons } from '@/components/mot/buses/BusActionButtons';
import { BusesTable } from '@/components/mot/buses/BusesTable';
import { DataPagination } from '@/components/shared/DataPagination';
import DeleteBusModal from '@/components/mot/buses/DeleteBusModal';
import { 
  BusManagementService,
  BusResponse,
  PageBusResponse 
} from '../../../../generated/api-clients/route-management';

interface QueryParams {
  page: number;
  size: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  search: string;
  operatorId?: string;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  minCapacity?: string;
  maxCapacity?: string;
  model?: string;
}

interface FilterOptions {
  statuses: Array<string>;
  operators: Array<{ id: string; name: string; type?: string }>;
  models: Array<string>;
  capacityRanges: Array<string>;
}

export default function BusesPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Buses Management',
    description: 'Manage and monitor bus fleet across all operators',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses' }],
  });


  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [modelFilter, setModelFilter] = useState('all');

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    operators: [],
    models: [],
    capacityRanges: []
  });
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);

  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 0,
    size: 10,
    sortBy: 'ntcRegistrationNumber',
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
    totalBuses: { count: 0 },
    activeBuses: { count: 0 },
    inactiveBuses: { count: 0 },
    totalOperators: { count: 0 },
    averageCapacity: { count: 0 },
    totalCapacity: { count: 0 }
  });

  // State for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [busToDelete, setBusToDelete] = useState<BusResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await BusManagementService.getBusFilterOptions();
      setFilterOptions({
        statuses: response.statuses || [],
        operators: (response.operators || []).map(op => ({
          id: op.id || '',
          name: op.name || '',
          type: op.operatorType || ''
        })).filter(op => op.id),
        models: response.models || [],
        capacityRanges: response.capacityRanges || []
      });
    } catch (err) {
      console.error('Failed to load filter options:', err);
    } finally {
      setFilterOptionsLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const response = await BusManagementService.getBusStatistics();
      setStats({
        totalBuses: { count: response.totalBuses || 0 },
        activeBuses: { count: response.activeBuses || 0 },
        inactiveBuses: { count: response.inactiveBuses || 0 },
        totalOperators: { count: response.averageBusesPerOperator ? Math.round((response.totalBuses || 0) / response.averageBusesPerOperator) : 0 },
        averageCapacity: { count: response.averageCapacity || 0 },
        totalCapacity: { count: response.totalCapacity || 0 }
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  // Load buses from API
  const loadBuses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response: PageBusResponse = await BusManagementService.getAllBuses(
        queryParams.page,
        queryParams.size,
        queryParams.sortBy,
        queryParams.sortDir,
        queryParams.search || undefined,
        queryParams.operatorId || undefined,
        queryParams.status || undefined,
        queryParams.minCapacity ? parseInt(queryParams.minCapacity) : undefined,
        queryParams.maxCapacity ? parseInt(queryParams.maxCapacity) : undefined
      );

      setBuses(response.content || []);
      setPagination({
        currentPage: response.number || 0,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
        pageSize: response.size || 10,
      });
    } catch (err) {
      console.error('Failed to load buses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load buses');
      setBuses([]);
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
    loadBuses();
  }, [loadBuses]);

  // Update query params with filters (optimized to prevent unnecessary updates)
  const updateQueryParams = useCallback((updates: Partial<QueryParams>) => {
    setQueryParams(prev => {
      const newParams = { ...prev, ...updates };
      
      // Apply current filter states to the params
      const statusValue = statusFilter !== 'all' ? statusFilter as 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED' : undefined;
      const operatorValue = operatorFilter !== 'all' ? operatorFilter : undefined;
      const minCapacityValue = minCapacity || undefined;
      const maxCapacityValue = maxCapacity || undefined;
      const modelValue = modelFilter !== 'all' ? modelFilter : undefined;

      // Only update if there are actual changes
      const finalParams = {
        ...newParams,
        status: updates.status !== undefined ? updates.status : statusValue,
        operatorId: updates.operatorId !== undefined ? updates.operatorId : operatorValue,
        minCapacity: updates.minCapacity !== undefined ? updates.minCapacity : minCapacityValue,
        maxCapacity: updates.maxCapacity !== undefined ? updates.maxCapacity : maxCapacityValue,
        model: updates.model !== undefined ? updates.model : modelValue,
      };

      // Check if params actually changed to prevent unnecessary re-renders
      const paramsChanged = Object.keys(finalParams).some(key => {
        const oldValue = prev[key as keyof QueryParams];
        const newValue = finalParams[key as keyof QueryParams];
        return oldValue !== newValue;
      });

      if (!paramsChanged) {
        return prev;
      }

      return finalParams;
    });
  }, [statusFilter, operatorFilter, minCapacity, maxCapacity, modelFilter]);

  // Apply filters when they change (with debounce for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateQueryParams({ page: 0 }); // Reset to first page when filters change
    }, 300); // Short debounce for filter changes

    return () => clearTimeout(timer);
  }, [statusFilter, operatorFilter, minCapacity, maxCapacity, modelFilter, updateQueryParams]);

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
    setOperatorFilter('all');
    setMinCapacity('');
    setMaxCapacity('');
    setModelFilter('all');
    
    // Immediately update query params to clear all filters and trigger new API call
    setQueryParams(prev => ({
      ...prev,
      search: '',
      status: undefined,
      operatorId: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      model: undefined,
      page: 0,
    }));
  }, []);

  const handleAddNewBus = () => {
    router.push('/mot/buses/add-new');
  };

  const handleImportBuses = () => {
    router.push('/mot/buses/import');
  };

  const handleExportAll = async () => {
    try {
      setIsLoading(true);
      
      // Get all buses for export
      const allBusesResponse = await BusManagementService.getAllBusesAsList();
      const buses = allBusesResponse || [];

      // Create CSV content
      const headers = ['Registration Number', 'Plate Number', 'Operator', 'Model', 'Capacity', 'Status', 'Created Date'];
      const csvContent = [
        headers.join(','),
        ...buses.map(bus => [
          `"${bus.ntcRegistrationNumber || ''}"`,
          `"${bus.plateNumber || ''}"`,
          `"${bus.operatorName || ''}"`,
          `"${bus.model || ''}"`,
          bus.capacity || 0,
          `"${bus.status || ''}"`,
          `"${bus.createdAt ? new Date(bus.createdAt).toLocaleDateString() : ''}"`,
        ].join(','))
      ].join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `buses-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export buses data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (busId: string) => {
    router.push(`/mot/buses/${busId}`);
  };

  const handleEdit = (busId: string) => {
    router.push(`/mot/buses/${busId}/edit`);
  };

  const handleAssignRoute = (busId: string, busRegistration: string) => {
    router.push(`/mot/buses/${busId}/assign-route`);
  };

  const handleDelete = (busId: string, busRegistration: string) => {
    const bus = buses.find(b => b.id === busId);
    if (bus) {
      setBusToDelete(bus);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBusToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!busToDelete?.id) return;
    
    try {
      setIsDeleting(true);
      await BusManagementService.deleteBus(busToDelete.id);
      setShowDeleteModal(false);
      setBusToDelete(null);
      
      // Reload data
      await Promise.all([
        loadBuses(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Failed to delete bus:', error);
      setError('Failed to delete bus');
    } finally {
      setIsDeleting(false);
    }
  };

  useSetPageActions(
    <BusActionButtons
      onAddBus={handleAddNewBus}
      onImportBuses={handleImportBuses}
      onExportAll={handleExportAll}
      isLoading={isLoading}
    />
  );

  if (isLoading && buses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <BusStatsCards stats={stats} />

        {/* Advanced Filters */}
        <BusAdvancedFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          operatorFilter={operatorFilter}
          setOperatorFilter={setOperatorFilter}
          minCapacity={minCapacity}
          setMinCapacity={setMinCapacity}
          maxCapacity={maxCapacity}
          setMaxCapacity={setMaxCapacity}
          modelFilter={modelFilter}
          setModelFilter={setModelFilter}
          filterOptions={filterOptions}
          loading={filterOptionsLoading}
          totalCount={pagination.totalElements}
          filteredCount={pagination.totalElements}
          onClearAll={handleClearAllFilters}
          onSearch={handleSearch}
        />


        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        {/* Buses Table */}
        <BusesTable
          buses={buses}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAssignRoute={handleAssignRoute}
          onSort={handleSort}
          activeFilters={{
            search: searchTerm,
            status: statusFilter !== 'all',
            operator: operatorFilter !== 'all',
            capacity: minCapacity || maxCapacity,
            model: modelFilter !== 'all'
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      

      {/* Delete Modal */}
      {showDeleteModal && busToDelete && (
        <DeleteBusModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          bus={busToDelete}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}