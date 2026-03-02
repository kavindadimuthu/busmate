'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle, ChevronRight, Download } from 'lucide-react';
import { useSetPageMetadata, usePageContext, useSetPageActions } from '@/context/PageContext';
import { BusDetailsTabs } from '@/components/operator/fleet';
import { getOperatorBusById, type OperatorBus } from '@/data/operator/buses';

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

  const { setMetadata } = usePageContext();

  const router = useRouter();
  const params = useParams();
  const busId = params.busId as string;

  // ── State ─────────────────────────────────────────────────────────────────
  const [bus,       setBus]       = useState<OperatorBus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Load bus ──────────────────────────────────────────────────────────────
  const loadBus = useCallback(async () => {
    if (!busId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getOperatorBusById(busId);
      setBus(data);
    } catch (err) {
      console.error('Error loading bus:', err);
      setError('Bus not found or failed to load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [busId]);

  useEffect(() => { loadBus(); }, [loadBus]);

  // Update header title when bus data is loaded
  useEffect(() => {
    if (bus) {
      setMetadata({
        title: bus.plateNumber,
        description: `${bus.manufacturer} ${bus.model} · Bus details – read-only view`,
        breadcrumbs: [
          { label: 'Fleet Management', href: '/operator/fleet-management' },
          { label: bus.plateNumber },
        ],
      });
    }
  }, [bus, setMetadata]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    await loadBus();
  }, [loadBus]);

  useSetPageActions(
    <>
      <button
        onClick={handleRefresh}
        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </>
  );


  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !bus) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto mt-16 bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bus Not Found</h2>
          <p className="text-sm text-gray-500 mb-5">{error ?? 'The requested bus could not be found.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <Link
                href="/operator/fleet-management"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Back to Fleet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
        {/* Read-only notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700">
          <strong>Read-only view.</strong> Bus registration details are managed by the National Transport Commission (NTC).
        </div>

        {/* Main content with tabs */}
        <BusDetailsTabs bus={bus} onRefresh={handleRefresh} />
    </div>
  );
}
