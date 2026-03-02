'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import OperatorForm from '@/components/mot/users/operator/operator-form';
import { OperatorResponse } from '../../../../../generated/api-clients/route-management';

export default function AddNewOperatorPage() {
  const router = useRouter();

  const handleSuccess = (operator: OperatorResponse) => {
    // Redirect to the newly created operator details page
    router.push(`/mot/operators/${operator.id}`);
  };

  const handleCancel = () => {
    router.push('/mot/operators');
  };

  useSetPageMetadata({
    title: 'Add New Operator',
    description: 'Create a new operator',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Operators', href: '/mot/operators' },
      { label: 'Add New' },
    ],
  });

  useSetPageActions(
    <button
      onClick={() => router.push('/mot/operators')}
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
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
  );
}