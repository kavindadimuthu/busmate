'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import BusStopForm from '@/components/mot/bus-stops/bus-stop-form';
import { StopResponse } from '../../../../../generated/api-clients/route-management';

export default function AddNewBusStopPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'Add New Bus Stop',
    description: 'Create a new bus stop with location and facility information',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Add New' }],
  });

  useSetPageActions(
    <button
      onClick={() => router.push('/mot/bus-stops')}
      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-2" />
      Back to Bus Stops
    </button>
  );

  const handleSuccess = (busStop: StopResponse) => {
    // Redirect to the newly created bus stop details page
    router.push(`/mot/bus-stops/${busStop.id}`);
  };

  const handleCancel = () => {
    router.push('/mot/bus-stops');
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Form */}
      <BusStopForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}