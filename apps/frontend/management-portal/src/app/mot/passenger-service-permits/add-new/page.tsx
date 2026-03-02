'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitForm } from '@/components/mot/passenger-service-permits/permit-form';
import { 
  PermitManagementService, 
  OperatorManagementService,
  RouteManagementService,
  PassengerServicePermitRequest,
  OperatorResponse,
  RouteGroupResponse
} from '../../../../../generated/api-clients/route-management';

export default function AddPermitPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Passenger Service Permit',
    description: 'Create a new passenger service permit',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits', href: '/mot/passenger-service-permits' }, { label: 'Add New' }],
  });
  
  // State
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [routeGroups, setRouteGroups] = useState<RouteGroupResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);
  const [routeGroupsLoading, setRouteGroupsLoading] = useState(true);

  // Load operators and route groups for dropdowns
  const loadFormData = useCallback(async () => {
    try {
      setOperatorsLoading(true);
      setRouteGroupsLoading(true);
      
      const [operatorsList, routeGroupsList] = await Promise.all([
        OperatorManagementService.getAllOperatorsAsList(),
        RouteManagementService.getAllRouteGroupsAsList()
      ]);
      
      setOperators(operatorsList || []);
      setRouteGroups(routeGroupsList || []);
    } catch (err) {
      console.error('Error loading form data:', err);
      setError('Failed to load operators and route groups. Please try again.');
    } finally {
      setOperatorsLoading(false);
      setRouteGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // Handle form submission
  const handleSubmit = async (permitData: PassengerServicePermitRequest): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await PermitManagementService.createPermit(permitData);
      
      // Redirect to the newly created permit details page
      if (response.id) {
        router.push(`/mot/passenger-service-permits/${response.id}`);
      } else {
        router.push('/mot/passenger-service-permits');
      }
    } catch (err) {
      console.error('Error creating permit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create permit. Please try again.');
      throw err; // Re-throw to let form handle the error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.back();
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

  return (
    <div className="space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Creating Permit</h3>
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

        {/* Loading State */}
        {(operatorsLoading || routeGroupsLoading) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-700">Loading form data...</span>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Permit Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter the passenger service permit details
            </p>
          </div>

          <div className="p-6">
            {(!operatorsLoading && !routeGroupsLoading) && (
              <PermitForm
                operators={operators}
                routeGroups={routeGroups}
                operatorsLoading={operatorsLoading}
                routeGroupsLoading={routeGroupsLoading}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={isSubmitting}
                submitButtonText="Create Permit"
                mode="create"
              />
            )}
            
            {/* Show loading placeholder */}
            {(operatorsLoading || routeGroupsLoading) && (
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Helper Information */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Before Creating a Permit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
              <ul className="space-y-1">
                <li>• Operator must be registered and active</li>
                <li>• Route group must be defined with routes</li>
                <li>• Permit number must be unique</li>
                <li>• All required documents must be available</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
              <ul className="space-y-1">
                <li>• Assign buses to the permit</li>
                <li>• Create service schedules</li>
                <li>• Monitor permit compliance</li>
                <li>• Handle renewals before expiry</li>
              </ul>
            </div>
          </div>
        </div>
    </div>
  );
}