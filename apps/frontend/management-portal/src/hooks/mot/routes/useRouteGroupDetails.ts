import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { RouteGroupActionButtons } from '@/components/mot/routes/route-group-view';
import { RouteManagementService } from '@busmate/api-client-route';
import type { RouteGroupResponse, RouteResponse } from '@busmate/api-client-route';

export function useRouteGroupDetails() {
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

  const clearError = useCallback(() => setError(null), []);

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
  const handleEdit = useCallback(() => {
    router.push(`/mot/routes/workspace?routeGroupId=${routeGroupId}`);
  }, [router, routeGroupId]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [routeGroup?.id, router]);

  const handleSelectRoute = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId);
  }, []);

  const handleAddRoutes = useCallback(() => {
    router.push(`/mot/routes/workspace?routeGroupId=${routeGroupId}`);
  }, [router, routeGroupId]);

  const handleBackToRoutes = useCallback(() => {
    router.push('/mot/routes');
  }, [router]);

  // Page actions
  useSetPageActions(
    React.createElement(RouteGroupActionButtons, {
      onEdit: handleEdit,
      onDelete: handleDelete,
      isDeleting,
    })
  );

  return {
    routeGroup,
    routes,
    selectedRoute,
    selectedRouteId,
    isLoading,
    error,
    clearError,
    showDeleteModal,
    isDeleting,
    loadRouteGroupDetails,
    handleSelectRoute,
    handleAddRoutes,
    handleBackToRoutes,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
}
