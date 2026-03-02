'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Activity,
} from 'lucide-react';
import { OperatorRequest, OperatorResponse, OperatorManagementService } from '../../../../../generated/api-clients/route-management';

interface OperatorFormProps {
  operatorId?: string;
  onSuccess?: (operator: OperatorResponse) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  operatorType: string;
  region: string;
  status: string;
}

interface FormErrors {
  name?: string;
  operatorType?: string;
  region?: string;
  status?: string;
  general?: string;
}

const OPERATOR_TYPES = [
  { value: 'PRIVATE', label: 'Private Operator' },
  { value: 'CTB', label: 'Ceylon Transport Board (CTB)' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'active', label: 'Active', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'inactive', label: 'Inactive', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

const SRI_LANKAN_PROVINCES = [
  'Western Province',
  'Central Province',
  'Southern Province',
  'Northern Province',
  'Eastern Province',
  'North Western Province',
  'North Central Province',
  'Uva Province',
  'Sabaragamuwa Province',
];

export default function OperatorForm({ operatorId, onSuccess, onCancel }: OperatorFormProps) {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    operatorType: 'PRIVATE',
    region: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!operatorId);
  const [isDirty, setIsDirty] = useState(false);

  const isEditMode = !!operatorId;

  // Load existing operator data
  useEffect(() => {
    if (operatorId) {
      loadExistingOperator();
    }
  }, [operatorId]);

  const loadExistingOperator = async () => {
    if (!operatorId) return;

    setInitialLoading(true);
    try {
      const operator = await OperatorManagementService.getOperatorById(operatorId);
      if (operator) {
        setFormData({
          name: operator.name || '',
          operatorType: operator.operatorType || 'PRIVATE',
          region: operator.region || '',
          status: operator.status || 'active',
        });
      }
    } catch (error) {
      console.error('Error loading operator:', error);
      setErrors({ general: 'Failed to load operator data' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setIsDirty(true);
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Operator name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Operator name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Operator name must be less than 100 characters';
    }

    if (!formData.operatorType) {
      newErrors.operatorType = 'Operator type is required';
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const operatorData: OperatorRequest = {
        name: formData.name.trim(),
        operatorType: formData.operatorType,
        region: formData.region.trim(),
        status: formData.status,
        
      };

      let result: OperatorResponse | undefined;

      if (isEditMode && operatorId) {
        result = await OperatorManagementService.updateOperator(operatorId, operatorData);
      } else {
        result = await OperatorManagementService.createOperator(operatorData);
      }

      if (result) {
        if (onSuccess) {
          onSuccess(result);
        } else {
          router.push(`/mot/operators/${result.id}`);
        }
      } else {
        setErrors({ general: `Failed to ${isEditMode ? 'update' : 'create'} operator` });
      }
    } catch (error: any) {
      console.error('Error saving operator:', error);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} operator`;
      
      // Handle specific API errors
      if (error?.status === 409) {
        errorMessage = 'An operator with this name already exists';
      } else if (error?.status === 400) {
        errorMessage = 'Invalid input data. Please check your entries.';
      } else if (error?.status === 401) {
        errorMessage = 'You are not authorized to perform this action';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (isEditMode && operatorId) {
      router.push(`/mot/operators/${operatorId}`);
    } else {
      router.push('/mot/operators');
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operator data...</p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    if (!statusOption) return null;

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusOption.color}`}>
        <Activity className="w-3 h-3 mr-1" />
        {statusOption.label}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter operator name"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.operatorType}
              onChange={(e) => handleInputChange('operatorType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.operatorType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {OPERATOR_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.operatorType && (
              <p className="text-red-600 text-sm mt-1">{errors.operatorType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.status ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-600 text-sm mt-1">{errors.status}</p>
            )}
            <div className="mt-2">
              <StatusBadge status={formData.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Location Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operating Region <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.region ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select a province</option>
              {SRI_LANKAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className="text-red-600 text-sm mt-1">{errors.region}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Select the primary province where this operator conducts business
            </p>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      {isDirty && formData.name && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{formData.name}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {OPERATOR_TYPES.find(t => t.value === formData.operatorType)?.label}
                  </span>
                  {formData.region && (
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {formData.region}
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={formData.status} />
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update Operator' : 'Create Operator'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}