'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Trash2, 
  AlertCircle
} from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { OperatorSummary } from '@/components/operator/profile/OperatorSummary';
import { OperatorTabsSection } from '@/components/operator/profile/OperatorTabsSection';
import { 
  OperatorManagementService,
  BusManagementService,
  OperatorResponse, 
  BusResponse 
} from '../../../../../generated/api-clients/route-management';
import DeleteOperatorModal from '@/components/mot/users/operator/DeleteOperatorModal';

export default function OperatorDetailsPage() {
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
      
      // Fetch buses filtered by operator ID
      const busesResponse = await BusManagementService.getAllBuses(
        0, // page
        100, // size - get all buses for this operator
        'ntc_registration_number', // sortBy
        'asc', // sortDir
        undefined, // search
        operatorId, // operatorId filter
        undefined, // status
        undefined, // minCapacity
        undefined  // maxCapacity
      );
      
      setBuses(busesResponse.content || []);

    } catch (err) {
      console.error('Error loading operator buses:', err);
      // Don't set main error for buses loading failure
    } finally {
      setBusesLoading(false);
    }
  }, [operatorId]);

  useEffect(() => {
    loadOperatorDetails();
    loadOperatorBuses();
  }, [loadOperatorDetails, loadOperatorBuses]);

  // Handlers
  const handleEdit = () => {
    router.push(`/mot/operators/${operatorId}/edit`);
  };

  const handleAddBus = () => {
    router.push(`/mot/buses/add-new?operatorId=${operatorId}`);
  };

  // Delete modal handlers - Updated
  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (!operator?.id) return;

    try {
      setIsDeleting(true);
      await OperatorManagementService.deleteOperator(operator.id);
      
      // Navigate back to operators list after successful deletion
      router.push('/mot/operators');
      
    } catch (error) {
      console.error('Error deleting operator:', error);
      setError('Failed to delete operator. Please try again.');
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
    await Promise.all([
      loadOperatorDetails(),
      loadOperatorBuses()
    ]);
  };

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

  useSetPageActions(
    <>
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <button
        onClick={handleEdit}
        className="flex items-center gap-2 px-3 py-1.5 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
      >
        <Edit className="w-4 h-4" />
        Edit
      </button>
      <button
        onClick={handleAddBus}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Bus
      </button>
      <button
        onClick={handleDelete}
        className="flex items-center gap-2 px-3 py-1.5 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </>
  );

  // Loading state
  if (isLoading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading operator details...</p>
          </div>
        </div>
    );
  }

  // Error state
  if (error || !operator) {
    return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-red-600 text-lg mb-4">
            {error || 'Operator not found'}
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
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

        {/* Operator Summary Card */}
        <OperatorSummary operator={operator} buses={buses} />

        {/* Operator Tabs Section */}
        <OperatorTabsSection 
          operator={operator}
          buses={buses}
          busesLoading={busesLoading}
          onRefresh={handleRefresh}
        />

        {/* Delete Operator Modal - Replace the simple modal */}
        <DeleteOperatorModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          operator={operator}
          isDeleting={isDeleting}
          busCount={buses.length}
        />

        {/* Remove the old simple delete modal code:
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            ...
          </div>
        )}
        */}
      </div>
  );
}