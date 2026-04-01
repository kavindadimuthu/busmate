'use client';

import { FareAmendmentForm } from '@/components/mot/fares/FareAmendmentForm';
import { useNewAmendment } from '@/hooks/mot/fares/useNewAmendment';
import { AlertCircle } from 'lucide-react';

export default function NewAmendmentPage() {
  const { isSubmitting, error, clearError, handleSubmit, handleCancel } = useNewAmendment();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error Creating Amendment</h3>
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
          <h2 className="text-lg font-semibold text-foreground">New Fare Structure Amendment</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define a new fare structure by specifying the base rates and per-stage increments for each permit type.
            The system will generate the complete fare matrix automatically.
          </p>
        </div>
        <div className="p-6">
          <FareAmendmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitButtonText="Create Amendment"
          />
        </div>
      </div>

      <div className="bg-muted rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Fare Calculation</h4>
            <ul className="space-y-1">
              <li>• Fare = Base Rate + (Stage - 1) × Increment Rate</li>
              <li>• All fares are rounded to the nearest Rs. 0.50</li>
              <li>• Maximum of 350 stages supported (configurable)</li>
              <li>• Each permit type has independent rate settings</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Permit Types</h4>
            <ul className="space-y-1">
              <li>• <strong>Normal</strong> — Standard bus service</li>
              <li>• <strong>Semi Luxury</strong> — Enhanced comfort service</li>
              <li>• <strong>Luxury</strong> — Premium service with AC</li>
              <li>• <strong>Extra Luxury</strong> — Highest tier service</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Amendment Process</h4>
            <ul className="space-y-1">
              <li>• New amendments are created as drafts</li>
              <li>• Require gazette notification before activation</li>
              <li>• Activating a new amendment supersedes the current one</li>
              <li>• Historical amendments are preserved for reference</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Reference Format</h4>
            <ul className="space-y-1">
              <li>• Use format: NTC/FARE/YYYY/NNN</li>
              <li>• YYYY = Year, NNN = Sequential number</li>
              <li>• Gazette numbers follow government standards</li>
              <li>• All amendments must have unique references</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
