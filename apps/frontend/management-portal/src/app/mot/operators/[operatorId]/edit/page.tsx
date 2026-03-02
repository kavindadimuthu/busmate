'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import OperatorForm from '@/components/mot/users/operator/operator-form';
import { OperatorResponse } from '../../../../../../generated/api-clients/route-management';

export default function EditOperatorPage() {
  const router = useRouter();
  const params = useParams();
  const operatorId = params.operatorId as string;

  const handleSuccess = (operator: OperatorResponse) => {
    // Redirect back to the operator details page
    router.push(`/mot/operators/${operator.id}`);
  };

  const handleCancel = () => {
    router.push(`/mot/operators/${operatorId}`);
  };

  useSetPageMetadata({
    title: 'Edit Operator',
    description: 'Update operator information',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Operators', href: '/mot/operators' },
      { label: 'Edit' },
    ],
  });

  useSetPageActions(
    <button
      onClick={() => router.push(`/mot/operators/${operatorId}`)}
      className="flex items-center gap-2 px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );

  return (
      <div className="mx-auto space-y-6">
        {/* Form */}
        <OperatorForm
          operatorId={operatorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
  );
}