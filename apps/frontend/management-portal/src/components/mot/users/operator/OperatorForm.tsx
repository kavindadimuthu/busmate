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
import { OperatorRequest, OperatorResponse, OperatorManagementService } from '@busmate/api-client-route';

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
  { value: 'pending', label: 'Pending', color: 'text-warning bg-warning/10 border-warning/20' },
  { value: 'active', label: 'Active', color: 'text-success bg-success/10 border-success/20' },
  { value: 'inactive', label: 'Inactive', color: 'text-destructive bg-destructive/10 border-destructive/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-muted-foreground bg-muted border-border' },
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading operator data...</p>
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
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Error</h3>
              <p className="text-sm text-destructive mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Operator Name <span className="text-destructive/80">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary ${
                errors.name ? 'border-destructive/30' : 'border-border'
              }`}
              placeholder="Enter operator name"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-destructive text-sm mt-1">{errors.name}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Operator Type <span className="text-destructive/80">*</span>
            </label>
            <select
              value={formData.operatorType}
              onChange={(e) => handleInputChange('operatorType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary ${
                errors.operatorType ? 'border-destructive/30' : 'border-border'
              }`}
            >
              {OPERATOR_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.operatorType && (
              <p className="text-destructive text-sm mt-1">{errors.operatorType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Status <span className="text-destructive/80">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary ${
                errors.status ? 'border-destructive/30' : 'border-border'
              }`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-destructive text-sm mt-1">{errors.status}</p>
            )}
            <div className="mt-2">
              <StatusBadge status={formData.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-card rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Location Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Operating Region <span className="text-destructive/80">*</span>
            </label>
            <select
              value={formData.region}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-primary ${
                errors.region ? 'border-destructive/30' : 'border-border'
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
              <p className="text-destructive text-sm mt-1">{errors.region}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">
              Select the primary province where this operator conducts business
            </p>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      {isDirty && formData.name && (
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
          <div className="border border-border rounded-lg p-4 bg-muted">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-foreground">{formData.name}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2 border border-border text-foreground/80 rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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