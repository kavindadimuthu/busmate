'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, X, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitForm } from '@/components/mot/passenger-service-permits/permit-form';
import { 
  PermitManagementService, 
  OperatorManagementService,
  RouteManagementService,
  PassengerServicePermitRequest,
  PassengerServicePermitResponse,
  OperatorResponse,
  RouteGroupResponse
} from '../../../../../../generated/api-clients/route-management';

export default function EditPermitPage() {
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

  useSetPageMetadata({
    title: `Edit ${permit?.permitNumber || 'Permit'}`,
    description: 'Update passenger service permit details',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits', href: '/mot/passenger-service-permits' }, { label: permit?.permitNumber || 'Permit', href: '/mot/passenger-service-permits/' + permitId }, { label: 'Edit' }],
  });

  // Load permit details and form data
  const loadData = useCallback(async () => {
    if (!permitId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load permit details and form data in parallel
      const [permitData, operatorsList, routeGroupsList] = await Promise.all([
        PermitManagementService.getPermitById(permitId),
        OperatorManagementService.getAllOperatorsAsList(),
        RouteManagementService.getAllRouteGroupsAsList()
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
  const handleSubmit = async (permitData: PassengerServicePermitRequest): Promise<void> => {
    if (!permitId) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await PermitManagementService.updatePermit(permitId, permitData);
      
      // Redirect back to permit details page
      router.push(`/mot/passenger-service-permits/${permitId}`);
    } catch (err) {
      console.error('Error updating permit:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permit. Please try again.');
      throw err; // Re-throw to let form handle the error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push(`/mot/passenger-service-permits/${permitId}`);
    }
  };

  useSetPageActions(
    <button
      onClick={handleCancel}
      className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permit details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !permit) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Failed to Load Permit Details
        </h2>
        <p className="text-gray-600 mb-6">
          The permit you're trying to edit doesn't exist or there was an error loading the details.
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
            onClick={() => router.push('/mot/passenger-service-permits')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Permits
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
                <h3 className="text-sm font-medium text-red-800">Error Updating Permit</h3>
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

        {/* Current Permit Info */}
        {permit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Permit Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Permit Number:</span>
                <span className="ml-2">{permit.permitNumber}</span>
              </div>
              <div>
                <span className="font-medium">Operator:</span>
                <span className="ml-2">{permit.operatorName}</span>
              </div>
              <div>
                <span className="font-medium">Route Group:</span>
                <span className="ml-2">{permit.routeGroupName}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 capitalize">{permit.status}</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2">{permit.permitType}</span>
              </div>
              <div>
                <span className="font-medium">Max Buses:</span>
                <span className="ml-2">{permit.maximumBusAssigned || 'Not specified'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Update Permit Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Modify the passenger service permit details below
            </p>
          </div>

          <div className="p-6">
            {permit && (
              <PermitForm
                permit={permit}
                operators={operators}
                routeGroups={routeGroups}
                operatorsLoading={operatorsLoading}
                routeGroupsLoading={routeGroupsLoading}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitButtonText="Update Permit"
                mode="edit"
              />
            )}
          </div>
        </div>

        {/* Warning Information */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Important Notes</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>• Changing the operator or route group may affect existing bus assignments and schedules.</p>
            <p>• Reducing the maximum bus count may require reassigning excess buses.</p>
            <p>• Status changes should reflect the actual operational state of the permit.</p>
            <p>• Any changes will be logged and may require approval based on your organization's policies.</p>
          </div>
        </div>
    </div>
  );
}