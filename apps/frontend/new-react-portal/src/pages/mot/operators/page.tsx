'use client';

import { useRouter } from '@/lib/router';
import { ResourceListView, useResource } from '@busmate/ui';
import { useSetPageActions, useSetPageMetadata } from '@/context/PageContext';

import { OperatorActionButtons } from '@/components/mot/operators';
import { operatorsResource } from '@/resources/mot/operators.resource';

export default function OperatorsPage() {
  const router = useRouter();
  const controller = useResource(operatorsResource);

  useSetPageMetadata({
    title: 'Operators',
    description: 'Manage bus operators and their details',
    activeItem: 'operators',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Operators' }],
  });

  useSetPageActions(
    <OperatorActionButtons onExportAll={() => controller.handleExportAll?.()} isLoading={controller.isLoading} />,
  );

  return (
    <ResourceListView
      resource={operatorsResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-6"
    />
  );
}
