'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { BusForm } from '@/components/mot/buses/bus-form';
import { 
  BusManagementService, 
  BusRequest,
  BusResponse,
  OperatorManagementService,
  OperatorResponse
} from '@busmate/api-client-route';

export default function AddBusPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Bus',
    description: 'Register a new bus in the fleet management system',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses', href: '/mot/buses' }, { label: 'Add New' }],
  });
  
  // State
  const [operators, setOperators] = useState<OperatorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorsLoading, setOperatorsLoading] = useState(true);

  // Load operators for dropdown
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

  // Handle form submission
  const handleSubmit = async (busData: BusRequest): Promise<void> => {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await BusManagementService.createBus(busData);
      
      // Redirect to the newly created bus details page
      if (response.id) {
        router.push(`/mot/buses/${response.id}`);
      } else {
        router.push('/mot/buses');
      }
    } catch (err) {
      console.error('Error creating bus:', err);
      setError(err instanceof Error ? err.message : 'Failed to create bus. Please try again.');
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
      onClick={() => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
          router.back();
        }
      }}
      className="flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  );

  return (
      <div className="space-y-6">

        {/* Error Alert */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-destructive">Error Creating Bus</h3>
                <p className="text-sm text-destructive mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-sm text-destructive hover:text-destructive underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Bus Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the bus registration and operational details
            </p>
          </div>

          <div className="p-6">
            <BusForm
              operators={operators}
              operatorsLoading={operatorsLoading}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitButtonText="Create Bus"
              mode="create"
            />
          </div>
        </div>
      </div>
  );
}