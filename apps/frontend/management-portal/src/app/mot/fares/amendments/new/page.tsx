'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useSetPageMetadata } from '@/context/PageContext';
import { FareAmendmentFormData } from '@/data/mot/fares';
import { FareAmendmentForm } from '@/components/mot/fares/FareAmendmentForm';
import { AlertCircle } from 'lucide-react';

export default function NewAmendmentPage() {
  const router = useRouter();

  useSetPageMetadata({
    title: 'New Fare Amendment',
    description: 'Create a new fare structure amendment',
    activeItem: 'fares',
    showBreadcrumbs: true,
    breadcrumbs: [
      { label: 'Fares', href: '/mot/fares' },
      { label: 'New Amendment' },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: FareAmendmentFormData) => {
      try {
        setIsSubmitting(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const newId = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
        alert(`Fare amendment created successfully! ID: ${newId}`);
        router.push('/mot/fares');
      } catch {
        setError('Failed to create fare amendment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/mot/fares');
    }
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Creating Amendment</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Fare Structure Amendment</h2>
          <p className="text-sm text-gray-600 mt-1">
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

      {/* Guidelines */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Fare Calculation</h4>
            <ul className="space-y-1">
              <li>• Fare = Base Rate + (Stage - 1) × Increment Rate</li>
              <li>• All fares are rounded to the nearest Rs. 0.50</li>
              <li>• Maximum of 350 stages supported (configurable)</li>
              <li>• Each permit type has independent rate settings</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Permit Types</h4>
            <ul className="space-y-1">
              <li>• <strong>Normal</strong> — Standard bus service</li>
              <li>• <strong>Semi Luxury</strong> — Enhanced comfort service</li>
              <li>• <strong>Luxury</strong> — Premium service with AC</li>
              <li>• <strong>Extra Luxury</strong> — Highest tier service</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Amendment Process</h4>
            <ul className="space-y-1">
              <li>• New amendments are created as drafts</li>
              <li>• Require gazette notification before activation</li>
              <li>• Activating a new amendment supersedes the current one</li>
              <li>• Historical amendments are preserved for reference</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Reference Format</h4>
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
