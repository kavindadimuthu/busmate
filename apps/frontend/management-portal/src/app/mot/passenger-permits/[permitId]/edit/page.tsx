'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { PermitForm } from '@/components/mot/passenger-permits/PermitForm';
import { useEditPermit } from '@/hooks/mot/passenger-permits/useEditPermit';
import { EditPermitInfoBanner, EditPermitWarningNotes } from '@/components/mot/passenger-permits/EditPermitInfoBanner';

export default function EditPermitPage() {
  const router = useRouter();
  const {
    permit, operators, routeGroups,
    isLoading, isSubmitting, error, clearError,
    operatorsLoading, routeGroupsLoading,
    handleSubmit, handleCancel,
  } = useEditPermit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading permit details...</p>
        </div>
      </div>
    );
  }

  if (error && !permit) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive/80 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Permit Details</h2>
        <p className="text-muted-foreground mb-6">
          The permit you&apos;re trying to edit doesn&apos;t exist or there was an error loading the details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center px-4 py-2 border border-border rounded-lg text-foreground/80 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          <button
            onClick={() => router.push('/mot/passenger-permits')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
          >
            View All Permits
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error Updating Permit</h3>
              <p className="text-sm text-destructive mt-1">{error}</p>
              <button onClick={clearError} className="text-sm text-destructive hover:text-destructive underline mt-2">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {permit && <EditPermitInfoBanner permit={permit} />}

      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Update Permit Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Modify the passenger service permit details below</p>
        </div>
        <div className="p-6">
          {permit && (
            <PermitForm
              permit={permit}
              operators={operators}
              routeGroups={routeGroups}
              operatorsLoading={operatorsLoading}
              routeGroupsLoading={routeGroupsLoading}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitButtonText="Update Permit"
              mode="edit"
            />
          )}
        </div>
      </div>

      <EditPermitWarningNotes />
    </div>
  );
}