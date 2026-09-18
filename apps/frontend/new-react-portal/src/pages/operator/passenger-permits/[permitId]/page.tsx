'use client';

import { useState } from 'react';
import { Archive, Pencil, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@busmate/ui';
import type { BusPassengerServicePermitAssignmentResponse } from '@busmate/api-client-core';
import { useRouter } from '@/lib/router';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { usePermitDetail } from '@/hooks/operator/permits/usePermitDetail';
import { PermitDetailsCard } from '@/components/operator/permits/PermitDetailsCard';
import { PermitBusLinksPanel } from '@/components/operator/permits/PermitBusLinksPanel';
import { ReasonDialog } from '@/components/shared/ReasonDialog';
import { ErrorBanner } from '@/components/shared/form-primitives';

export default function ServicePermitDetailPage() {
  const router = useRouter();
  const { permitId, permit, links, buses, isLoading, error, actionError, setActionError, busy, reload, linkBus, endLink, withdraw } =
    usePermitDetail();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [ending, setEnding] = useState<BusPassengerServicePermitAssignmentResponse | null>(null);

  useSetPageMetadata({
    title: 'Service Permit',
    description: permit?.permitNumber ?? '',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Service Permits', href: '/operator/passenger-permits' }, { label: permit?.permitNumber ?? 'Permit' }],
  });

  const withdrawn = permit?.status === 'cancelled';
  useSetPageActions(
    <div className="flex items-center gap-2">
      <button onClick={reload} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
      {permit && !withdrawn && (
        <>
          <button
            onClick={() => setWithdrawOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-destructive/40 text-destructive rounded-lg hover:bg-destructive/10"
          >
            <Archive className="h-3.5 w-3.5" /> Withdraw
          </button>
          <button
            onClick={() => router.push(`/operator/passenger-permits/${permitId}/edit`)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </>
      )}
    </div>,
  );

  if (isLoading && !permit) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;
  if (error || !permit) return <ErrorBanner message={error ?? 'Permit not found'} />;

  return (
    <div className="space-y-6">
      {actionError && <ErrorBanner message={actionError} onDismiss={() => setActionError(null)} />}
      <PermitDetailsCard permit={permit} />
      <PermitBusLinksPanel
        permit={permit}
        links={links}
        candidateBuses={withdrawn ? undefined : buses}
        busy={busy}
        onLink={(busId, startDate) => linkBus(busId, startDate)}
        onEnd={withdrawn ? undefined : setEnding}
        onOpenBus={(busId) => router.push(`/operator/fleet/${busId}`)}
      />

      <ReasonDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw this permit?"
        description="Use this when your company no longer holds the permit. Its bus links end today."
        notice={
          (permit.upcomingTripCount ?? 0) > 0 ? (
            <p className="text-sm p-3 rounded-lg bg-warning/10 border border-warning/20">
              {permit.upcomingTripCount} upcoming trip(s) are assigned to this permit. The MOT will see them as needing a
              new permit.
            </p>
          ) : undefined
        }
        confirmLabel="Withdraw permit"
        destructive
        busy={busy}
        onConfirm={async (reason) => {
          if (await withdraw(reason)) setWithdrawOpen(false);
        }}
      />
      <ConfirmDialog
        open={!!ending}
        onOpenChange={(open) => !open && setEnding(null)}
        title={`End ${ending?.busPlateNumber}'s link?`}
        description="The bus stops being authorised under this permit from today. Trips it is already assigned to keep it until you change them."
        confirmLabel="End link"
        variant="destructive"
        loading={busy}
        onConfirm={async () => {
          if (ending?.id) await endLink(ending.id);
          setEnding(null);
        }}
      />
    </div>
  );
}
