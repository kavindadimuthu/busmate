'use client';

import { useRouter } from '@/lib/router';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { PauseCircle, PlayCircle } from 'lucide-react';
import { BusProfileService } from '@busmate/api-client-core';
import { useBusProfile } from '@/hooks/shared/useBusProfile';
import { BusProfileView } from '@/components/shared/fleet/BusProfileView';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';
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
  const profile = useBusProfile(bus?.id);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reinstate = async () => {
    if (!bus?.id) return;
    setBusy(true);
    setActionError(null);
    try {
      await BusProfileService.reinstateBus(bus.id);
      await Promise.all([profile.reload(), handleRefresh()]);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Could not reinstate the bus'));
    } finally {
      setBusy(false);
    }
  };

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

      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={handleViewOperator} className="text-sm text-primary hover:underline">
          Operator: {operator?.name ?? bus.operatorName}
        </button>
        <div className="flex gap-2">
          {bus.status === 'active' && (
            <button type="button" onClick={() => setSuspendOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10">
              <PauseCircle className="h-4 w-4" /> Suspend from service
            </button>
          )}
          {(bus.status === 'inactive' || bus.status === 'cancelled') && (
            <button type="button" onClick={reinstate} disabled={busy} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50">
              <PlayCircle className="h-4 w-4" /> Reinstate
            </button>
          )}
        </div>
      </div>

      {profile.bus && (
        <BusProfileView
          bus={profile.bus}
          photos={profile.photos}
          documents={profile.documents}
          links={profile.links}
          canEdit
          showOperator
          onChanged={() => {
            profile.reload();
            handleRefresh();
          }}
          onOpenPermit={(permitId) => router.push(`/mot/passenger-permits/${permitId}`)}
        />
      )}

      <ReasonDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={`Suspend ${bus.plateNumber} from service?`}
        description="A suspended bus cannot be given trips until you reinstate it. The operator sees your reason."
        confirmLabel="Suspend bus"
        destructive
        busy={busy}
        error={actionError}
        onConfirm={async (reason) => {
          if (!bus.id) return;
          setBusy(true);
          setActionError(null);
          try {
            await BusProfileService.suspendBus(bus.id, { reason });
            setSuspendOpen(false);
            await Promise.all([profile.reload(), handleRefresh()]);
          } catch (err) {
            setActionError(apiErrorMessage(err, 'Could not suspend the bus'));
          } finally {
            setBusy(false);
          }
        }}
      />

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