'use client';

import { useState } from 'react';
import { BusOperatorOperationsService } from '@busmate/api-client-core';
import type { OperatorPermitRequest } from '@busmate/api-client-core';
import { useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useMyOperator } from '@/hooks/operator/useMyOperator';
import { OperatorPermitForm } from '@/components/operator/permits/OperatorPermitForm';
import { apiErrorMessage } from '@/lib/api/errors';

export default function CreatePermitPage() {
  const router = useRouter();
  const { operator } = useMyOperator();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useSetPageMetadata({
    title: 'Add Service Permit',
    description: 'Record a passenger service permit your company holds',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Service Permits', href: '/operator/passenger-permits' }, { label: 'Add' }],
  });

  const handleSubmit = async (request: OperatorPermitRequest) => {
    if (!operator?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await BusOperatorOperationsService.createOperatorPermit(operator.id, request);
      router.push(`/operator/passenger-permits/${created.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the permit'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <OperatorPermitForm
        submitting={submitting}
        submitError={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/operator/passenger-permits')}
      />
    </div>
  );
}
