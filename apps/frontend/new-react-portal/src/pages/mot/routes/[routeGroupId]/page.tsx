'use client';

import { AlertCircle } from 'lucide-react';
import {
  RouteGroupDetailsSection,
  RouteSelector,
  RouteTabs,
  RouteTabsEmpty,
  RouteGroupLoadingSkeleton,
  RouteGroupErrorState,
  RouteGroupEmptyRoutes,
} from '@/components/mot/routes/route-group-view';
import DeleteRouteConfirmation from '@/components/mot/routes/DeleteRouteConfirmation';
import { useRouteGroupDetails } from '@/hooks/mot/routes/useRouteGroupDetails';

export default function RouteGroupViewPage() {
  const {
    routeGroup, routes, selectedRoute, selectedRouteId,
    isLoading, error, clearError,
    showDeleteModal, isDeleting,
    loadRouteGroupDetails,
    handleSelectRoute, handleAddRoutes, handleBackToRoutes,
    handleDeleteCancel, handleDeleteConfirm,
  } = useRouteGroupDetails();

  if (isLoading) {
    return <RouteGroupLoadingSkeleton />;
  }

  if (error || !routeGroup) {
    return (
      <RouteGroupErrorState
        error={error}
        onRetry={loadRouteGroupDetails}
        onBack={handleBackToRoutes}
      />
    );
  }

  if (routes.length === 0) {
    return (
      <div className="space-y-6">
        <RouteGroupDetailsSection routeGroup={routeGroup} />
        <RouteGroupEmptyRoutes onAddRoutes={handleAddRoutes} />
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
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive/80" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-destructive/80 hover:text-destructive font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      <RouteGroupDetailsSection routeGroup={routeGroup} />

      <RouteSelector
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={handleSelectRoute}
      />

      {selectedRoute ? (
        <RouteTabs route={selectedRoute} />
      ) : (
        <RouteTabsEmpty />
      )}

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