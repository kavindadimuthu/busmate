'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { BusSummary } from '@/components/mot/buses/BusSummary';
import { BusTabsSection } from '@/components/mot/buses/BusTabsSection';
import DeleteBusModal from '@/components/mot/buses/DeleteBusModal';
import { useBusDetails } from '@/hooks/mot/buses/useBusDetails';

export default function BusDetailsPage() {
  const router = useRouter();
  const {
    bus, operator, trips,
    isLoading, tripsLoading, error, clearError,
    showDeleteModal, isDeleting,
    handleBack, handleRefresh, handleViewOperator,
    handleDeleteCancel, handleDeleteConfirm,
  } = useBusDetails();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive/80 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {error || 'Bus not found'}
        </h2>
        <p className="text-muted-foreground mb-6">
          The bus you&apos;re looking for doesn&apos;t exist or there was an error loading the details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleBack}
            className="flex items-center justify-center px-4 py-2 border border-border rounded-lg text-foreground/80 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          <button
            onClick={() => router.push('/mot/buses')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
          >
            View All Buses
          </button>
        </div>
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

      <BusSummary bus={bus} operator={operator} onViewOperator={handleViewOperator} />

      <BusTabsSection
        bus={bus}
        operator={operator}
        trips={trips}
        tripsLoading={tripsLoading}
        onRefresh={handleRefresh}
      />

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