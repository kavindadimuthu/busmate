'use client';

import { Suspense } from 'react';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { useBusStopDetails } from '@/hooks/mot/stops/useBusStopDetails';
import BusStopBasicInfo from '@/components/mot/stops/BusStopBasicInfo';
import BusStopLocationDetails from '@/components/mot/stops/BusStopLocationDetails';
import BusStopMapSection from '@/components/mot/stops/BusStopMapSection';
import BusStopSystemInfo from '@/components/mot/stops/BusStopSystemInfo';
import DeleteBusStopModal from '@/components/mot/stops/DeleteBusStopModal';

interface BusStopDetailsPageProps {
  params: { busStopId: string };
}

function BusStopDetailsContent({ params }: BusStopDetailsPageProps) {
  const {
    busStop, loading, error, isDeleting, copiedField, showDeleteModal,
    activeLanguageTab, hasCoordinates, setActiveLanguageTab,
    loadBusStopDetails, copyToClipboard, handleDeleteCancel,
    handleDeleteConfirm, openInMaps, formatDate, router,
  } = useBusStopDetails({ params });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !busStop) {
    return (
      <div className="mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-destructive">Error Loading Bus Stop</h3>
              <p className="text-destructive mt-1">{error || 'Bus stop not found'}</p>
              <div className="flex gap-3 mt-4">
                <button onClick={loadBusStopDetails} className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive transition-colors">
                  <RefreshCw className="w-4 h-4 mr-2 inline" /> Try Again
                </button>
                <button onClick={() => router.push('/mot/stops')} className="px-4 py-2 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back to Bus Stops
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BusStopBasicInfo busStop={busStop} copiedField={copiedField} onCopy={copyToClipboard} />
          <BusStopLocationDetails busStop={busStop} activeLanguageTab={activeLanguageTab} onTabChange={setActiveLanguageTab} copiedField={copiedField} onCopy={copyToClipboard} />
        </div>
        <div className="space-y-6">
          {hasCoordinates && <BusStopMapSection busStop={busStop} copiedField={copiedField} onCopy={copyToClipboard} onOpenInMaps={openInMaps} />}
          <BusStopSystemInfo busStop={busStop} formatDate={formatDate} />
        </div>
      </div>
      <DeleteBusStopModal isOpen={showDeleteModal} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} busStop={busStop} isDeleting={isDeleting} />
    </div>
  );
}

export default function BusStopDetailsPage({ params }: BusStopDetailsPageProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <BusStopDetailsContent params={params} />
    </Suspense>
  );
}