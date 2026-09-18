'use client';

import { useEffect, useState } from 'react';
import { BusManagementService, OperatorManagementService } from '@busmate/api-client-core';
import type { BusRequest, OperatorResponse } from '@busmate/api-client-core';
import { useParams, useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useBusProfile } from '@/hooks/shared/useBusProfile';
import { BusProfileForm } from '@/components/shared/fleet/BusProfileForm';
import type { BusProfileValues } from '@/components/shared/fleet/BusProfileForm';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';

export default function EditBusPage() {
  const router = useRouter();
  const { busId } = useParams() as { busId: string };
  const { bus, isLoading, error: loadError } = useBusProfile(busId);
  const [operators, setOperators] = useState<OperatorResponse[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: `Edit ${bus?.plateNumber ?? 'Bus'}`,
    description: 'Update bus details, facilities and seat layout',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Buses', href: '/mot/buses' },
      { label: bus?.plateNumber ?? 'Bus', href: `/mot/buses/${busId}` },
      { label: 'Edit' },
    ],
  });

  useEffect(() => {
    OperatorManagementService.getAllOperatorsAsList()
      .then((list) => setOperators([...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load operators')));
  }, []);

  const submit = async (values: BusProfileValues) => {
    setSubmitting(true);
    setError(null);
    try {
      await BusManagementService.updateBus(busId, values as BusRequest);
      router.push(`/mot/buses/${busId}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the bus'));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading || !operators) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;
  if (loadError || !bus) return <ErrorBanner message={loadError ?? 'Bus not found'} />;
  return <BusProfileForm bus={bus} operators={operators} submitting={submitting} submitError={error} onSubmit={submit} onCancel={() => router.push(`/mot/buses/${busId}`)} />;
}
