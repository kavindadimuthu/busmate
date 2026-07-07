import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  OperatorManagementService,
  BusManagementService,
  OperatorResponse,
  BusResponse,
} from '@busmate/api-client-route';

export function useOperatorDetails() {
  const router = useRouter();
  const params = useParams();
  const operatorId = params.operatorId as string;

  // State
  const [operator, setOperator] = useState<OperatorResponse | null>(null);
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busesLoading, setBusesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  // Load operator details
  const loadOperatorDetails = useCallback(async () => {
    if (!operatorId) return;

    try {
      setIsLoading(true);
      setError(null);

      const operatorData = await OperatorManagementService.getOperatorById(operatorId);
      setOperator(operatorData);
    } catch (err) {
      console.error('Error loading operator details:', err);
      setError('Failed to load operator details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [operatorId]);

  // Load operator buses
  const loadOperatorBuses = useCallback(async () => {
    if (!operatorId) return;

    try {
      setBusesLoading(true);

      const busesResponse = await BusManagementService.getAllBuses(
        0,
        100,
        'ntc_registration_number',
        'asc',
        undefined,
        operatorId,
        undefined,
        undefined,
        undefined
      );

      setBuses(busesResponse.content || []);
    } catch (err) {
      console.error('Error loading operator buses:', err);
    } finally {
      setBusesLoading(false);
    }
  }, [operatorId]);

  useEffect(() => {
    loadOperatorDetails();
    loadOperatorBuses();
  }, [loadOperatorDetails, loadOperatorBuses]);

  // Handlers
  const handleEdit = useCallback(() => {
    router.push(`/mot/operators/${operatorId}/edit`);
  }, [router, operatorId]);

  const handleAddBus = useCallback(() => {
    router.push(`/mot/buses/create?operatorId=${operatorId}`);
  }, [router, operatorId]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!operator?.id) return;

    try {
      setIsDeleting(true);
      await OperatorManagementService.deleteOperator(operator.id);
      router.push('/mot/operators');
    } catch (error) {
      console.error('Error deleting operator:', error);
      setError('Failed to delete operator. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [operator?.id, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadOperatorDetails(), loadOperatorBuses()]);
  }, [loadOperatorDetails, loadOperatorBuses]);

  // Page metadata
  useSetPageMetadata({
    title: operator?.name || 'Operator Details',
    description: 'Detailed view of operator information',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Operators', href: '/mot/operators' },
      { label: operator?.name || 'Operator Details' },
    ],
  });

  // Page actions
  useSetPageActions(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'button',
        {
          onClick: handleBack,
          className: 'flex items-center gap-2 px-3 py-1.5 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium',
        },
        React.createElement(ArrowLeft, { className: 'w-4 h-4' }),
        'Back'
      ),
      React.createElement(
        'button',
        {
          onClick: handleEdit,
          className: 'flex items-center gap-2 px-3 py-1.5 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium',
        },
        React.createElement(Edit, { className: 'w-4 h-4' }),
        'Edit'
      ),
      React.createElement(
        'button',
        {
          onClick: handleAddBus,
          className: 'flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium',
        },
        React.createElement(Plus, { className: 'w-4 h-4' }),
        'Add Bus'
      ),
      React.createElement(
        'button',
        {
          onClick: handleDelete,
          className: 'flex items-center gap-2 px-3 py-1.5 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors text-sm font-medium',
        },
        React.createElement(Trash2, { className: 'w-4 h-4' }),
        'Delete'
      )
    )
  );

  return {
    operator,
    buses,
    isLoading,
    busesLoading,
    error,
    clearError,
    showDeleteModal,
    isDeleting,
    handleBack,
    handleRefresh,
    handleDeleteCancel,
    handleDeleteConfirm,
  };
}
