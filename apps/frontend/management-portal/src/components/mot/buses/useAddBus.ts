import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  BusManagementService,
  BusRequest,
  OperatorManagementService,
  OperatorResponse,
} from '@busmate/api-client-route';

export function useAddBus() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Bus',
    description: 'Register a new bus in the fleet management system',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses', href: '/mot/buses' }, { label: 'Add New' }],
  });

  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);

  const clearError = useCallback(() => setError(null), []);

  const loadOperators = useCallback(async () => {
    try {
      setOperatorsLoading(true);
      const operatorsList = await OperatorManagementService.getAllOperatorsAsList();
      setOperators(operatorsList || []);
    } catch (err) {
      console.error('Error loading operators:', err);
      setError('Failed to load operators list. Please try again.');
    } finally {
      setOperatorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  const handleSubmit = async (busData: BusRequest): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await BusManagementService.createBus(busData);
      router.push(response.id ? `/mot/buses/${response.id}` : '/mot/buses');
    } catch (err) {
      console.error('Error creating bus:', err);
      setError(err instanceof Error ? err.message : 'Failed to create bus. Please try again.');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
    }
  }, [router]);

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

  return { operators, operatorsLoading, isSubmitting, error, clearError, handleSubmit, handleCancel };
}
