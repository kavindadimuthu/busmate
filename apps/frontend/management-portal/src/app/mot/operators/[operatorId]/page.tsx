'use client';

import { AlertCircle } from 'lucide-react';
import { OperatorSummary } from '@/components/operator/profile/OperatorSummary';
import { OperatorTabsSection } from '@/components/operator/profile/OperatorTabsSection';
import DeleteOperatorModal from '@/components/mot/users/operator/DeleteOperatorModal';
import { useOperatorDetails } from '@/hooks/mot/operators/useOperatorDetails';

export default function OperatorDetailsPage() {
  const {
    operator, buses,
    isLoading, busesLoading, error, clearError,
    showDeleteModal, isDeleting,
    handleBack, handleRefresh,
    handleDeleteCancel, handleDeleteConfirm,
  } = useOperatorDetails();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading operator details...</p>
        </div>
      </div>
    );
  }

  if (error || !operator) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive/70 mx-auto mb-4" />
        <div className="text-destructive text-lg mb-4">
          {error || 'Operator not found'}
        </div>
        <button
          onClick={handleBack}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <p className="text-sm text-destructive mt-1">{error}</p>
              <button onClick={clearError} className="text-sm text-destructive hover:text-destructive underline mt-2">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <OperatorSummary operator={operator} buses={buses} />

      <OperatorTabsSection
        operator={operator}
        buses={buses}
        busesLoading={busesLoading}
        onRefresh={handleRefresh}
      />

      <DeleteOperatorModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        operator={operator}
        isDeleting={isDeleting}
        busCount={buses.length}
      />
    </div>
  );
}