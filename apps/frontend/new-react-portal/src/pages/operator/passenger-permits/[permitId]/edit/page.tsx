'use client';

import { useEffect, useState } from 'react';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type { OperatorPermitRequest, PassengerServicePermitResponse } from '@busmate/api-client-core';
import { useParams, useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { OperatorPermitForm } from '@/components/operator/permits/OperatorPermitForm';
import { ErrorBanner } from '@/components/shared/form-primitives';
import { apiErrorMessage } from '@/lib/api/errors';

export default function EditPermitPage() {
  const router = useRouter();
  const { permitId } = useParams() as { permitId: string };
  const { operator } = useMyOperator();
  const [permit, setPermit] = useState<PassengerServicePermitResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Edit Service Permit',
    description: permit?.permitNumber ?? '',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Service Permits', href: '/operator/passenger-permits' },
      { label: permit?.permitNumber ?? 'Permit', href: `/operator/passenger-permits/${permitId}` },
      { label: 'Edit' },
    ],
  });

  useEffect(() => {
    if (!operator?.id) return;
    BusOperatorOperationsService.getOperatorPermitById(operator.id, permitId)
      .then(setPermit)
      .catch((err) => setLoadError(apiErrorMessage(err, 'Could not load the permit')));
  }, [operator?.id, permitId]);

  const handleSubmit = async (request: OperatorPermitRequest) => {
    if (!operator?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await BusOperatorOperationsService.updateOperatorPermit(operator.id, permitId, request);
      router.push(`/operator/passenger-permits/${permitId}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the permit'));
      setSubmitting(false);
    }
  };

  if (loadError) return <ErrorBanner message={loadError} />;
  if (!permit) return <div className="h-64 rounded-xl border bg-card animate-pulse" />;

  return (
    <div className="max-w-4xl">
      <OperatorPermitForm
        permit={permit}
        submitting={submitting}
        submitError={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/operator/passenger-permits/${permitId}`)}
      />
    </div>
  );
}
