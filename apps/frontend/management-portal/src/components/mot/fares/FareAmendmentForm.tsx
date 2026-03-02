'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  FareAmendmentFormData,
  PermitType,
  PERMIT_TYPES,
  PERMIT_TYPE_LABELS,
} from '@/data/mot/fares';

interface FareAmendmentFormProps {
  initialData?: Partial<FareAmendmentFormData>;
  onSubmit: (data: FareAmendmentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

const emptyFormData: FareAmendmentFormData = {
  referenceNumber: '',
  title: '',
  description: '',
  effectiveDate: '',
  gazetteNumber: '',
  remarks: '',
  maxStages: 350,
  baseRates: { NORMAL: 0, SEMILUXURY: 0, LUXURY: 0, EXTRALUXURY: 0 },
  incrementRates: { NORMAL: 0, SEMILUXURY: 0, LUXURY: 0, EXTRALUXURY: 0 },
};

export function FareAmendmentForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = 'Create Amendment',
}: FareAmendmentFormProps) {
  const [formData, setFormData] = useState<FareAmendmentFormData>(() => ({
    ...emptyFormData,
    ...initialData,
    baseRates: { ...emptyFormData.baseRates, ...initialData?.baseRates },
    incrementRates: { ...emptyFormData.incrementRates, ...initialData?.incrementRates },
  }));
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showValidation, setShowValidation] = useState(false);

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (showValidation) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [showValidation]);

  const handleBaseRateChange = useCallback((pt: PermitType, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    setFormData((prev) => ({
      ...prev,
      baseRates: { ...prev.baseRates, [pt]: num },
    }));
  }, []);

  const handleIncrementRateChange = useCallback((pt: PermitType, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    setFormData((prev) => ({
      ...prev,
      incrementRates: { ...prev.incrementRates, [pt]: num },
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.referenceNumber.trim()) errors.referenceNumber = 'Reference number is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.effectiveDate) errors.effectiveDate = 'Effective date is required';
    if (formData.maxStages < 1 || formData.maxStages > 500) errors.maxStages = 'Max stages must be between 1 and 500';

    for (const pt of PERMIT_TYPES) {
      if (formData.baseRates[pt] <= 0) errors[`baseRate_${pt}`] = `${PERMIT_TYPE_LABELS[pt]} base rate must be positive`;
      if (formData.incrementRates[pt] <= 0) errors[`increment_${pt}`] = `${PERMIT_TYPE_LABELS[pt]} increment must be positive`;
    }

    setValidationErrors(errors);
    setShowValidation(true);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit(formData);
  }, [validateForm, onSubmit, formData]);

  const getFieldError = (field: string) => (showValidation ? validationErrors[field] : '');

  const fieldClasses = (field: string) => {
    const hasError = showValidation && validationErrors[field];
    return `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
      hasError
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;
  };

  // Preview: calculate sample fares for stages 1, 50, 100, 200, 350
  const previewStages = useMemo(() => {
    const stages = [1, 50, 100, 200, Math.min(formData.maxStages, 350)];
    return stages.filter((s, i, arr) => arr.indexOf(s) === i && s <= formData.maxStages).map((stage) => {
      const fares = {} as Record<PermitType, number>;
      for (const pt of PERMIT_TYPES) {
        const raw = formData.baseRates[pt] + (stage - 1) * formData.incrementRates[pt];
        fares[pt] = Math.round(raw * 2) / 2;
      }
      return { stage, fares };
    });
  }, [formData.baseRates, formData.incrementRates, formData.maxStages]);

  const hasValidPreview = PERMIT_TYPES.every(
    (pt) => formData.baseRates[pt] > 0 && formData.incrementRates[pt] > 0
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Basic Information */}
      <div className="border-l-4 border-l-blue-500 pl-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <h3 className="text-lg font-semibold text-gray-900">Amendment Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
              placeholder="e.g. NTC/FARE/2026/002"
              className={fieldClasses('referenceNumber')}
            />
            {getFieldError('referenceNumber') && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />{getFieldError('referenceNumber')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Fare Revision - July 2026"
              className={fieldClasses('title')}
            />
            {getFieldError('title') && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />{getFieldError('title')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              className={fieldClasses('effectiveDate')}
            />
            {getFieldError('effectiveDate') && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />{getFieldError('effectiveDate')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gazette Number</label>
            <input
              type="text"
              value={formData.gazetteNumber}
              onChange={(e) => handleInputChange('gazetteNumber', e.target.value)}
              placeholder="e.g. GZ-2026/07/01-2300"
              className={fieldClasses('gazetteNumber')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Brief description of this fare amendment..."
              className={fieldClasses('description')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Stages <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={formData.maxStages}
              onChange={(e) => handleInputChange('maxStages', parseInt(e.target.value, 10) || 350)}
              className={fieldClasses('maxStages')}
            />
            {getFieldError('maxStages') && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />{getFieldError('maxStages')}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => handleInputChange('remarks', e.target.value)}
              placeholder="Additional notes..."
              className={fieldClasses('remarks')}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Fare Rates */}
      <div className="border-l-4 border-l-purple-500 pl-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <h3 className="text-lg font-semibold text-gray-900">Fare Rates Configuration</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Define the base fare (stage 1) and per-stage increment for each permit type.
          The fare for stage N = Base Rate + (N - 1) × Increment Rate, rounded to nearest Rs. 0.50.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Permit Type</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Base Rate (Rs.) *</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Increment/Stage (Rs.) *</th>
              </tr>
            </thead>
            <tbody>
              {PERMIT_TYPES.map((pt, idx) => (
                <tr key={pt} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {PERMIT_TYPE_LABELS[pt]}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={formData.baseRates[pt] || ''}
                      onChange={(e) => handleBaseRateChange(pt, e.target.value)}
                      placeholder="0.00"
                      className={fieldClasses(`baseRate_${pt}`)}
                    />
                    {getFieldError(`baseRate_${pt}`) && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(`baseRate_${pt}`)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={formData.incrementRates[pt] || ''}
                      onChange={(e) => handleIncrementRateChange(pt, e.target.value)}
                      placeholder="0.00"
                      className={fieldClasses(`increment_${pt}`)}
                    />
                    {getFieldError(`increment_${pt}`) && (
                      <p className="text-xs text-red-600 mt-1">{getFieldError(`increment_${pt}`)}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Preview */}
      {hasValidPreview && (
        <div className="border-l-4 border-l-emerald-500 pl-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
            <h3 className="text-lg font-semibold text-gray-900">Fare Preview</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Sample fares generated from the configured rates (rounded to nearest Rs. 0.50).
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Stage</th>
                  {PERMIT_TYPES.map((pt) => (
                    <th key={pt} className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {PERMIT_TYPE_LABELS[pt]} (Rs.)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewStages.map((entry, idx) => (
                  <tr key={entry.stage} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">{entry.stage}</td>
                    {PERMIT_TYPES.map((pt) => (
                      <td key={pt} className="px-4 py-2.5 text-sm text-right tabular-nums text-gray-700">
                        {entry.fares[pt].toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isSubmitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {submitButtonText}
        </button>
      </div>
    </div>
  );
}
