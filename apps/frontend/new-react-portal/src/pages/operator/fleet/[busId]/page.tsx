'use client';

import { useState } from 'react';
import { Archive, Pencil, RefreshCw } from 'lucide-react';
import { BusProfileService } from '@busmate/api-client-core';
import { useParams, useRouter } from '@/lib/router';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { useBusProfile } from '@/hooks/shared/useBusProfile';
import { BusProfileView } from '@/components/shared/fleet/BusProfileView';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';

export default function OperatorBusProfilePage() {
  const router = useRouter();
  const { busId } = useParams() as { busId: string };
  const { bus, photos, documents, links, isLoading, error, reload } = useBusProfile(busId);
  const [retireOpen, setRetireOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<number | null>(null);

  useSetPageMetadata({
    title: bus?.plateNumber ?? 'Bus',
    description: 'Details, seat layout, availability, photos and documents',
    activeItem: 'fleet',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet', href: '/operator/fleet' }, { label: bus?.plateNumber ?? 'Bus' }],
  });

  const retired = bus?.status === 'cancelled';
  useSetPageActions(
    <div className="flex items-center gap-2">
      <button onClick={reload} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
      {bus && !retired && (
        <>
          <button
            onClick={async () => {
              setActionError(null);
              setRetireOpen(true);
              BusProfileService.getBusAvailabilityImpact(busId).then((r) => setUpcoming(r.upcomingTrips ?? 0)).catch(() => setUpcoming(null));
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10"
          >
            <Archive className="h-3.5 w-3.5" /> Retire
          </button>
          <button onClick={() => router.push(`/operator/fleet/${busId}/edit`)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </>
      )}
    </div>,
  );

  if (isLoading) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;
  if (error || !bus) return <ErrorBanner message={error ?? 'Bus not found'} />;

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      <BusProfileView
        bus={bus}
        photos={photos}
        documents={documents}
        links={links}
        canEdit
        onChanged={reload}
        onOpenPermit={(permitId) => router.push(`/operator/passenger-permits/${permitId}`)}
      />
      <ReasonDialog
        open={retireOpen}
        onOpenChange={setRetireOpen}
        title={`Retire ${bus.plateNumber}?`}
        description="Use this when the bus is sold, scrapped or permanently withdrawn. It leaves every permit and cannot be given trips or edited again; its history is kept."
        notice={upcoming ? (
          <p className="text-sm p-3 rounded-lg bg-warning/10 border border-warning/20">
            It is assigned to {upcoming} upcoming trip(s). Give those trips another bus from Trips.
          </p>
        ) : undefined}
        confirmLabel="Retire bus"
        destructive
        busy={busy}
        error={actionError}
        onConfirm={async (reason) => {
          setBusy(true);
          setActionError(null);
          try {
            await BusProfileService.retireBus(busId, { reason });
            setRetireOpen(false);
            await reload();
          } catch (err) {
            setActionError(apiErrorMessage(err, 'Could not retire the bus'));
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
