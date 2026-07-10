'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { StopResponse, BusStopManagementService } from '@busmate/api-client-route';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';

interface UseBusStopDetailsParams {
  params: Promise<{ busStopId: string }> | { busStopId: string };
}

export function useBusStopDetails({ params }: UseBusStopDetailsParams) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [busStopId, setBusStopId] = useState<string>('');
  const [busStop, setBusStop] = useState<StopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeLanguageTab, setActiveLanguageTab] = useState<'english' | 'sinhala' | 'tamil'>('english');

  const { toast } = useToast();

  // Resolve params asynchronously
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.busStopId || searchParams.get('id') || '';

      if (id === 'add') {
        router.replace('/mot/stops/create');
        return;
      }

      setBusStopId(id);
    };

    resolveParams();
  }, [params, searchParams, router]);

  // Page metadata
  useSetPageMetadata({
    title: `${busStop?.name || 'Bus Stop'} - Details`,
    description: 'View detailed information about this bus stop',
    activeItem: 'stops',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Bus Stops', href: '/mot/stops' },
      { label: busStop?.name || 'Bus Stop Details' },
    ],
  });

  // Load bus stop details
  const loadBusStopDetails = useCallback(async () => {
    if (!busStopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await BusStopManagementService.getStopById(busStopId);
      if (data) {
        setBusStop(data);
      } else {
        setError('Bus stop not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load bus stop details');
    } finally {
      setLoading(false);
    }
  }, [busStopId]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!busStop?.id) return;

    setIsDeleting(true);
    try {
      await BusStopManagementService.deleteStop(busStop.id);
      toast({
        title: 'Bus Stop Deleted',
        description: `${busStop.name} has been deleted successfully.`,
      });
      setShowDeleteModal(false);
      setTimeout(() => {
        router.push('/mot/stops');
      }, 300);
    } catch (err) {
      console.error('Failed to delete bus stop:', err);
      const errorMessage = 'Failed to delete bus stop';
      setError(errorMessage);
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [busStop, router, toast]);

  // Page actions
  useSetPageActions(
    busStop
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'button',
            {
              onClick: () => router.push('/mot/stops'),
              className: 'flex items-center text-muted-foreground hover:text-foreground transition-colors',
            },
            React.createElement(ArrowLeft, { className: 'w-5 h-5 mr-2' }),
            'Back to Bus Stops'
          ),
          React.createElement(
            'button',
            {
              onClick: () => router.push(`/mot/stops/${busStop.id}/edit`),
              className: 'flex items-center bg-primary hover:bg-primary text-white px-4 py-2 rounded-lg transition-colors',
            },
            React.createElement(Edit, { className: 'w-4 h-4 mr-2' }),
            'Edit'
          ),
          React.createElement(
            'button',
            {
              onClick: handleDeleteClick,
              className: 'flex items-center bg-destructive hover:bg-destructive text-white px-4 py-2 rounded-lg transition-colors',
            },
            React.createElement(Trash2, { className: 'w-4 h-4 mr-2' }),
            'Delete'
          )
        )
      : null
  );

  // Open in Google Maps
  const openInMaps = useCallback(() => {
    if (busStop?.location?.latitude && busStop?.location?.longitude) {
      const url = `https://www.google.com/maps?q=${busStop.location.latitude},${busStop.location.longitude}`;
      window.open(url, '_blank');
    }
  }, [busStop]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load data when busStopId is available
  useEffect(() => {
    if (busStopId) {
      loadBusStopDetails();
    }
  }, [busStopId, loadBusStopDetails]);

  const hasCoordinates = !!(busStop?.location?.latitude && busStop?.location?.longitude);

  return {
    busStop,
    loading,
    error,
    isDeleting,
    copiedField,
    showDeleteModal,
    activeLanguageTab,
    hasCoordinates,
    setActiveLanguageTab,
    loadBusStopDetails,
    copyToClipboard,
    handleDeleteCancel,
    handleDeleteConfirm,
    openInMaps,
    formatDate,
    router,
  };
}
