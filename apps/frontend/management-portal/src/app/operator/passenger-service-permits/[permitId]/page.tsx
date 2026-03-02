'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, AlertCircle, Download, ChevronRight, Plus } from 'lucide-react';
import { useSetPageMetadata, usePageContext, useSetPageActions } from '@/context/PageContext';
import { PermitSummaryCard } from '@/components/operator/permits/PermitSummaryCard';
import { PermitInfoPanel } from '@/components/operator/permits/PermitInfoPanel';
import { getMockPermitById, type OperatorPermitDetail } from '@/data/operator/permits';

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

  const { setMetadata } = usePageContext();
  const router = useRouter();
  const params = useParams();
  const permitId = params.permitId as string;

  // ── State ─────────────────────────────────────────────────────────────────
  const [permit, setPermit] = useState<OperatorPermitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadPermit = useCallback(() => {
    if (!permitId) return;
    setIsLoading(true);
    setError(null);

    // Simulate async delay (replace with real API call)
    const timer = setTimeout(() => {
      try {
        const data = getMockPermitById(permitId);
        if (data) {
          setPermit(data);
        } else {
          setError(`Permit "${permitId}" was not found.`);
        }
      } catch {
        setError('An unexpected error occurred while loading the permit.');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [permitId]);

  useEffect(() => {
    loadPermit();
  }, [loadPermit]);

  // Update header when permit data is loaded
  useEffect(() => {
    if (permit) {
      setMetadata({
        title: 'Service Permit Details',
        description: permit.permitNumber,
        breadcrumbs: [
          { label: 'Service Permits', href: '/operator/passenger-service-permits' },
          { label: permit.permitNumber },
        ],
      });
    }
  }, [permit, setMetadata]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleBack = () => {
    router.push('/operator/passenger-service-permits');
  };

  const handleRefresh = () => {
    loadPermit();
  };

  const handleExport = () => {
    // Placeholder: implement PDF/print when needed
    window.print();
  };

  useSetPageActions(
    <>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
    </>
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-gray-500 text-sm">Loading permit details…</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !permit) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Permit not found</h2>
          <p className="text-sm text-gray-500 mb-6">{error ?? 'The requested permit could not be found.'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Permits
          </button>
        </div>
      </div>
    );
  }

  // ── Main render
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Read-only notice */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            This permit is issued and managed by the Ministry of Transport. All information is
            read-only. Contact the MOT to request any modifications.
          </span>
        </div>

        {/* Permit summary card */}
        <PermitSummaryCard permit={permit} />

        {/* Tabbed detail panel */}
        <PermitInfoPanel permit={permit} />
    </main>
  );
}
