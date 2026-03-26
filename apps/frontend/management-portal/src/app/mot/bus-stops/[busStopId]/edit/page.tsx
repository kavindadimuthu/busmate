'use client';

import { Suspense } from 'react';
import BusStopForm from '@/components/mot/bus-stops/bus-stop-form';
import { useEditBusStop } from '@/components/mot/bus-stops/useEditBusStop';

interface EditBusStopPageProps {
  params: { busStopId: string };
}

function EditBusStopContent({ params }: EditBusStopPageProps) {
  const { busStopId, handleSuccess, handleCancel, navigateToList } = useEditBusStop({ params });

  if (!busStopId) {
    return (
      <div className="mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-destructive">Invalid Bus Stop ID</h3>
            <p className="text-destructive mt-1">
              No bus stop ID provided. Please go back and select a bus stop to edit.
            </p>
            <button
              onClick={navigateToList}
              className="mt-4 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive transition-colors"
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
      <BusStopForm busStopId={busStopId} onSuccess={handleSuccess} onCancel={handleCancel} />
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