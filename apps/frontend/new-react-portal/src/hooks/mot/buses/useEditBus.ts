import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  BusManagementService,
  BusRequest,
  BusResponse,
  OperatorManagementService,
  OperatorResponse,
} from '@busmate/api-client-route';

export function useEditBus() {
  const router = useRouter();
  const params = useParams();
  const busId = params.busId as string;

  const [bus, setBus] = useState<BusResponse | null>(null);
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);

  const clearError = useCallback(() => setError(null), []);

  useSetPageMetadata({
    title: `Edit ${bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus'}`,
    description: 'Update bus registration and operational details',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Buses', href: '/mot/buses' },
      { label: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details', href: '/mot/buses/' + busId },
      { label: 'Edit' },
    ],
  });

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/mot/buses/${busId}`);
    }
  }, [router, busId]);

  useSetPageActions(
    React.createElement(
      'button',
      {
        onClick: handleCancel,
        className:
          'flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors',
      },
      React.createElement(X, { className: 'w-4 h-4' }),
      'Cancel'
    )
  );

  const loadData = useCallback(async () => {
    if (!busId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [busData, operatorsList] = await Promise.all([
        BusManagementService.getBusById(busId),
        OperatorManagementService.getAllOperatorsAsList(),
      ]);

      setBus(busData);
      setOperators(operatorsList || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load bus details. Please try again.');
    } finally {
      setIsLoading(false);
      setOperatorsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (busData: BusRequest): Promise<void> => {
    if (!busId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await BusManagementService.updateBus(busId, busData);
      router.push(`/mot/buses/${busId}`);
    } catch (err) {
      console.error('Error updating bus:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bus. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = useCallback(() => router.back(), [router]);
  const goToBuses = useCallback(() => router.push('/mot/buses'), [router]);

  return {
    bus,
    busId,
    operators,
    operatorsLoading,
    isLoading,
    isSubmitting,
    error,
    clearError,
    handleSubmit,
    handleCancel,
    goBack,
    goToBuses,
  };
}
