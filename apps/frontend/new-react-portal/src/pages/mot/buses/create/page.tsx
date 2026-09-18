'use client';

import { useEffect, useState } from 'react';
import { BusManagementService, OperatorManagementService } from '@busmate/api-client-core';
import type { BusRequest, OperatorResponse } from '@busmate/api-client-core';
import { useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { BusProfileForm } from '@/components/shared/fleet/BusProfileForm';
import type { BusProfileValues } from '@/components/shared/fleet/BusProfileForm';
import { apiErrorMessage } from '@/lib/api/errors';

export default function AddBusPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<OperatorResponse[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Add New Bus',
    description: 'Register a bus for any operator',
    activeItem: 'buses',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Buses', href: '/mot/buses' }, { label: 'Add New' }],
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
      const created = await BusManagementService.createBus(values as BusRequest);
      router.push(`/mot/buses/${created.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the bus'));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!operators) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;
  return <BusProfileForm operators={operators} submitting={submitting} submitError={error} onSubmit={submit} onCancel={() => router.push('/mot/buses')} />;
}
