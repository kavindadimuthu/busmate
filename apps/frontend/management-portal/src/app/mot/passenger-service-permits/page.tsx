'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitStatsCards } from '@/components/mot/permits/PermitStatsCards';
import { PermitAdvancedFilters } from '@/components/mot/permits/PermitAdvancedFilters';
import { PermitActionButtons } from '@/components/mot/permits/PermitActionButtons';
import { PermitsTable } from '@/components/mot/permits/PermitsTable';
import { DataPagination } from '@/components/shared/DataPagination';
import { 
  PermitManagementService,
  PassengerServicePermitResponse 
} from '../../../../generated/api-clients/route-management';
import { DeletePermitModal } from '@/components/mot/passenger-service-permits/DeletePermitModal';

interface PermitFilters {
  search: string;
  status: string;
  operatorId: string;
  routeGroupId: string;
  permitType: string;
  expiryWithin?: number; // days
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

function PassengerServicePermitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useSetPageMetadata({
    title: 'Passenger Service Permits Management',
    description: 'Manage and monitor passenger service permits for all operators',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits' }],
  });
  
  // Data states
  const [permits, setPermits] = useState<PassengerServicePermitResponse[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>({
    statuses: ['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED'],
    operators: [],
    routeGroups: [],
    permitTypes: []
  });
  
  // Filter states with URL sync
  const [filters, setFilters] = useState<PermitFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    operatorId: searchParams.get('operator') || 'all',
    routeGroupId: searchParams.get('routeGroup') || 'all',
    permitType: searchParams.get('permitType') || 'all',
    expiryWithin: searchParams.get('expiryWithin') ? parseInt(searchParams.get('expiryWithin')!) : undefined
  });
  
  // Pagination and sort states with URL sync
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: Math.max(0, parseInt(searchParams.get('page') || '1') - 1),
    totalPages: 0,
    totalElements: 0,
    pageSize: parseInt(searchParams.get('size') || '10')
  });
  
  const [sort, setSort] = useState<SortState>({
    field: searchParams.get('sortBy') || 'createdAt',
    direction: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc'
  });
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permitToDelete, setPermitToDelete] = useState<PassengerServicePermitResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.operatorId !== 'all') params.set('operator', filters.operatorId);
    if (filters.routeGroupId !== 'all') params.set('routeGroup', filters.routeGroupId);
    if (filters.permitType !== 'all') params.set('permitType', filters.permitType);
    if (filters.expiryWithin) params.set('expiryWithin', filters.expiryWithin.toString());
    if (pagination.currentPage > 0) params.set('page', (pagination.currentPage + 1).toString());
    if (pagination.pageSize !== 10) params.set('size', pagination.pageSize.toString());
    if (sort.field !== 'createdAt') params.set('sortBy', sort.field);
    if (sort.direction !== 'desc') params.set('sortDir', sort.direction);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters, pagination.currentPage, pagination.pageSize, sort]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await PermitManagementService.getPermitStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading statistics:', err);
      // Set default statistics if API fails
      setStatistics({
        totalPermits: 0,
        activePermits: 0,
        inactivePermits: 0,
        expiringSoonPermits: 0,
        permitsByOperator: {},
        permitsByRouteGroup: {}
      });
    }
  }, []);

  // Load filter options
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await PermitManagementService.getPermitFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error loading filter options:', err);
      // Set default filter options if API fails
      setFilterOptions({
        statuses: ['ACTIVE', 'INACTIVE', 'PENDING', 'EXPIRED'],
        operators: [],
        routeGroups: [],
        permitTypes: []
      });
    }
  }, []);

  // Load permits data from API with server-side filtering/pagination
  const loadPermits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare individual filter parameters for API call
      const statusFilter = filters.status !== 'all' ? filters.status : undefined;
      const permitTypeFilter = filters.permitType !== 'all' ? filters.permitType : undefined;
      
      // For operatorName and routeGroupName, we need to get the names from the filterOptions
      // based on the selected IDs
      let operatorNameFilter: string | undefined = undefined;
      let routeGroupNameFilter: string | undefined = undefined;
      
      if (filters.operatorId !== 'all' && filterOptions.operators?.length > 0) {
        const selectedOperator = filterOptions.operators.find((op: any) => op.id === filters.operatorId);
        operatorNameFilter = selectedOperator?.name;
      }
      
      if (filters.routeGroupId !== 'all' && filterOptions.routeGroups?.length > 0) {
        const selectedRouteGroup = filterOptions.routeGroups.find((rg: any) => rg.id === filters.routeGroupId);
        routeGroupNameFilter = selectedRouteGroup?.name;
      }
      
      // When there's a search term, fetch more data to enable client-side filtering
      const pageSize = filters.search ? Math.max(pagination.pageSize * 5, 100) : pagination.pageSize;
      const currentPage = filters.search ? 0 : pagination.currentPage;
      
      const response = await PermitManagementService.getPermits(
        currentPage, // Convert to 0-based for API
        pageSize,
        sort.field,
        sort.direction,
        statusFilter,
        permitTypeFilter,
        operatorNameFilter,
        routeGroupNameFilter
      );
      
      let permitsData = response.content || [];
      let filteredCount = response.totalElements || 0;
      
      // Apply client-side search filtering if search term exists
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        permitsData = permitsData.filter((permit: any) => 
          permit.permitNumber?.toLowerCase().includes(searchTerm) ||
          permit.operatorName?.toLowerCase().includes(searchTerm) ||
          permit.routeGroupName?.toLowerCase().includes(searchTerm) ||
          permit.permitType?.toLowerCase().includes(searchTerm)
        );
        filteredCount = permitsData.length;
        
        // Apply client-side pagination for search results
        const startIndex = pagination.currentPage * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        permitsData = permitsData.slice(startIndex, endIndex);
      }
      
      setPermits(permitsData);
      setPagination(prev => ({
        ...prev,
        totalPages: filters.search ? Math.ceil(filteredCount / pagination.pageSize) : (response.totalPages || 0),
        totalElements: filteredCount
      }));
      
    } catch (err) {
      console.error('Error loading permits:', err);
      // Set error message and empty data when API fails
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load permits. The API service may not be available.');
      }
      setPermits([]);
      setPagination(prev => ({
        ...prev,
        totalPages: 0,
        totalElements: 0
      }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.pageSize, sort, filterOptions]);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      // Load filter options first, then load permits
      await Promise.all([
        loadStatistics(),
        loadFilterOptions()
      ]);
      // Don't load permits here - let the effect handle it after filterOptions is set
    };
    
    initializeData();
  }, [loadStatistics, loadFilterOptions]);

  // Load permits when dependencies change, but only after filterOptions are loaded
  useEffect(() => {
    // Only load permits if we have filterOptions (or no filters requiring them are set)
    if (filterOptions.operators !== undefined || 
        (filters.operatorId === 'all' && filters.routeGroupId === 'all')) {
      loadPermits();
    }
  }, [loadPermits, filterOptions]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      loadStatistics(),
      loadFilterOptions(),
      loadPermits()
    ]);
  }, [loadStatistics, loadFilterOptions, loadPermits]);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: Partial<PermitFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination(prev => ({ ...prev, pageSize: size, currentPage: 0 }));
  }, []);

  // Sort handlers
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSort({ field, direction });
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  }, []);

  // Action handlers
  const handleView = useCallback((permitId: string) => {
    router.push(`/mot/passenger-service-permits/${permitId}`);
  }, [router]);

  const handleEdit = useCallback((permitId: string) => {
    router.push(`/mot/passenger-service-permits/${permitId}/edit`);
  }, [router]);

  const handleDelete = useCallback((permitId: string, permitNumber: string) => {
    const permit = permits.find(p => p.id === permitId);
    if (permit) {
      setPermitToDelete(permit);
      setShowDeleteModal(true);
    }
  }, [permits]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setPermitToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!permitToDelete?.id) return;

    try {
      setIsDeleting(true);
      await PermitManagementService.deletePermit(permitToDelete.id);
      await handleRefresh();
      setShowDeleteModal(false);
      setPermitToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete permit');
    } finally {
      setIsDeleting(false);
    }
  }, [permitToDelete, handleRefresh]);

  const handleAddNew = useCallback(() => {
    router.push('/mot/passenger-service-permits/add-new');
  }, [router]);

  const handleAssignBus = useCallback((permitId: string, permitNumber: string) => {
    // Navigate to assign bus page or open modal
    router.push(`/mot/passenger-service-permits/${permitId}/assign-bus`);
  }, [router]);

  // Export functionality
  const handleExport = useCallback(async () => {
    try {
      // Export current page data or make a separate API call for all filtered data
      const dataToExport = permits.map(permit => ({
        'Permit Number': permit.permitNumber || '',
        'Operator Name': permit.operatorName || '',
        'Route Group': permit.routeGroupName || '',
        'Permit Type': permit.permitType || '',
        'Issue Date': permit.issueDate || '',
        'Expiry Date': permit.expiryDate || '',
        'Maximum Buses': permit.maximumBusAssigned || 0,
        'Status': permit.status || '',
        'Created At': permit.createdAt ? new Date(permit.createdAt).toLocaleDateString() : '',
        'Updated At': permit.updatedAt ? new Date(permit.updatedAt).toLocaleDateString() : '',
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
      link.download = `passenger-service-permits-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [permits]);

  // Import functionality
  const handleImport = useCallback(() => {
    // Open import dialog or navigate to import page
    alert('Import functionality will be implemented');
  }, []);

  // Bulk operations
  const handleBulkDelete = useCallback((selectedIds: string[]) => {
    // Handle bulk delete
    alert(`Bulk delete ${selectedIds.length} permits`);
  }, []);

  const handleBulkStatusUpdate = useCallback((selectedIds: string[], newStatus: string) => {
    // Handle bulk status update
    alert(`Update ${selectedIds.length} permits to ${newStatus}`);
  }, []);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || 
           filters.status !== 'all' || 
           filters.operatorId !== 'all' ||
           filters.routeGroupId !== 'all' ||
           filters.permitType !== 'all' ||
           !!filters.expiryWithin;
  }, [filters]);

  const activeFiltersObject = useMemo(() => ({
    search: filters.search || undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
    operator: filters.operatorId !== 'all' ? filters.operatorId : undefined,
    routeGroup: filters.routeGroupId !== 'all' ? filters.routeGroupId : undefined,
    permitType: filters.permitType !== 'all' ? filters.permitType : undefined,
    expiryWithin: filters.expiryWithin
  }), [filters]);

  useSetPageActions(
    <PermitActionButtons
      onAddPermit={handleAddNew}
      onImportPermits={handleImport}
      onExportAll={handleExport}
      isLoading={loading}
    />
  );

  // Loading state for initial load
  if (loading && pagination.currentPage === 0 && permits.length === 0) {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
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

        {/* Stats Cards */}
        <PermitStatsCards stats={statistics} loading={!statistics} />

        {/* Advanced Filters */}
        <PermitAdvancedFilters
          searchTerm={filters.search}
          setSearchTerm={(value) => handleFilterChange({ search: value })}
          statusFilter={filters.status}
          setStatusFilter={(value) => handleFilterChange({ status: value })}
          operatorFilter={filters.operatorId}
          setOperatorFilter={(value) => handleFilterChange({ operatorId: value })}
          routeGroupFilter={filters.routeGroupId}
          setRouteGroupFilter={(value) => handleFilterChange({ routeGroupId: value })}
          permitTypeFilter={filters.permitType}
          setPermitTypeFilter={(value) => handleFilterChange({ permitType: value })}
          filterOptions={filterOptions}
          loading={loading}
          totalCount={pagination.totalElements}
          filteredCount={pagination.totalElements}
          onClearAll={() => {
            setFilters({
              search: '',
              status: 'all',
              operatorId: 'all',
              routeGroupId: 'all',
              permitType: 'all'
            });
            setPagination(prev => ({ ...prev, currentPage: 0 }));
          }}
        />

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <PermitsTable
            permits={permits}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAssignBus={handleAssignBus}
            onSort={handleSort}
            activeFilters={activeFiltersObject}
            loading={loading}
            currentSort={sort}
          />

          {/* Pagination */}
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            loading={loading}
          />
        </div>

        {/* Delete Permit Modal */}
        <DeletePermitModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          permit={permitToDelete}
          isDeleting={isDeleting}
        />
      </div>
  );
}

export default function PassengerServicePermitsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading permits...</span>
        </div>
      </div>
    }>
      <PassengerServicePermitsContent />
    </Suspense>
  );
}