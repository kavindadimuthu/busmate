import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  PermitManagementService,
  OperatorManagementService,
  RouteManagementService,
  PassengerServicePermitRequest,
  PassengerServicePermitResponse,
  OperatorResponse,
  RouteGroupResponse,
} from '@busmate/api-client-route';

export function useEditPermit() {
  const router = useRouter();
  const params = useParams();
  const permitId = params.permitId as string;

  // State
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);
  const [routeGroupsLoading, setRouteGroupsLoading] = useState(true);

  const clearError = useCallback(() => setError(null), []);

  useSetPageMetadata({
    title: `Edit ${permit?.permitNumber || 'Permit'}`,
    description: 'Update passenger service permit details',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Permits', href: '/mot/passenger-service-permits' },
      { label: permit?.permitNumber || 'Permit', href: '/mot/passenger-service-permits/' + permitId },
      { label: 'Edit' },
    ],
  });

  // Load permit details and form data
  const loadData = useCallback(async () => {
    if (!permitId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [permitData, operatorsList, routeGroupsList] = await Promise.all([
        PermitManagementService.getPermitById(permitId),
        OperatorManagementService.getAllOperatorsAsList(),
        RouteManagementService.getAllRouteGroupsAsList(),
      ]);

      setPermit(permitData);
      setOperators(operatorsList || []);
      setRouteGroups(routeGroupsList || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load permit details. Please try again.');
    } finally {
      setIsLoading(false);
      setOperatorsLoading(false);
      setRouteGroupsLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (permitData: PassengerServicePermitRequest): Promise<void> => {
      if (!permitId) return;

      try {
        setIsSubmitting(true);
        setError(null);

        await PermitManagementService.updatePermit(permitId, permitData);
        router.push(`/mot/passenger-service-permits/${permitId}`);
      } catch (err) {
        console.error('Error updating permit:', err);
        setError(err instanceof Error ? err.message : 'Failed to update permit. Please try again.');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [permitId, router]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/mot/passenger-service-permits/${permitId}`);
    }
  }, [router, permitId]);

  // Page actions
  useSetPageActions(
    React.createElement(
      'button',
      {
        onClick: handleCancel,
        className: 'flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors',
      },
      React.createElement(X, { className: 'w-4 h-4' }),
      'Cancel'
    )
  );

  return {
    permit,
    operators,
    routeGroups,
    isLoading,
    isSubmitting,
    error,
    clearError,
    operatorsLoading,
    routeGroupsLoading,
    handleSubmit,
    handleCancel,
    permitId,
  };
}
