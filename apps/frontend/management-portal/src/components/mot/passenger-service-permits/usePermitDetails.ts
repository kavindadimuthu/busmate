import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitDetailsActions } from '@/components/mot/passenger-service-permits/PermitDetailsActions';
import {
  PermitManagementService,
  OperatorManagementService,
  RouteManagementService,
  BusManagementService,
} from '@busmate/api-client-route';
import type {
  PassengerServicePermitResponse,
  OperatorResponse,
  RouteGroupResponse,
  BusResponse,
} from '@busmate/api-client-route';

export function usePermitDetails() {
  const router = useRouter();
  const params = useParams();
  const permitId = params.permitId as string;

  // State
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [operator, setOperator] = useState<OperatorResponse | null>(null);
  const [routeGroup, setRouteGroup] = useState<RouteGroupResponse | null>(null);
  const [assignedBuses, setAssignedBuses] = useState<BusResponse[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [routeGroupLoading, setRouteGroupLoading] = useState(false);
  const [busesLoading, setBusesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  // ── Data loading ──────────────────────────────────────────

  const loadPermitDetails = useCallback(async () => {
    if (!permitId) return null;
    try {
      setIsLoading(true);
      setError(null);
      const data = await PermitManagementService.getPermitById(permitId);
      setPermit(data);
      return data;
    } catch (err) {
      console.error('Error loading permit details:', err);
      setError('Failed to load permit details. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [permitId]);

  const loadOperatorDetails = useCallback(async (operatorId: string) => {
    try {
      setOperatorLoading(true);
      const data = await OperatorManagementService.getOperatorById(operatorId);
      setOperator(data);
    } catch (err) {
      console.error('Error loading operator details:', err);
    } finally {
      setOperatorLoading(false);
    }
  }, []);

  const loadRouteGroupDetails = useCallback(async (routeGroupId: string) => {
    try {
      setRouteGroupLoading(true);
      const data = await RouteManagementService.getRouteGroupById(routeGroupId);
      setRouteGroup(data);
    } catch (err) {
      console.error('Error loading route group details:', err);
    } finally {
      setRouteGroupLoading(false);
    }
  }, []);

  const loadAssignedBuses = useCallback(async (operatorId: string) => {
    try {
      setBusesLoading(true);
      const busesResponse = await BusManagementService.getAllBuses(
        0, 100, 'ntc_registration_number', 'asc', undefined, operatorId, 'active'
      );
      setAssignedBuses(busesResponse.content || []);
    } catch (err) {
      console.error('Error loading assigned buses:', err);
    } finally {
      setBusesLoading(false);
    }
  }, []);

  // Load related data when permit changes
  useEffect(() => {
    if (permit) {
      if (permit.operatorId) {
        loadOperatorDetails(permit.operatorId);
        loadAssignedBuses(permit.operatorId);
      }
      if (permit.routeGroupId) {
        loadRouteGroupDetails(permit.routeGroupId);
      }
    }
  }, [permit, loadOperatorDetails, loadRouteGroupDetails, loadAssignedBuses]);

  // Initial load
  useEffect(() => {
    loadPermitDetails();
  }, [loadPermitDetails]);

  // ── Handlers ──────────────────────────────────────────────

  const handleEdit = useCallback(() => {
    router.push(`/mot/passenger-service-permits/${permitId}/edit`);
  }, [router, permitId]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!permit?.id) return;
    try {
      setIsDeleting(true);
      await PermitManagementService.deletePermit(permit.id);
      router.push('/mot/passenger-service-permits');
    } catch (err) {
      console.error('Error deleting permit:', err);
      setError('Failed to delete permit. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [permit, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(async () => {
    const permitData = await loadPermitDetails();
    if (permitData) {
      if (permitData.operatorId) {
        await Promise.all([
          loadOperatorDetails(permitData.operatorId),
          loadAssignedBuses(permitData.operatorId),
        ]);
      }
      if (permitData.routeGroupId) {
        await loadRouteGroupDetails(permitData.routeGroupId);
      }
    }
  }, [loadPermitDetails, loadOperatorDetails, loadAssignedBuses, loadRouteGroupDetails]);

  // ── Page metadata & actions ───────────────────────────────

  useSetPageMetadata({
    title: permit?.permitNumber || 'Permit Details',
    description: 'Detailed view of permit information',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Permits', href: '/mot/passenger-service-permits' },
      { label: permit?.permitNumber || 'Permit Details' },
    ],
  });

  useSetPageActions(
    React.createElement(PermitDetailsActions, {
      onBack: handleBack,
      onRefresh: handleRefresh,
      onEdit: handleEdit,
      onDelete: handleDelete,
    })
  );

  return {
    permit,
    operator,
    routeGroup,
    assignedBuses,
    isLoading,
    operatorLoading,
    routeGroupLoading,
    busesLoading,
    error,
    clearError,
    showDeleteModal,
    isDeleting,
    handleRefresh,
    handleBack,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
}
