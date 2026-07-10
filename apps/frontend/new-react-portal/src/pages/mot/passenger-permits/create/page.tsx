'use client';

import { X, AlertCircle } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { PermitForm } from '@/components/mot/passenger-permits/PermitForm';
import { useAddPermit, PermitHelperInfo } from '@/hooks/mot/passenger-permits/useAddPermit';

export default function AddPermitPage() {
  const {
    operators, routeGroups, isSubmitting, error,
    operatorsLoading, routeGroupsLoading,
    handleSubmit, handleCancel, dismissError,
  } = useAddPermit();

  useSetPageMetadata({
    title: 'Add New Passenger Service Permit',
    description: 'Create a new passenger service permit',
    activeItem: 'passenger-permits',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Permits', href: '/mot/passenger-permits' }, { label: 'Add New' }],
  });

  useSetPageActions(
    <button
      onClick={handleCancel}
      className="flex items-center gap-2 px-4 py-2 text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
    >
      <X className="w-4 h-4" />
      Cancel
    </button>
  );

  const isFormLoading = operatorsLoading || routeGroupsLoading;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error Creating Permit</h3>
              <p className="text-sm text-destructive mt-1">{error}</p>
              <button onClick={dismissError} className="text-sm text-destructive hover:text-destructive underline mt-2">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
            <span className="text-primary">Loading form data...</span>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Permit Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter the passenger service permit details</p>
        </div>
        <div className="p-6">
          {!isFormLoading ? (
            <PermitForm
              operators={operators} routeGroups={routeGroups}
              operatorsLoading={operatorsLoading} routeGroupsLoading={routeGroupsLoading}
              onSubmit={handleSubmit} onCancel={handleCancel}
              isSubmitting={isSubmitting} submitButtonText="Create Permit" mode="create"
            />
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-secondary rounded w-1/4 mb-2" />
                  <div className="h-12 bg-secondary rounded" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PermitHelperInfo />
    </div>
  );
}