'use client';

import { useRouter } from '@/lib/router';
import { Upload, Download } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Button, ResourceListView, useResource } from '@busmate/ui';

import { policiesResource } from '@/resources/mot/policies.resource';

export default function PoliciesPage() {
  const router = useRouter();
  const controller = useResource(policiesResource);

  useSetPageMetadata({
    title: 'Policy Management',
    description: 'Manage and monitor transport policies',
    activeItem: 'policies',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Policies' }],
  });

  useSetPageActions(
    <div className="flex items-center gap-2">
      <Button onClick={() => router.push('/mot/policies/upload')}>
        <Upload className="w-4 h-4" />
        Upload Policy
      </Button>
      <Button variant="outline" onClick={() => controller.handleExportAll?.()}>
        <Download className="w-4 h-4" />
        Export
      </Button>
    </div>,
  );

  return (
    <ResourceListView
      resource={policiesResource}
      controller={controller}
      navigate={router.push}
      statsClassName="lg:grid-cols-5"
    />
  );
}
