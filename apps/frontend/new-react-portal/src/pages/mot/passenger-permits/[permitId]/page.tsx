'use client';

import { AlertCircle } from 'lucide-react';
import { usePermitDetails } from '@/hooks/mot/passenger-permits/usePermitDetails';
import { PermitSummary } from '@/components/mot/passenger-permits/PermitSummary';
import { PermitTabsSection } from '@/components/mot/passenger-permits/PermitTabsSection';
import { DeletePermitModal } from '@/components/mot/passenger-permits/DeletePermitModal';
import { PermitBusLinksPanel } from '@/components/operator/permits/PermitBusLinksPanel';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { useRouter } from '@/lib/router';

export default function PermitDetailsPage() {
  const router = useRouter();
  const {
    links,
    statusDialog,
    setStatusDialog,
    actionBusy,
    actionError,
    setActionError,
    suspend,
    withdraw,
    endLink,
    permit,
    operator,
    routeGroup,
    assignedBuses,
    isLoading,
    operatorLoading,
    routeGroupLoading,
    busesLoading,
    error,
    clearError,
    showDeleteModal,
    isDeleting,
    handleRefresh,
    handleBack,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = usePermitDetails();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive/70 mx-auto mb-4" />
        <div className="text-destructive text-lg mb-4">{error || 'Permit not found'}</div>
        <button onClick={handleBack} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary">
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

      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      {permit.statusReason && (permit.status === 'inactive' || permit.status === 'cancelled') && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <strong>{permit.status === 'inactive' ? 'Suspended' : 'Withdrawn'}:</strong> {permit.statusReason}
        </div>
      )}

      <PermitSummary permit={permit} operator={operator} routeGroup={routeGroup} assignedBuses={assignedBuses} />

      <PermitTabsSection
        permit={permit}
        operator={operator}
        routeGroup={routeGroup}
        assignedBuses={assignedBuses}
        operatorLoading={operatorLoading}
        routeGroupLoading={routeGroupLoading}
        busesLoading={busesLoading}
        onRefresh={handleRefresh}
      />

      <PermitBusLinksPanel
        permit={permit}
        links={links}
        busy={actionBusy}
        onEnd={endLink}
        onOpenBus={(busId) => router.push(`/mot/buses/${busId}`)}
      />

      <ReasonDialog
        open={statusDialog !== null}
        onOpenChange={(open) => !open && setStatusDialog(null)}
        title={statusDialog === 'suspend' ? 'Suspend this permit?' : 'Withdraw this permit?'}
        description={
          statusDialog === 'suspend'
            ? 'A suspended permit cannot authorise new buses or receive new trips until you reinstate it. The operator sees your reason.'
            : 'Withdrawing ends every bus link on the permit. Use this when the operator no longer holds it.'
        }
        confirmLabel={statusDialog === 'suspend' ? 'Suspend permit' : 'Withdraw permit'}
        destructive
        busy={actionBusy}
        error={actionError}
        onConfirm={(reason) => (statusDialog === 'suspend' ? suspend(reason) : withdraw(reason))}
      />

      <DeletePermitModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        permit={permit}
        operator={operator}
        routeGroup={routeGroup}
        assignedBuses={assignedBuses}
        isDeleting={isDeleting}
      />
    </div>
  );
}