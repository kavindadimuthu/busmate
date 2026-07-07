import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import {
  BusManagementService,
  BusResponse,
  OperatorManagementService,
  OperatorResponse,
  TripManagementService,
  TripResponse,
} from '@busmate/api-client-route';

export function useBusDetails() {
  const router = useRouter();
  const params = useParams();
  const busId = params.busId as string;

  // State
  const [bus, setBus] = useState<BusResponse | null>(null);
  const [operator, setOperator] = useState<OperatorResponse | null>(null);
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  useSetPageMetadata({
    title: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details',
    description: 'Detailed view of bus information and related data',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Buses', href: '/mot/buses' },
      { label: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details' },
    ],
  });

  // Load bus details
  const loadBusDetails = useCallback(async () => {
    if (!busId) return;

    try {
      setIsLoading(true);
      setError(null);

      const busData = await BusManagementService.getBusById(busId);
      setBus(busData);

      if (busData.operatorId) {
        try {
          const operatorData = await OperatorManagementService.getOperatorById(busData.operatorId);
          setOperator(operatorData);
        } catch (operatorErr) {
          console.warn('Could not load operator details:', operatorErr);
        }
      }
    } catch (err) {
      console.error('Error loading bus details:', err);
      setError('Failed to load bus details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [busId]);

  // Load bus trips
  const loadBusTrips = useCallback(async () => {
    if (!busId) return;

    try {
      setTripsLoading(true);
      const tripsData = await TripManagementService.getTripsByBus(busId);
      setTrips(tripsData || []);
    } catch (err) {
      console.error('Error loading bus trips:', err);
    } finally {
      setTripsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    loadBusDetails();
    loadBusTrips();
  }, [loadBusDetails, loadBusTrips]);

  // Handlers
  const handleEdit = useCallback(() => {
    router.push(`/mot/buses/${busId}/edit`);
  }, [router, busId]);

  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!bus?.id) return;

    try {
      setIsDeleting(true);
      await BusManagementService.deleteBus(bus.id);
      router.push('/mot/buses');
    } catch (error) {
      console.error('Error deleting bus:', error);
      setError('Failed to delete bus. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [bus?.id, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loadBusDetails(), loadBusTrips()]);
  }, [loadBusDetails, loadBusTrips]);

  const handleViewOperator = useCallback(() => {
    if (operator?.id) {
      router.push(`/mot/operators/${operator.id}`);
    }
  }, [operator?.id, router]);

  // Page actions
  useSetPageActions(
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(
        'button',
        {
          onClick: handleEdit,
          className: 'flex items-center gap-2 px-4 py-2 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors',
        },
        React.createElement(Edit, { className: 'w-4 h-4 mr-2' }),
        'Edit Bus'
      ),
      React.createElement(
        'button',
        {
          onClick: handleDelete,
          className: 'flex items-center gap-2 px-4 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors',
        },
        React.createElement(Trash2, { className: 'w-4 h-4' }),
        'Delete'
      )
    )
  );

  return {
    bus,
    operator,
    trips,
    isLoading,
    tripsLoading,
    error,
    clearError,
    showDeleteModal,
    isDeleting,
    handleBack,
    handleRefresh,
    handleViewOperator,
    handleDeleteCancel,
    handleDeleteConfirm,
    busId,
  };
}
