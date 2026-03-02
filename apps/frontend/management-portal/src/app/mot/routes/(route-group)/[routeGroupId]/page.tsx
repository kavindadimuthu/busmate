'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, RefreshCw, Route as RouteIcon } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  RouteGroupDetailsSection,
  RouteSelector,
  RouteGroupActionButtons,
  RouteTabs,
  RouteTabsEmpty,
} from '@/components/mot/routes/route-group-view';
import DeleteRouteConfirmation from '@/components/mot/routes/DeleteRouteConfirmation';
import { RouteManagementService } from '../../../../../../generated/api-clients/route-management';
import type {
  RouteGroupResponse,
  RouteResponse,
} from '../../../../../../generated/api-clients/route-management';

// ── Component ─────────────────────────────────────────────────────

export default function RouteGroupViewPage() {
  const router = useRouter();
  const params = useParams();
  const routeGroupId = params.routeGroupId as string;

  // State
  const [routeGroup, setRouteGroup] = useState<RouteGroupResponse | null>(null);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Selected route
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || null,
    [routes, selectedRouteId]
  );

  // Page metadata
  useSetPageMetadata({
    title: routeGroup?.name || 'Route Group Details',
    description: routeGroup?.description || 'View route group details, routes, stops, and schedules',
    activeItem: 'routes',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Routes', href: '/mot/routes' },
      { label: routeGroup?.name || 'Route Group' },
    ],
  });

  // Fetch route group details
  const loadRouteGroupDetails = useCallback(async () => {
    if (!routeGroupId) return;

    try {
      setIsLoading(true);
      setError(null);

      const routeGroupData = await RouteManagementService.getRouteGroupById(routeGroupId);
      setRouteGroup(routeGroupData);

      const routesList = routeGroupData.routes || [];
      setRoutes(routesList);

      // Auto-select first route
      if (routesList.length > 0 && !selectedRouteId) {
        setSelectedRouteId(routesList[0].id || null);
      }
    } catch (err) {
      console.error('Error loading route group details:', err);
      setError('Failed to load route group details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [routeGroupId, selectedRouteId]);

  useEffect(() => {
    loadRouteGroupDetails();
  }, [loadRouteGroupDetails]);

  // Handlers
  const handleEdit = () => {
    router.push(`/mot/routes/${routeGroupId}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (!routeGroup?.id) return;

    try {
      setIsDeleting(true);
      await RouteManagementService.deleteRouteGroup(routeGroup.id);
      router.push('/mot/routes');
    } catch (err) {
      console.error('Error deleting route group:', err);
      setError('Failed to delete route group. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectRoute = (routeId: string | null) => {
    setSelectedRouteId(routeId);
  };

  // Set page actions
  useSetPageActions(
    <RouteGroupActionButtons
      onEdit={handleEdit}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
          <div className="h-2 bg-gray-200" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Route selector skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-16 flex-1 bg-gray-100 rounded-lg" />
            <div className="h-16 flex-1 bg-gray-100 rounded-lg" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="flex gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-100 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-50 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !routeGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {error || 'Route group not found'}
        </h3>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          We couldn&apos;t load the route group details. This might be due to a network issue or the route group may have been deleted.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRouteGroupDetails}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => router.push('/mot/routes')}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Routes
          </button>
        </div>
      </div>
    );
  }

  // No routes state
  if (routes.length === 0) {
    return (
      <div className="space-y-6">
        {/* Route group details section */}
        <RouteGroupDetailsSection routeGroup={routeGroup} />

        {/* Empty routes message */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <RouteIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Routes Defined</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              This route group doesn&apos;t have any routes yet. Add outbound and inbound routes to complete the route group.
            </p>
            <button
              onClick={() => router.push(`/mot/routes/${routeGroupId}/edit`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RouteIcon className="w-4 h-4" />
              Add Routes
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        <DeleteRouteConfirmation
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          routeGroup={routeGroup}
          isDeleting={isDeleting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Route group details section */}
      <RouteGroupDetailsSection routeGroup={routeGroup} />

      {/* Route selector tabs */}
      <RouteSelector
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={handleSelectRoute}
      />

      {/* Route tabs */}
      {selectedRoute ? (
        <RouteTabs route={selectedRoute} />
      ) : (
        <RouteTabsEmpty />
      )}

      {/* Delete confirmation modal */}
      <DeleteRouteConfirmation
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        routeGroup={routeGroup}
        isDeleting={isDeleting}
      />
    </div>
  );
}