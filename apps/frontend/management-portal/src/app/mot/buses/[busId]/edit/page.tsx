'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { BusForm } from '@/components/mot/buses/bus-form';
import { 
  BusManagementService, 
  BusRequest,
  BusResponse,
  OperatorManagementService,
  OperatorResponse
} from '../../../../../../generated/api-clients/route-management';

export default function EditBusPage() {
  const router = useRouter();
  const params = useParams();
  const busId = params.busId as string;
  
  // State
  const [bus, setBus] = useState<BusResponse | null>(null);
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);

  useSetPageMetadata({
    title: `Edit ${bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus'}`,
    description: 'Update bus registration and operational details',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses', href: '/mot/buses' }, { label: bus?.plateNumber || bus?.ntcRegistrationNumber || 'Bus Details', href: '/mot/buses/' + busId }, { label: 'Edit' }],
  });

  useSetPageActions(
    <button
      onClick={() => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
          router.push(`/mot/buses/${busId}`);
        }
      }}
      className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  );

  // Load bus details and operators
  const loadData = useCallback(async () => {
    if (!busId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load bus details and operators in parallel
      const [busData, operatorsList] = await Promise.all([
        BusManagementService.getBusById(busId),
        OperatorManagementService.getAllOperatorsAsList()
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

  // Handle form submission
  const handleSubmit = async (busData: BusRequest): Promise<void> => {
    if (!busId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await BusManagementService.updateBus(busId, busData);
      
      // Redirect back to bus details page
      router.push(`/mot/buses/${busId}`);
    } catch (err) {
      console.error('Error updating bus:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bus. Please try again.');
      throw err; // Re-throw to let form handle the error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/mot/buses/${busId}`);
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
  if (error && !bus) {
    return (
        <div className="max-w-md mx-auto text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Bus Details
          </h2>
          <p className="text-gray-600 mb-6">
            The bus you're trying to edit doesn't exist or there was an error loading the details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
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
                <h3 className="text-sm font-medium text-red-800">Error Updating Bus</h3>
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

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bus Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update the bus registration and operational details
            </p>
          </div>

          <div className="p-6">
            {bus && (
              <BusForm
                bus={bus}
                operators={operators}
                operatorsLoading={operatorsLoading}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitButtonText="Update Bus"
                mode="edit"
              />
            )}
          </div>
        </div>
      </div>
  );
}