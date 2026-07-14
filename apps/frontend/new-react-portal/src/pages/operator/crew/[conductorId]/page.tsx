'use client';

import { ArrowLeft, Edit, ToggleLeft, ToggleRight, AlertCircle, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@busmate/ui';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { CrewSummary } from '@/components/operator/crew';
import { useCrewDetail } from '@/hooks/operator/crew/useCrewDetail';
import { getUserDisplayName } from '@/data/admin/users';

export default function ConductorDetailPage() {
  const {
    conductor, isLoading, error, actionLoading, confirmOpen,
    handleEdit, handleBack, openConfirm, closeConfirm, handleConfirmToggleStatus,
  } = useCrewDetail();

  useSetPageMetadata({
    title: conductor ? getUserDisplayName(conductor) : 'Conductor Details',
    description: conductor ? `${conductor.email} · Conductor` : '',
    activeItem: 'crew',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Crew Management', href: '/operator/crew' },
      { label: conductor ? getUserDisplayName(conductor) : 'Conductor Details' },
    ],
  });

  const isActive = conductor?.status === 'active';

  useSetPageActions(
    conductor ? (
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-3 py-1.5 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={openConfirm}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
            isActive
              ? 'text-warning bg-warning/10 border-orange-200 hover:bg-warning/15'
              : 'text-success bg-success/10 border-success/20 hover:bg-success/15'
          }`}
        >
          {isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          {isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>
    ) : null,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error || !conductor) {
    return (
      <div className="max-w-md mx-auto mt-16 bg-card border border-destructive/20 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive/80 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">{error ?? 'Conductor not found'}</h2>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary transition-colors"
        >
          Back to Crew
        </button>
      </div>
    );
  }

  return (
    <div>
      <CrewSummary conductor={conductor} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && closeConfirm()}
        title={isActive ? 'Deactivate Conductor' : 'Reactivate Conductor'}
        description={
          isActive
            ? `Deactivate "${getUserDisplayName(conductor)}"? They will immediately lose access to the platform. This can be reversed later.`
            : `Reactivate "${getUserDisplayName(conductor)}"? They will be able to access the platform again.`
        }
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
        variant={isActive ? 'destructive' : 'default'}
        onConfirm={handleConfirmToggleStatus}
        loading={actionLoading}
      />
    </div>
  );
}
