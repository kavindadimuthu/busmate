'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { BusSummary } from '@/components/mot/buses/BusSummary';
import { BusTabsSection } from '@/components/mot/buses/BusTabsSection';
import DeleteBusModal from '@/components/mot/buses/DeleteBusModal';
import { 
  BusManagementService, 
  BusResponse,
  OperatorManagementService,
  OperatorResponse,
  TripManagementService,
  TripResponse
} from '../../../../../generated/api-clients/route-management';

export default function BusDetailsPage() {
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

  // Delete modal states - Updated
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useSetPageMetadata({
    title: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details',
    description: 'Detailed view of bus information and related data',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses', href: '/mot/buses' }, { label: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details' }],
  });

  useSetPageActions(
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`/mot/buses/${busId}/edit`)}
        className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit Bus
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );

  // Load bus details
  const loadBusDetails = useCallback(async () => {
    if (!busId) return;

    try {
      setIsLoading(true);
      setError(null);

      const busData = await BusManagementService.getBusById(busId);
      setBus(busData);

      // Load operator details if operatorId exists
      if (busData.operatorId) {
        try {
          const operatorData = await OperatorManagementService.getOperatorById(busData.operatorId);
          setOperator(operatorData);
        } catch (operatorErr) {
          console.warn('Could not load operator details:', operatorErr);
          // Don't set main error for operator loading failure
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
      // Don't set main error for trips loading failure
    } finally {
      setTripsLoading(false);
    }
  }, [busId]);

  useEffect(() => {
    loadBusDetails();
    loadBusTrips();
  }, [loadBusDetails, loadBusTrips]);

  // Handlers
  const handleEdit = () => {
    router.push(`/mot/buses/${busId}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (!bus?.id) return;

    try {
      setIsDeleting(true);
      await BusManagementService.deleteBus(bus.id);
      
      // Navigate back to buses list after successful deletion
      router.push('/mot/buses');
      
    } catch (error) {
      console.error('Error deleting bus:', error);
      setError('Failed to delete bus. Please try again.');
      // Keep modal open on error
    } finally {
      setIsDeleting(false);
      // Only close modal if deletion was successful (handled by navigation)
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = async () => {
    await Promise.all([loadBusDetails(), loadBusTrips()]);
  };

  const handleViewOperator = () => {
    if (operator?.id) {
      router.push(`/mot/operators/${operator.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !bus) {
    return (
        <div className="max-w-md mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Bus not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The bus you're looking for doesn't exist or there was an error loading the details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBack}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
            <button
              onClick={() => router.push('/mot/buses')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Buses
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-sm text-red-600 hover:text-red-800 underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bus Summary */}
        <BusSummary bus={bus} operator={operator} onViewOperator={handleViewOperator} />

        {/* Tabs Section */}
        <BusTabsSection 
          bus={bus} 
          operator={operator}
          trips={trips}
          tripsLoading={tripsLoading}
          onRefresh={handleRefresh}
        />

        {/* Delete Bus Modal */}
        <DeleteBusModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          bus={bus}
          isDeleting={isDeleting}
          tripCount={trips.length}
        />
      </div>
  );
}