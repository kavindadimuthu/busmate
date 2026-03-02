'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import BusStopForm from '@/components/mot/bus-stops/bus-stop-form';
import { StopResponse } from '../../../../../../generated/api-clients/route-management';

interface EditBusStopPageProps {
  params: { busStopId: string };
}

function EditBusStopContent({ params }: EditBusStopPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for resolved params
  const [busStopId, setBusStopId] = useState<string>('');
  
  // Resolve params asynchronously
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.busStopId || searchParams.get('id') || '';
      setBusStopId(id);
    };
    
    resolveParams();
  }, [params, searchParams]);

  // Page metadata and actions (must be called unconditionally - React rules of hooks)
  useSetPageMetadata({
    title: 'Edit Bus Stop',
    description: 'Update the bus stop information, location, and accessibility details',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Edit' }],
  });

  useSetPageActions(
    <button
      onClick={() => busStopId ? router.push(`/mot/bus-stops/${busStopId}`) : router.push('/mot/bus-stops')}
      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      Back to Details
    </button>
  );

  const handleSuccess = (busStop: StopResponse) => {
    // Redirect to the bus stop details page
    router.push(`/mot/bus-stops/${busStop.id}`);
  };

  const handleCancel = () => {
    // Go back to details page or list page
    if (busStopId) {
      router.push(`/mot/bus-stops/${busStopId}`);
    } else {
      router.push('/mot/bus-stops');
    }
  };

  if (!busStopId) {
    return (
      <div className="mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-800">Invalid Bus Stop ID</h3>
            <p className="text-red-700 mt-1">
              No bus stop ID provided. Please go back and select a bus stop to edit.
            </p>
            <button
              onClick={() => router.push('/mot/bus-stops')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Bus Stops
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-6">
      {/* Form */}
      <BusStopForm
        busStopId={busStopId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default function EditBusStopPage({ params }: EditBusStopPageProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <EditBusStopContent params={params} />
    </Suspense>
  );
}