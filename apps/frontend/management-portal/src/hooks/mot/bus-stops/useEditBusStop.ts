import { useEffect, useState } from 'react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import type { StopResponse } from '@busmate/api-client-route';

interface UseEditBusStopParams {
  params: { busStopId: string };
}

export function useEditBusStop({ params }: UseEditBusStopParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busStopId, setBusStopId] = useState<string>('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.busStopId || searchParams.get('id') || '';
      setBusStopId(id);
    };
    resolveParams();
  }, [params, searchParams]);

  useSetPageMetadata({
    title: 'Edit Bus Stop',
    description: 'Update the bus stop information, location, and accessibility details',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: 'Edit' }],
  });

  useSetPageActions(
    React.createElement(
      'button',
      {
        onClick: () => busStopId ? router.push(`/mot/bus-stops/${busStopId}`) : router.push('/mot/bus-stops'),
        className: 'flex items-center text-muted-foreground hover:text-foreground transition-colors',
      },
      React.createElement(ArrowLeft, { className: 'w-5 h-5 mr-2' }),
      'Back to Details'
    )
  );

  const handleSuccess = (busStop: StopResponse) => {
    router.push(`/mot/bus-stops/${busStop.id}`);
  };

  const handleCancel = () => {
    if (busStopId) {
      router.push(`/mot/bus-stops/${busStopId}`);
    } else {
      router.push('/mot/bus-stops');
    }
  };

  const navigateToList = () => router.push('/mot/bus-stops');

  return { busStopId, handleSuccess, handleCancel, navigateToList };
}
