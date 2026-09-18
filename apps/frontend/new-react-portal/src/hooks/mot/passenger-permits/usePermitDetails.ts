import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from '@/lib/router';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitDetailsActions } from '@/components/mot/passenger-permits/PermitDetailsActions';
import {
  PermitManagementService,
  OperatorManagementService,
  RouteManagementService,
  BusManagementService,
} from '@busmate/api-client-core';
import { apiErrorMessage } from '@/lib/api/errors';
import type {
  BusPassengerServicePermitAssignmentResponse,
  PassengerServicePermitResponse,
  OperatorResponse,
  RouteGroupResponse,
  BusResponse,
} from '@busmate/api-client-core';

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

  // INC-017: the buses this permit actually authorises, and MOT status actions
  const [links, setLinks] = useState<BusPassengerServicePermitAssignmentResponse[]>([]);
  const [statusDialog, setStatusDialog] = useState<'suspend' | 'withdraw' | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
      const [data, permitLinks] = await Promise.all([
        PermitManagementService.getPermitById(permitId),
        PermitManagementService.getPermitBuses(permitId),
      ]);
      setPermit(data);
      setLinks(permitLinks);
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
        0, 100, 'ntcRegistrationNumber', 'asc', undefined, operatorId, 'active'
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
    router.push(`/mot/passenger-permits/${permitId}/edit`);
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
      router.push('/mot/passenger-permits');
    } catch (err) {
      console.error('Error deleting permit:', err);
      setShowDeleteModal(false);
      setError(apiErrorMessage(err, 'Failed to delete permit'));
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

  const runAction = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      await loadPermitDetails();
      setStatusDialog(null);
    } catch (err) {
      setActionError(apiErrorMessage(err, fallback));
    } finally {
      setActionBusy(false);
    }
  }, [loadPermitDetails]);

  const suspend = useCallback((reason: string) =>
    runAction(() => PermitManagementService.suspendPermit(permitId, { reason }), 'Could not suspend the permit'), [runAction, permitId]);
  const withdraw = useCallback((reason: string) =>
    runAction(() => PermitManagementService.withdrawPermit(permitId, { reason }), 'Could not withdraw the permit'), [runAction, permitId]);
  const reinstate = useCallback(() =>
    runAction(() => PermitManagementService.reinstatePermit(permitId), 'Could not reinstate the permit'), [runAction, permitId]);
  const endLink = useCallback((link: BusPassengerServicePermitAssignmentResponse) =>
    link.id ? runAction(() => PermitManagementService.endPermitBusLink(permitId, link.id!), 'Could not end the link') : Promise.resolve(),
    [runAction, permitId]);

  // ── Page metadata & actions ───────────────────────────────

  useSetPageMetadata({
    title: permit?.permitNumber || 'Permit Details',
    description: 'Detailed view of permit information',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Permits', href: '/mot/passenger-permits' },
      { label: permit?.permitNumber || 'Permit Details' },
    ],
  });

  useSetPageActions(
    React.createElement(PermitDetailsActions, {
      onBack: handleBack,
      onRefresh: handleRefresh,
      onEdit: handleEdit,
      onDelete: handleDelete,
      status: permit?.status,
      onSuspend: () => setStatusDialog('suspend'),
      onWithdraw: () => setStatusDialog('withdraw'),
      onReinstate: reinstate,
    })
  );

  return {
    links,
    statusDialog,
    setStatusDialog,
    actionBusy,
    actionError,
    setActionError,
    suspend,
    withdraw,
    endLink,
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
