'use client';

import Link from 'next/link';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { BusDetailsTabs } from '@/components/operator/fleet';
import { useBusDetail } from '@/hooks/operator/fleet/useBusDetail';

export default function OperatorBusDetailsPage() {
  useSetPageMetadata({
    title: 'Bus Details',
    description: 'Bus details – read-only view',
    activeItem: 'fleetmanagement',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Fleet Management', href: '/operator/fleet-management' },
      { label: 'Bus Details' },
    ],
    padding: 0,
  });

  const { bus, isLoading, error, handleRefresh } = useBusDetail();

  useSetPageActions(
    <button
      onClick={handleRefresh}
      className="inline-flex items-center gap-2 px-3 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-muted transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      <span className="hidden sm:inline">Refresh</span>
    </button>,
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-secondary rounded" />
        <div className="h-32 bg-secondary rounded-xl" />
        <div className="h-64 bg-secondary rounded-xl" />
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-16 bg-card border border-destructive/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive/80 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Bus Not Found</h2>
          <p className="text-sm text-muted-foreground mb-5">{error ?? 'The requested bus could not be found.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link
              href="/operator/fleet-management"
              className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Back to Fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-warning/10 border border-warning/20 rounded-lg px-4 py-2.5 text-sm text-warning">
        <strong>Read-only view.</strong> Bus registration details are managed by the National Transport Commission (NTC).
      </div>
      <BusDetailsTabs bus={bus} onRefresh={handleRefresh} />
    </div>
  );
}
