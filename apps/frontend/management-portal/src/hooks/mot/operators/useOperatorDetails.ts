import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Plus, Trash2, Ban } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  OperatorManagementService,
  BusOperatorOperationsService,
  BusResponse,
  PassengerServicePermitResponse,
} from '@busmate/api-client-core';
import { UsersControllerService } from '@busmate/api-client-user';
import type { UserResponse } from '@busmate/api-client-user';
import type { OperatorResponseWithLink } from '@/types/operator';

/** UserResponse plus operatorSyncStatus — see the comment on OperatorResponseWithLink. */
type LinkedAccount = UserResponse & { operatorSyncStatus?: string | null };

export function useOperatorDetails() {
  const router = useRouter();
  const params = useParams();
  const operatorId = params.operatorId as string;

  // State
  const [operator, setOperator] = useState<OperatorResponseWithLink | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<LinkedAccount | null>(null);
  const [buses, setBuses] = useState<BusResponse[]>([]);
  const [permits, setPermits] = useState<PassengerServicePermitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busesLoading, setBusesLoading] = useState(false);
  const [permitsLoading, setPermitsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete/deactivate modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  // Load operator details
  const loadOperatorDetails = useCallback(async () => {
    if (!operatorId) return;

    try {
      setIsLoading(true);
      setError(null);

      const operatorData: OperatorResponseWithLink = await OperatorManagementService.getOperatorById(operatorId);
      setOperator(operatorData);

      if (operatorData.userId) {
        try {
          const account = (await UsersControllerService.getUser(operatorData.userId)) as LinkedAccount;
          setLinkedAccount(account);
        } catch (err) {
          console.error('Error loading linked account:', err);
          setLinkedAccount(null);
        }
      } else {
        setLinkedAccount(null);
      }
    } catch (err) {
      console.error('Error loading operator details:', err);
      setError('Failed to load operator details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [operatorId]);

  // Load operator buses — via the operator-scoped endpoint (BusOperatorOperationsService),
  // not the generic filtered bus list. That generic endpoint's sortBy needs a raw JPA
  // property name (e.g. "ntcRegistrationNumber"); this hook used to pass the snake_case
  // "ntc_registration_number", which core-service's sortBy allowlist check rejects with a
  // 400 — silently swallowed here, leaving the fleet tab looking permanently empty. The
  // operator-scoped endpoint sidesteps that entirely and is the more correct fetch anyway.
  const loadOperatorBuses = useCallback(async () => {
    if (!operatorId) return;

    try {
      setBusesLoading(true);
      const busesResponse = await BusOperatorOperationsService.getOperatorBuses(operatorId, 0, 100);
      setBuses(busesResponse.content || []);
    } catch (err) {
      console.error('Error loading operator buses:', err);
    } finally {
      setBusesLoading(false);
    }
  }, [operatorId]);

  // Load operator permits — same operator-scoped endpoint family as buses.
  const loadOperatorPermits = useCallback(async () => {
    if (!operatorId) return;

    try {
      setPermitsLoading(true);
      const permitsResponse = await BusOperatorOperationsService.getOperatorPermits(operatorId, 0, 100);
      setPermits(permitsResponse.content || []);
    } catch (err) {
      console.error('Error loading operator permits:', err);
    } finally {
      setPermitsLoading(false);
    }
  }, [operatorId]);

  useEffect(() => {
    loadOperatorDetails();
    loadOperatorBuses();
    loadOperatorPermits();
  }, [loadOperatorDetails, loadOperatorBuses, loadOperatorPermits]);

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

  // Linked operators go through user-service's deactivate endpoint (the unified lifecycle's
  // source of truth, which syncs the status back to core-service automatically); only legacy
  // operators with no linked account still get a real hard delete. See useOperators.ts for
  // the same branching on the list page.
  const handleDeleteConfirm = useCallback(async () => {
    if (!operator?.id) return;

    try {
      setIsDeleting(true);
      if (operator.userId) {
        await UsersControllerService.deleteUser(operator.userId);
      } else {
        await OperatorManagementService.deleteOperator(operator.id);
      }
      router.push('/mot/operators');
    } catch (error) {
      console.error('Error deleting operator:', error);
      setError(`Failed to ${operator.userId ? 'deactivate' : 'delete'} operator. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  }, [operator?.id, operator?.userId, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadOperatorDetails(), loadOperatorBuses(), loadOperatorPermits()]);
  }, [loadOperatorDetails, loadOperatorBuses, loadOperatorPermits]);

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

  // Page actions — linked operators (operator.userId set) have their name/type/region/status
  // owned by the user account, so there's nothing left to "Edit" here (see OperatorForm's
  // locked-notice branch), and "Delete" becomes "Deactivate" (routed through user-service).
  const isLinked = !!operator?.userId;
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
      !isLinked &&
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
        React.createElement(isLinked ? Ban : Trash2, { className: 'w-4 h-4' }),
        isLinked ? 'Deactivate' : 'Delete'
      )
    )
  );

  return {
    operator,
    linkedAccount,
    buses,
    permits,
    isLoading,
    busesLoading,
    permitsLoading,
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
