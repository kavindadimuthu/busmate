'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Building2, 
  Calendar, 
  MapPin, 
  Save, 
  X, 
  AlertCircle,
  Info,
  Bus,
  User
} from 'lucide-react';
import type { 
  PassengerServicePermitRequest, 
  PassengerServicePermitResponse, 
  OperatorResponse,
  RouteGroupResponse
} from '../../../../generated/api-clients/route-management';

interface PermitFormProps {
  permit?: PassengerServicePermitResponse;
  operators: OperatorResponse[];
  routeGroups: RouteGroupResponse[];
  operatorsLoading: boolean;
  routeGroupsLoading: boolean;
  onSubmit: (permitData: PassengerServicePermitRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
  mode: 'create' | 'edit';
}

interface FormErrors {
  operatorId?: string;
  routeGroupId?: string;
  permitNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  maximumBusAssigned?: string;
  status?: string;
  permitType?: string;
}

export function PermitForm({
  permit,
  operators,
  routeGroups,
  operatorsLoading,
  routeGroupsLoading,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText,
  mode
}: PermitFormProps) {
  // Form state
  const [formData, setFormData] = useState<PassengerServicePermitRequest>({
    operatorId: permit?.operatorId || '',
    routeGroupId: permit?.routeGroupId || '',
    permitNumber: permit?.permitNumber || '',
    issueDate: permit?.issueDate ? permit.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: permit?.expiryDate ? permit.expiryDate.split('T')[0] : '',
    maximumBusAssigned: permit?.maximumBusAssigned || undefined,
    status: permit?.status || 'pending',
    permitType: permit?.permitType || 'REGULAR',
  });

  // Form validation and UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  console.log("Permit details: ", permit)

  // Form validation
  useEffect(() => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.operatorId.trim()) {
      newErrors.operatorId = 'Operator is required';
    }

    if (!formData.routeGroupId.trim()) {
      newErrors.routeGroupId = 'Route Group is required';
    }

    if (!formData.permitNumber.trim()) {
      newErrors.permitNumber = 'Permit Number is required';
    }

    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue Date is required';
    }

    // Date validation
    if (formData.issueDate && formData.expiryDate) {
      const issueDate = new Date(formData.issueDate);
      const expiryDate = new Date(formData.expiryDate);
      
      if (expiryDate <= issueDate) {
        newErrors.expiryDate = 'Expiry date must be after issue date';
      }
    }

    // Maximum buses validation
    if (formData.maximumBusAssigned !== undefined) {
      if (formData.maximumBusAssigned <= 0) {
        newErrors.maximumBusAssigned = 'Maximum buses must be greater than 0';
      } else if (formData.maximumBusAssigned > 1000) {
        newErrors.maximumBusAssigned = 'Maximum buses seems unusually high (max 1000)';
      }
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Permit type validation
    if (!formData.permitType) {
      newErrors.permitType = 'Permit type is required';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  // Handle input changes
  const handleInputChange = (field: keyof PassengerServicePermitRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSubmitError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) return;

    try {
      setSubmitError(null);
      
      const permitData: PassengerServicePermitRequest = {
        ...formData,
        maximumBusAssigned: formData.maximumBusAssigned || undefined,
      };

      await onSubmit(permitData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save permit. Please try again.');
    }
  };

  // Form field options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'active', label: 'Active', color: 'text-green-600' },
    { value: 'suspended', label: 'Suspended', color: 'text-orange-600' },
    { value: 'expired', label: 'Expired', color: 'text-red-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
  ];

  const permitTypeOptions = [
    { value: 'NORMAL', label: 'Normal Service', description: 'Standard passenger service operations' },
    { value: 'EXPRESS', label: 'Express Service', description: 'Limited stop express services' },
    { value: 'INTERCITY', label: 'Intercity Service', description: 'Long distance intercity operations' },
    { value: 'LUXURY', label: 'Luxury Service', description: 'Premium passenger services' },
    { value: 'SEMI_LUXURY', label: 'Semi-Luxury Service', description: 'Semi-luxury passenger services' },
  ];

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  // Calculate default expiry date (1 year from issue date)
  const getDefaultExpiryDate = (issueDate: string) => {
    if (!issueDate) return '';
    const issue = new Date(issueDate);
    const expiry = new Date(issue);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Submit Error Alert */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permit Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permit Number *
            </label>
            <input
              type="text"
              value={formData.permitNumber}
              onChange={(e) => handleInputChange('permitNumber', e.target.value)}
              placeholder="e.g., PSP-2024-001"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.permitNumber ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.permitNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.permitNumber}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Unique identifier for this permit</p>
          </div>

          {/* Permit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permit Type *
            </label>
            <select
              value={formData.permitType}
              onChange={(e) => handleInputChange('permitType', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.permitType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select permit type</option>
              {permitTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.permitType && (
              <p className="text-red-600 text-sm mt-1">{errors.permitType}</p>
            )}
            {formData.permitType && (
              <p className="text-gray-500 text-sm mt-1">
                {permitTypeOptions.find(opt => opt.value === formData.permitType)?.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-600 text-sm mt-1">{errors.status}</p>
            )}
          </div>

          {/* Maximum Bus Assigned */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Buses Allowed
            </label>
            <div className="relative">
              <Bus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={formData.maximumBusAssigned || ''}
                onChange={(e) => handleInputChange('maximumBusAssigned', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 10"
                min="1"
                max="1000"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.maximumBusAssigned ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.maximumBusAssigned && (
              <p className="text-red-600 text-sm mt-1">{errors.maximumBusAssigned}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Maximum number of buses that can operate under this permit</p>
          </div>
        </div>
      </div>

      {/* Operator & Route Assignment Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Operator & Route Assignment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operator *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.operatorId}
                onChange={(e) => handleInputChange('operatorId', e.target.value)}
                disabled={operatorsLoading}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.operatorId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {operatorsLoading ? 'Loading operators...' : 'Select an operator'}
                </option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name} ({operator.operatorType}) - {operator.region}
                  </option>
                ))}
              </select>
            </div>
            {errors.operatorId && (
              <p className="text-red-600 text-sm mt-1">{errors.operatorId}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">The operator who will hold this permit</p>
          </div>

          {/* Route Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Group *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.routeGroupId}
                onChange={(e) => handleInputChange('routeGroupId', e.target.value)}
                disabled={routeGroupsLoading}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.routeGroupId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {routeGroupsLoading ? 'Loading route groups...' : 'Select a route group'}
                </option>
                {routeGroups.map((routeGroup) => (
                  <option key={routeGroup.id} value={routeGroup.id}>
                    {routeGroup.name} ({routeGroup.routes?.length || 0} routes)
                  </option>
                ))}
              </select>
            </div>
            {errors.routeGroupId && (
              <p className="text-red-600 text-sm mt-1">{errors.routeGroupId}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">The route group covered by this permit</p>
          </div>
        </div>

        {/* Selected Route Group Details */}
        {formData.routeGroupId && !routeGroupsLoading && (
          (() => {
            const selectedGroup = routeGroups.find(rg => rg.id === formData.routeGroupId);
            return selectedGroup && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Selected Route Group Details</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Name:</strong> {selectedGroup.name}</p>
                  {selectedGroup.description && (
                    <p><strong>Description:</strong> {selectedGroup.description}</p>
                  )}
                  <p><strong>Number of Routes:</strong> {selectedGroup.routes?.length || 0}</p>
                  {selectedGroup.routes && selectedGroup.routes.length > 0 && (
                    <div className="mt-2">
                      <strong>Routes:</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        {selectedGroup.routes.slice(0, 3).map((route, index) => (
                          <li key={route.id || index} className="list-disc">
                            {route.name} ({route.startStopName} → {route.endStopName})
                          </li>
                        ))}
                        {selectedGroup.routes.length > 3 && (
                          <li className="list-disc text-blue-600">
                            ... and {selectedGroup.routes.length - 3} more routes
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Validity Period Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Validity Period</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date *
            </label>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => handleInputChange('issueDate', e.target.value)}
              max={today}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.issueDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.issueDate && (
              <p className="text-red-600 text-sm mt-1">{errors.issueDate}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Date when the permit was issued</p>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                min={formData.issueDate || today}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.expiryDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (formData.issueDate) {
                    const defaultExpiry = getDefaultExpiryDate(formData.issueDate);
                    handleInputChange('expiryDate', defaultExpiry);
                  }
                }}
                disabled={!formData.issueDate}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Set to 1 year from issue date"
              >
                +1Y
              </button>
            </div>
            {errors.expiryDate && (
              <p className="text-red-600 text-sm mt-1">{errors.expiryDate}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">Leave empty for permanent permit</p>
          </div>
        </div>

        {/* Validity Information */}
        {formData.issueDate && formData.expiryDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-green-400 mt-0.5 mr-3 shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Permit Validity Period</p>
                <p>
                  This permit will be valid from {new Date(formData.issueDate).toLocaleDateString()} 
                  {' '}to {new Date(formData.expiryDate).toLocaleDateString()}.
                </p>
                <p className="mt-1">
                  Duration: {Math.ceil((new Date(formData.expiryDate).getTime() - new Date(formData.issueDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {submitButtonText}
            </>
          )}
        </button>
      </div>

      {/* Form Validation Summary */}
      {!isFormValid && Object.keys(errors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Please fix the following errors:
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3 shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">About Passenger Service Permits</p>
            <p>
              Passenger service permits authorize operators to provide public transportation services 
              on specific routes. Each permit defines the operator, route group, validity period, 
              and maximum number of buses allowed to operate under the permit.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}