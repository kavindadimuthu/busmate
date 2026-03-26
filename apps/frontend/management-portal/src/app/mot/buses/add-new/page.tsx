'use client';

import { AlertCircle } from 'lucide-react';
import { BusForm } from '@/components/mot/buses/bus-form';
import { useAddBus } from '@/components/mot/buses/useAddBus';

export default function AddBusPage() {
  const { operators, operatorsLoading, isSubmitting, error, clearError, handleSubmit, handleCancel } = useAddBus();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error Creating Bus</h3>
              <p className="text-sm text-destructive mt-1">{error}</p>
              <button onClick={clearError} className="text-sm text-destructive hover:text-destructive underline mt-2">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Bus Information</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the bus registration and operational details
          </p>
        </div>
        <div className="p-6">
          <BusForm
            operators={operators}
            operatorsLoading={operatorsLoading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitButtonText="Create Bus"
            mode="create"
          />
        </div>
      </div>
    </div>
  );
}