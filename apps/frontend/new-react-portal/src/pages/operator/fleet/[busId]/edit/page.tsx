'use client';

import { useState } from 'react';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import { useParams, useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { useBusProfile } from '@/hooks/shared/useBusProfile';
import { BusProfileForm } from '@/components/shared/fleet/BusProfileForm';
import type { BusProfileValues } from '@/components/shared/fleet/BusProfileForm';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';

export default function EditBusPage() {
  const router = useRouter();
  const { busId } = useParams() as { busId: string };
  const { operator } = useMyOperator();
  const { bus, links, isLoading, error: loadError } = useBusProfile(busId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: `Edit ${bus?.plateNumber ?? 'Bus'}`,
    description: 'Details, facilities and seat layout',
    activeItem: 'fleet',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Fleet', href: '/operator/fleet' },
      { label: bus?.plateNumber ?? 'Bus', href: `/operator/fleet/${busId}` },
      { label: 'Edit' },
    ],
  });

  const submit = async (values: BusProfileValues) => {
    if (!operator?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await BusOperatorOperationsService.updateOperatorBus(operator.id, busId, values);
      router.push(`/operator/fleet/${busId}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the bus'));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;
  if (loadError || !bus) return <ErrorBanner message={loadError ?? 'Bus not found'} />;

  return (
    <BusProfileForm
      bus={bus}
      submitting={submitting}
      submitError={error}
      serviceClassLocked={links.some((l) => l.inForce)}
      onSubmit={submit}
      onCancel={() => router.push(`/operator/fleet/${busId}`)}
    />
  );
}
