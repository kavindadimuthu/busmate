'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { RouteGroupInfo } from './RouteGroupInfo';
import { RouteTabsContainer } from './RouteTabsContainer';
import { MapPreviewPlaceholder } from './MapPreviewPlaceholder';
import { BusStopManagementService } from '../../../../../generated/api-clients/route-management';
import type { RouteGroupResponse, StopResponse } from '../../../../../generated/api-clients/route-management';

export interface RouteStop {
  stopId: string;
  stopName: string;
  stopOrder: number;
  distanceFromStartKm: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface RouteFormData {
  id?: string;
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  description: string;
  direction: 'OUTBOUND' | 'INBOUND';
  routeNumber?: string;
  roadType?: string;
  routeThrough?: string;
  routeThroughSinhala?: string;
  routeThroughTamil?: string;
  startStopId: string;
  startStopName: string;
  endStopId: string;
  endStopName: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  routeStops: RouteStop[];
}

export interface RouteGroupFormData {
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  description: string;
  outboundRoute: RouteFormData;
  inboundRoute: RouteFormData;
}

interface RouteFormProps {
  mode: 'create' | 'edit';
  initialData?: RouteGroupResponse;
  onSubmit: (formData: RouteGroupFormData) => Promise<void>;
  onCancel: () => void;
  onSaveDraft?: (formData: RouteGroupFormData) => Promise<void>;
  isLoading?: boolean;
  isSavingDraft?: boolean;
  error?: string | null;
  validationErrors?: Record<string, string>;
  onErrorChange?: (error: string | null) => void;
  onValidationErrorsChange?: (errors: Record<string, string>) => void;
}

// Alert component for different message types
interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  actions?: React.ReactNode;
}

function Alert({ type, title, message, onDismiss, dismissible = true, actions }: AlertProps) {
  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-500" />,
          titleColor: 'text-red-900',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          titleColor: 'text-yellow-900',
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          titleColor: 'text-green-900',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          titleColor: 'text-blue-900',
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
          titleColor: 'text-gray-900',
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`border rounded-lg p-4 ${styles.container} animate-fadeIn`}>
      <div className="flex items-start">
        <div className="shrink-0">
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          <div className="text-sm">
            {message}
          </div>
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
              aria-label="Dismiss"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Validation Summary Component
interface ValidationSummaryProps {
  errors: Record<string, string>;
  onErrorClick: (errorKey: string) => void;
}

function ValidationSummary({ errors, onErrorClick }: ValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) return null;

  const getErrorSection = (errorKey: string) => {
    if (errorKey.includes('group') || errorKey === 'name' || errorKey === 'description') {
      return 'Route Group Information';
    } else if (errorKey.includes('outbound')) {
      return 'Outbound Route';
    } else if (errorKey.includes('inbound')) {
      return 'Inbound Route';
    }
    return 'General';
  };

  const groupedErrors = Object.entries(errors).reduce((acc, [key, message]) => {
    const section = getErrorSection(key);
    if (!acc[section]) acc[section] = [];
    acc[section].push({ key, message });
    return acc;
  }, {} as Record<string, Array<{ key: string; message: string }>>);

  return (
    <Alert
      type="error"
      title={`Please fix ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} before proceeding`}
      message=""
      dismissible={false}
      actions={
        <div className="space-y-3">
          {Object.entries(groupedErrors).map(([section, sectionErrors]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-red-900 uppercase tracking-wide mb-2">
                {section}
              </h4>
              <ul className="space-y-1">
                {sectionErrors.map(({ key, message }) => (
                  <li key={key}>
                    <button
                      onClick={() => onErrorClick(key)}
                      className="text-sm text-red-700 hover:text-red-900 hover:underline text-left focus:outline-none focus:underline"
                    >
                      • {message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      }
    />
  );
}

const createEmptyRouteFormData = (direction: 'OUTBOUND' | 'INBOUND'): RouteFormData => ({
  id: undefined,
  name: '',
  nameSinhala: '',
  nameTamil: '',
  description: '',
  direction,
  routeNumber: '',
  roadType: '',
  routeThrough: '',
  routeThroughSinhala: '',
  routeThroughTamil: '',
  startStopId: '',
  startStopName: '',
  endStopId: '',
  endStopName: '',
  distanceKm: 0,
  estimatedDurationMinutes: 0,
  routeStops: []
});

const createEmptyFormData = (): RouteGroupFormData => ({
  name: '',
  nameSinhala: '',
  nameTamil: '',
  description: '',
  outboundRoute: createEmptyRouteFormData('OUTBOUND'),
  inboundRoute: createEmptyRouteFormData('INBOUND')
});

export function RouteForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  onSaveDraft,
  isLoading = false,
  isSavingDraft = false,
  error = null,
  validationErrors = {},
  onErrorChange,
  onValidationErrorsChange
}: RouteFormProps) {
  // Form data state
  const [formData, setFormData] = useState<RouteGroupFormData>(createEmptyFormData());
  
  // Available stops for search
  const [availableStops, setAvailableStops] = useState<StopResponse[]>([]);
  const [stopSearchTerm, setStopSearchTerm] = useState('');
  const [isStopSearchOpen, setIsStopSearchOpen] = useState(false);
  const [stopSearchField, setStopSearchField] = useState<'start' | 'end' | 'intermediate' | null>(null);
  const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>('outbound');
  
  // UI state
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Convert RouteGroupResponse to RouteGroupFormData format
      const convertedData: RouteGroupFormData = {
        name: initialData.name || '',
        nameSinhala: initialData.nameSinhala || '',
        nameTamil: initialData.nameTamil || '',
        description: initialData.description || '',
        outboundRoute: createEmptyRouteFormData('OUTBOUND'),
        inboundRoute: createEmptyRouteFormData('INBOUND')
      };

      // Convert routes data if available
      if (initialData.routes) {
        initialData.routes.forEach(route => {
          // Sort route stops by stopOrder to ensure correct sequence
          const sortedRouteStops = route.routeStops ? 
            [...route.routeStops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0)) : [];

          // Filter out start and end stops from intermediate stops and maintain order
          const intermediateStops = sortedRouteStops
            .filter(stop => 
              stop.stopId !== route.startStopId && 
              stop.stopId !== route.endStopId &&
              stop.stopOrder !== 0 && // Exclude start stop order
              stop.stopOrder !== Math.max(...sortedRouteStops.map(s => s.stopOrder || 0)) // Exclude end stop order
            )
            .map((stop, index) => ({
              stopId: stop.stopId || '',
              stopName: stop.stopName || '',
              stopOrder: index + 1, // Reorder for intermediate stops (1, 2, 3...)
              distanceFromStartKm: stop.distanceFromStartKm || 0,
              location: stop.location ? {
                latitude: stop.location.latitude ?? 0,
                longitude: stop.location.longitude ?? 0,
                address: stop.location.address ?? '',
                city: stop.location.city ?? '',
                state: stop.location.state ?? '',
                zipCode: stop.location.zipCode ?? ''
              } : undefined
            }));

          const routeData: RouteFormData = {
            id: route.id,
            name: route.name || '',
            nameSinhala: route.nameSinhala || '',
            nameTamil: route.nameTamil || '',
            description: route.description || '',
            direction: route.direction as 'OUTBOUND' | 'INBOUND',
            routeNumber: route.routeNumber || '',
            roadType: route.roadType || '',
            routeThrough: route.routeThrough || '',
            routeThroughSinhala: route.routeThroughSinhala || '',
            routeThroughTamil: route.routeThroughTamil || '',
            startStopId: route.startStopId || '',
            startStopName: route.startStopName || '',
            endStopId: route.endStopId || '',
            endStopName: route.endStopName || '',
            distanceKm: route.distanceKm || 0,
            estimatedDurationMinutes: route.estimatedDurationMinutes || 0,
            routeStops: intermediateStops
          };

          if (route.direction === 'OUTBOUND') {
            convertedData.outboundRoute = routeData;
          } else {
            convertedData.inboundRoute = routeData;
          }
        });
      }

      setFormData(convertedData);
    } else {
      // Create mode or no initial data
      setFormData(createEmptyFormData());
      
      // Load draft for create mode
      const savedDraft = localStorage.getItem('routeGroupDraft');
      if (savedDraft && mode === 'create') {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData(draftData);
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
  }, [mode, initialData]);

  // Auto-fill route names when group name changes
  useEffect(() => {
    if (formData.name) {
      setFormData(prev => ({
        ...prev,
        outboundRoute: {
          ...prev.outboundRoute,
          name: `${formData.name}-Outbound`
        },
        inboundRoute: {
          ...prev.inboundRoute,
          name: `${formData.name}-Inbound`
        }
      }));
    }
  }, [formData.name]);

  // Load available stops
  const loadAvailableStops = useCallback(async () => {
    try {
      const stops = await BusStopManagementService.getAllStopsAsList();
      setAvailableStops(stops);
    } catch (error) {
      console.error('Error loading stops:', error);
    }
  }, []);

  useEffect(() => {
    loadAvailableStops();
  }, [loadAvailableStops]);

  // Filter stops based on search term
  const filteredStops = availableStops.filter(stop =>
    stop.name?.toLowerCase().includes(stopSearchTerm.toLowerCase()) ||
    stop.location?.city?.toLowerCase().includes(stopSearchTerm.toLowerCase()) ||
    stop.location?.state?.toLowerCase().includes(stopSearchTerm.toLowerCase())
  );

  // Enhanced validation with real-time feedback
  const validateForm = (showErrors = false): boolean => {
    const errors: Record<string, string> = {};

    // Group name validation
    if (!formData.name.trim()) {
      errors.groupName = 'Route group name is required';
    } else if (formData.name.trim().length < 3) {
      errors.groupName = 'Route group name must be at least 3 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.groupName = 'Route group name must be less than 100 characters';
    }

    // Outbound route validation
    if (!formData.outboundRoute.name.trim()) {
      errors.outboundName = 'Outbound route name is required';
    }
    if (!formData.outboundRoute.startStopId) {
      errors.outboundStart = 'Outbound start stop is required';
    }
    if (!formData.outboundRoute.endStopId) {
      errors.outboundEnd = 'Outbound end stop is required';
    }
    if (formData.outboundRoute.startStopId && formData.outboundRoute.endStopId && 
        formData.outboundRoute.startStopId === formData.outboundRoute.endStopId) {
      errors.outboundStops = 'Outbound start and end stops must be different';
    }
    if (formData.outboundRoute.distanceKm <= 0) {
      errors.outboundDistance = 'Outbound distance must be greater than 0';
    }
    if (formData.outboundRoute.estimatedDurationMinutes <= 0) {
      errors.outboundDuration = 'Outbound duration must be greater than 0';
    }

    // Inbound route validation
    if (!formData.inboundRoute.name.trim()) {
      errors.inboundName = 'Inbound route name is required';
    }
    if (!formData.inboundRoute.startStopId) {
      errors.inboundStart = 'Inbound start stop is required';
    }
    if (!formData.inboundRoute.endStopId) {
      errors.inboundEnd = 'Inbound end stop is required';
    }
    if (formData.inboundRoute.startStopId && formData.inboundRoute.endStopId && 
        formData.inboundRoute.startStopId === formData.inboundRoute.endStopId) {
      errors.inboundStops = 'Inbound start and end stops must be different';
    }
    if (formData.inboundRoute.distanceKm <= 0) {
      errors.inboundDistance = 'Inbound distance must be greater than 0';
    }
    if (formData.inboundRoute.estimatedDurationMinutes <= 0) {
      errors.inboundDuration = 'Inbound duration must be greater than 0';
    }

    // Intermediate stops validation
    formData.outboundRoute.routeStops.forEach((stop, index) => {
      if (stop.distanceFromStartKm < 0) {
        errors[`outboundStop${index}Distance`] = `Outbound stop ${index + 1}: Distance cannot be negative`;
      }
      if (stop.distanceFromStartKm >= formData.outboundRoute.distanceKm) {
        errors[`outboundStop${index}Distance`] = `Outbound stop ${index + 1}: Distance must be less than total route distance`;
      }
    });

    formData.inboundRoute.routeStops.forEach((stop, index) => {
      if (stop.distanceFromStartKm < 0) {
        errors[`inboundStop${index}Distance`] = `Inbound stop ${index + 1}: Distance cannot be negative`;
      }
      if (stop.distanceFromStartKm >= formData.inboundRoute.distanceKm) {
        errors[`inboundStop${index}Distance`] = `Inbound stop ${index + 1}: Distance must be less than total route distance`;
      }
    });

    if (showErrors || attemptedSubmit) {
      onValidationErrorsChange?.(errors);
      setShowValidationSummary(Object.keys(errors).length > 0);
    }

    return Object.keys(errors).length === 0;
  };

  // Real-time validation
  useEffect(() => {
    if (attemptedSubmit) {
      validateForm(true);
    }
  }, [formData, attemptedSubmit]);

  // Handle error navigation
  const handleErrorClick = (errorKey: string) => {
    // Navigate to the relevant section
    if (errorKey.includes('outbound')) {
      setActiveTab('outbound');
    } else if (errorKey.includes('inbound')) {
      setActiveTab('inbound');
    }
    
    // Scroll to top to show the relevant section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handlers
  const handleGroupInfoChange = (field: keyof Pick<RouteGroupFormData, 'name' | 'description'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific validation error when user starts typing
    if (attemptedSubmit) {
      const errorKey = field === 'name' ? 'groupName' : field;
      if (validationErrors[errorKey]) {
        const newErrors = { ...validationErrors };
        delete newErrors[errorKey];
        onValidationErrorsChange?.(newErrors);
      }
    }
  };

  const handleRouteChange = (
    route: 'outboundRoute' | 'inboundRoute',
    field: keyof RouteFormData,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [route]: {
        ...prev[route],
        [field]: value
      }
    }));
  };

  const handleStopSelect = (stop: StopResponse) => {
    const currentRoute = activeTab === 'outbound' ? 'outboundRoute' : 'inboundRoute';
    
    if (stopSearchField === 'start') {
      handleRouteChange(currentRoute, 'startStopId', stop.id || '');
      handleRouteChange(currentRoute, 'startStopName', stop.name || '');
    } else if (stopSearchField === 'end') {
      handleRouteChange(currentRoute, 'endStopId', stop.id || '');
      handleRouteChange(currentRoute, 'endStopName', stop.name || '');
    } else if (stopSearchField === 'intermediate') {
      const existingStops = formData[currentRoute].routeStops;
      const suggestedDistance = existingStops.length > 0 
        ? Math.max(...existingStops.map(s => s.distanceFromStartKm)) + 5
        : formData[currentRoute].distanceKm * 0.3;

      const newStop: RouteStop = {
        stopId: stop.id || '',
        stopName: stop.name || '',
        stopOrder: formData[currentRoute].routeStops.length + 1,
        distanceFromStartKm: Math.round(suggestedDistance * 10) / 10,
        location: stop.location ? {
          latitude: stop.location.latitude ?? 0,
          longitude: stop.location.longitude ?? 0,
          address: stop.location.address ?? '',
          city: stop.location.city ?? '',
          state: stop.location.state ?? '',
          zipCode: stop.location.zipCode ?? ''
        } : undefined
      };
      
      handleRouteChange(currentRoute, 'routeStops', [
        ...formData[currentRoute].routeStops,
        newStop
      ]);
    }
    
    setIsStopSearchOpen(false);
    setStopSearchField(null);
    setStopSearchTerm('');
  };

  const handleRemoveIntermediateStop = (stopIndex: number) => {
    const currentRoute = activeTab === 'outbound' ? 'outboundRoute' : 'inboundRoute';
    const updatedStops = formData[currentRoute].routeStops.filter((_, index) => index !== stopIndex);
    
    const reorderedStops = updatedStops.map((stop, index) => ({
      ...stop,
      stopOrder: index + 1
    }));
    
    handleRouteChange(currentRoute, 'routeStops', reorderedStops);
  };

  const handleAutoGenerateInbound = () => {
    const outbound = formData.outboundRoute;
    
    const completeOutboundStops = [
      {
        stopId: outbound.startStopId,
        stopName: outbound.startStopName,
        stopOrder: 0,
        distanceFromStartKm: 0
      },
      ...outbound.routeStops,
      {
        stopId: outbound.endStopId,
        stopName: outbound.endStopName,
        stopOrder: outbound.routeStops.length + 1,
        distanceFromStartKm: outbound.distanceKm
      }
    ];
    
    const reversedStops = [...completeOutboundStops].reverse();
    const inboundIntermediateStops = reversedStops.slice(1, -1).map((stop, index) => ({
      ...stop,
      stopOrder: index + 1,
      distanceFromStartKm: Math.round((outbound.distanceKm - stop.distanceFromStartKm) * 10) / 10
    }));
    
    setFormData(prev => ({
      ...prev,
      inboundRoute: {
        ...prev.inboundRoute,
        name: `${formData.name}-Inbound`,
        description: `Auto-generated reverse route of ${outbound.name}`,
        startStopId: outbound.endStopId,
        startStopName: outbound.endStopName,
        endStopId: outbound.startStopId,
        endStopName: outbound.startStopName,
        distanceKm: outbound.distanceKm,
        estimatedDurationMinutes: outbound.estimatedDurationMinutes,
        routeStops: inboundIntermediateStops
      }
    }));
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    
    if (!validateForm(true)) {
      setShowValidationSummary(true);
      // Scroll to top to show validation summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      await onSubmit(formData);
      
      if (mode === 'create') {
        localStorage.removeItem('routeGroupDraft');
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Enhanced error handling with specific error types
      if (error?.status === 409) {
        if (error?.body?.message?.includes('name already exists')) {
          onErrorChange?.('A route group with this name already exists. Please choose a different name.');
        } else {
          onErrorChange?.('There was a conflict with your request. Please check your data and try again.');
        }
      } else if (error?.status === 400) {
        onErrorChange?.('The provided data is invalid. Please check all fields and try again.');
      } else if (error?.status === 404) {
        onErrorChange?.('The route group was not found. It may have been deleted by another user.');
      } else if (error?.status === 500) {
        onErrorChange?.('A server error occurred. Please try again later or contact support if the problem persists.');
      } else if (error?.message) {
        onErrorChange?.(error.message);
      } else {
        onErrorChange?.('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleSaveDraft = async () => {
    if (onSaveDraft) {
      try {
        await onSaveDraft(formData);
        
        if (mode === 'create') {
          const draftData = {
            ...formData,
            lastSaved: new Date().toISOString(),
            isDraft: true
          };
          localStorage.setItem('routeGroupDraft', JSON.stringify(draftData));
        }
        
        onErrorChange?.('Draft saved successfully!');
        setTimeout(() => onErrorChange?.(null), 3000);
      } catch (error) {
        console.error('Error saving draft:', error);
        onErrorChange?.('Failed to save draft. Please try again.');
      }
    }
  };

  // Determine if form has errors
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const errorType = error?.includes('successfully') ? 'success' : 'error';

  return (
    <div className="space-y-6">
      {/* Main Error/Success Alert */}
      {error && (
        <Alert
          type={errorType}
          title={errorType === 'success' ? 'Success' : 'Error'}
          message={error}
          onDismiss={() => onErrorChange?.(null)}
        />
      )}

      {/* Validation Summary */}
      {showValidationSummary && hasValidationErrors && attemptedSubmit && (
        <ValidationSummary
          errors={validationErrors}
          onErrorClick={handleErrorClick}
        />
      )}

      {/* Draft Loading Notice */}
      {mode === 'create' && (
        <Alert
          type="info"
          title="Auto-save Enabled"
          message="Your progress is automatically saved as you work. You can safely return to this form later."
          dismissible={false}
        />
      )}

      {/* Route Group Info Section */}
      <RouteGroupInfo
        formData={formData}
        validationErrors={validationErrors}
        onChange={handleGroupInfoChange}
      />

      {/* Routes Tabs Section */}
      <RouteTabsContainer
        formData={formData}
        activeTab={activeTab}
        validationErrors={validationErrors}
        availableStops={filteredStops}
        isStopSearchOpen={isStopSearchOpen}
        stopSearchTerm={stopSearchTerm}
        stopSearchField={stopSearchField}
        onActiveTabChange={setActiveTab}
        onRouteChange={handleRouteChange}
        onStopSearchOpen={(field) => {
          setStopSearchField(field);
          setIsStopSearchOpen(true);
        }}
        onStopSearchClose={() => {
          setIsStopSearchOpen(false);
          setStopSearchField(null);
          setStopSearchTerm('');
        }}
        onStopSearchTermChange={setStopSearchTerm}
        onStopSelect={handleStopSelect}
        onRemoveIntermediateStop={handleRemoveIntermediateStop}
        onAutoGenerateInbound={handleAutoGenerateInbound}
      />

      {/* Map Preview Section */}
      <MapPreviewPlaceholder formData={formData} />

      {/* Form Status */}
      {attemptedSubmit && !hasValidationErrors && (
        <Alert
          type="success"
          title="Form Valid"
          message="All required fields are completed correctly. Ready to submit!"
          dismissible={false}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          disabled={isLoading || isSavingDraft}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        
        {onSaveDraft && (
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </button>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || isSavingDraft}
          className={`px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            hasValidationErrors && attemptedSubmit
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </div>
          ) : (
            <>
              {hasValidationErrors && attemptedSubmit
                ? `Fix ${Object.keys(validationErrors).length} Error${Object.keys(validationErrors).length !== 1 ? 's' : ''} & ${mode === 'create' ? 'Create' : 'Update'}`
                : mode === 'create' ? 'Create Route Group' : 'Update Route Group'
              }
            </>
          )}
        </button>
      </div>
    </div>
  );
}