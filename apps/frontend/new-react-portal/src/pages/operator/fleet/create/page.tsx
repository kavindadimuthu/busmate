'use client';

import { useState } from 'react';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import { useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { BusProfileForm } from '@/components/shared/fleet/BusProfileForm';
import type { BusProfileValues } from '@/components/shared/fleet/BusProfileForm';
import { apiErrorMessage } from '@/lib/api/errors';

export default function RegisterBusPage() {
  const router = useRouter();
  const { operator } = useMyOperator();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Register a Bus',
    description: 'Add a bus to your fleet. You can add photos and documents once it is saved.',
    activeItem: 'fleet',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Fleet', href: '/operator/fleet' }, { label: 'Register' }],
  });

  const submit = async (values: BusProfileValues) => {
    if (!operator?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await BusOperatorOperationsService.createOperatorBus(operator.id, values);
      router.push(`/operator/fleet/${created.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not register the bus'));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return <BusProfileForm submitting={submitting} submitError={error} onSubmit={submit} onCancel={() => router.push('/operator/fleet')} />;
}
