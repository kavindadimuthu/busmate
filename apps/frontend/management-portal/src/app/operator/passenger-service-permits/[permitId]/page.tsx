'use client';

import { ArrowLeft, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitSummaryCard } from '@/components/operator/permits/PermitSummaryCard';
import { PermitInfoPanel } from '@/components/operator/permits/PermitInfoPanel';
import { usePermitDetail } from '@/components/operator/permits/usePermitDetail';

export default function ServicePermitDetailPage() {
  useSetPageMetadata({
    title: 'Service Permit Details',
    description: 'Passenger service permit – read-only view',
    activeItem: 'passenger-service-permits',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Service Permits', href: '/operator/passenger-service-permits' },
      { label: 'Permit Details' },
    ],
    padding: 0,
  });

  const { permit, isLoading, error, handleBack, handleRefresh, handleExport } = usePermitDetail();

  useSetPageActions(
    <>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-muted transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="hidden sm:inline">Refresh</span>
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-primary rounded-lg hover:bg-primary font-semibold shadow-sm transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
    </>,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-muted-foreground text-sm">Loading permit details…</p>
        </div>
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-destructive/15 text-destructive w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Permit not found</h2>
          <p className="text-sm text-muted-foreground mb-6">{error ?? 'The requested permit could not be found.'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Permits
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          This permit is issued and managed by the Ministry of Transport. All information is
          read-only. Contact the MOT to request any modifications.
        </span>
      </div>
      <PermitSummaryCard permit={permit} />
      <PermitInfoPanel permit={permit} />
    </main>
  );
}
