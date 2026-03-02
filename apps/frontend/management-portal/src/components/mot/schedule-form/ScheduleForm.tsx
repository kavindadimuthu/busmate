'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Route, 
  Save, 
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  ScheduleRequest, 
  ScheduleResponse,
  RouteResponse,
  RouteGroupResponse,
  StopResponse,
  RouteManagementService,
  BusStopManagementService 
} from '../../../../generated/api-clients/route-management';
import { ScheduleBasicForm } from './ScheduleBasicForm';
import { ScheduleCalendarForm } from './ScheduleCalendarForm';
import { ScheduleStopsForm } from './ScheduleStopsForm';
import { ScheduleExceptionsForm } from './ScheduleExceptionsForm';

export interface ScheduleFormData {
  name: string;
  description: string;
  routeId: string;
  scheduleType: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: string;
  generateTrips: boolean;
  calendar: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  scheduleStops: Array<{
    id?: string;
    stopId: string;
    stopOrder: number;
    arrivalTime: string;
    departureTime: string;
  }>;
  scheduleExceptions: Array<{
    id?: string;
    exceptionDate: string;
    exceptionType: 'ADDED' | 'REMOVED';
  }>;
}

interface ScheduleFormProps {
  mode: 'create' | 'edit';
  initialData?: ScheduleResponse;
  onSubmit: (data: ScheduleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ScheduleForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null
}: ScheduleFormProps) {
  // Form data state
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    description: '',
    routeId: '',
    scheduleType: 'REGULAR',
    effectiveStartDate: '',
    effectiveEndDate: '',
    status: 'ACTIVE',
    generateTrips: false,
    calendar: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    scheduleStops: [],
    scheduleExceptions: []
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form sections state
  const [activeSection, setActiveSection] = useState<'basic' | 'calendar' | 'stops' | 'exceptions'>('basic');

  // Reference data
  const [routeGroups, setRouteGroups] = useState<RouteGroupResponse[]>([]);
  const [routes, setRoutes] = useState<RouteResponse[]>([]);
  const [stops, setStops] = useState<StopResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initialize form with existing data in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const calendar = initialData.scheduleCalendars?.[0];
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        routeId: initialData.routeId || '',
        scheduleType: initialData.scheduleType || 'REGULAR',
        effectiveStartDate: initialData.effectiveStartDate || '',
        effectiveEndDate: initialData.effectiveEndDate || '',
        status: initialData.status || 'ACTIVE',
        generateTrips: false, // This is only for creation
        calendar: {
          monday: calendar?.monday || false,
          tuesday: calendar?.tuesday || false,
          wednesday: calendar?.wednesday || false,
          thursday: calendar?.thursday || false,
          friday: calendar?.friday || false,
          saturday: calendar?.saturday || false,
          sunday: calendar?.sunday || false
        },
        scheduleStops: initialData.scheduleStops?.map((stop, index) => ({
          id: stop.id,
          stopId: stop.stopId || '',
          stopOrder: stop.stopOrder || index + 1,
          arrivalTime: stop.arrivalTime || '',
          departureTime: stop.departureTime || ''
        })) || [],
        scheduleExceptions: initialData.scheduleExceptions?.map((exception) => ({
          id: exception.id,
          exceptionDate: exception.exceptionDate || '',
          exceptionType: (exception.exceptionType as 'ADDED' | 'REMOVED') || 'REMOVED'
        })) || []
      });
    }
  }, [mode, initialData]);

  // Load reference data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [routeGroupsData, stopsData] = await Promise.all([
          RouteManagementService.getAllRouteGroupsAsList(),
          BusStopManagementService.getAllStopsAsList()
        ]);
        setRouteGroups(routeGroupsData);
        setStops(stopsData);
      } catch (error) {
        console.error('Error loading reference data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Load routes for edit mode when route groups are loaded
  useEffect(() => {
    if (mode === 'edit' && initialData?.routeId && routeGroups.length > 0) {
      // Find the route group that contains the initial route
      const routeGroup = routeGroups.find(rg => 
        rg.routes?.some(r => r.id === initialData.routeId)
      );
      if (routeGroup && routeGroup.routes) {
        setRoutes(routeGroup.routes);
      }
    }
  }, [mode, initialData?.routeId, routeGroups]);

  // Load routes when route group changes (for create mode)
  useEffect(() => {
    if (mode === 'create') {
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      if (selectedRoute) {
        const routeGroup = routeGroups.find(rg => 
          rg.routes?.some(r => r.id === selectedRoute.id)
        );
        if (routeGroup) {
          setRoutes(routeGroup.routes || []);
        }
      }
    }
  }, [mode, formData.routeId, routeGroups, routes]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Schedule name is required';
    }

    if (!formData.routeId) {
      errors.routeId = 'Route selection is required';
    }

    if (!formData.effectiveStartDate) {
      errors.effectiveStartDate = 'Effective start date is required';
    }

    if (formData.effectiveEndDate && formData.effectiveStartDate) {
      const startDate = new Date(formData.effectiveStartDate);
      const endDate = new Date(formData.effectiveEndDate);
      if (endDate <= startDate) {
        errors.effectiveEndDate = 'End date must be after start date';
      }
    }

    // Validate at least one operating day is selected
    const hasOperatingDay = Object.values(formData.calendar).some(day => day);
    if (!hasOperatingDay) {
      errors.calendar = 'At least one operating day must be selected';
    }

    // Validate schedule stops
    if (formData.scheduleStops.length === 0) {
      errors.scheduleStops = 'At least one schedule stop is required';
    } else {
      // Check for duplicate stops
      const stopIds = formData.scheduleStops.map(s => s.stopId);
      const duplicates = stopIds.filter((id, index) => stopIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.scheduleStops = 'Duplicate stops are not allowed';
      }

      // Get the selected route to determine stop order
      const selectedRoute = routes.find(r => r.id === formData.routeId);
      const routeStops = selectedRoute?.routeStops || [];
      
      // Helper to determine stop type based on position
      const getStopType = (routeStopIndex: number, totalStops: number) => {
        if (totalStops === 1) return 'single'; // Edge case: only one stop
        if (routeStopIndex === 0) return 'first'; // Origin stop
        if (routeStopIndex === totalStops - 1) return 'last'; // Destination stop
        return 'intermediate'; // Middle stops
      };

      // Validate timing based on stop type
      formData.scheduleStops.forEach((stop, scheduleStopIndex) => {
        // Find the route stop index for this schedule stop
        const routeStopIndex = routeStops.findIndex(rs => rs.stopId === stop.stopId);
        
        if (routeStopIndex >= 0) {
          const stopType = getStopType(routeStopIndex, routeStops.length);
          
          // Validate based on stop type
          if (stopType === 'first' || stopType === 'single') {
            // First stop: only departure time required
            if (!stop.departureTime) {
              errors[`stop_${scheduleStopIndex}_departure`] = 'Departure time is required for origin stop';
            }
          } else if (stopType === 'last') {
            // Last stop: only arrival time required
            if (!stop.arrivalTime) {
              errors[`stop_${scheduleStopIndex}_arrival`] = 'Arrival time is required for destination stop';
            }
          }
          // Intermediate stops: timings are optional
          
          // Validate departure after arrival for stops that have both times
          if (stop.arrivalTime && stop.departureTime) {
            const arrival = new Date(`1970-01-01T${stop.arrivalTime}`);
            const departure = new Date(`1970-01-01T${stop.departureTime}`);
            if (departure < arrival) {
              errors[`stop_${scheduleStopIndex}_departure`] = 'Departure must be equal to or after arrival';
            }
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Format time values to include seconds (HH:mm:ss) as required by backend
      const formatTimeForBackend = (timeString: string) => {
        if (!timeString) return timeString;
        // If time is in HH:mm format, append :00 for seconds
        if (timeString.length === 5 && timeString.includes(':')) {
          return `${timeString}:00`;
        }
        return timeString;
      };

      await onSubmit({
        name: formData.name,
        description: formData.description,
        routeId: formData.routeId,
        scheduleType: formData.scheduleType,
        effectiveStartDate: formData.effectiveStartDate,
        effectiveEndDate: formData.effectiveEndDate || undefined,
        status: formData.status,
        calendar: formData.calendar,
        scheduleStops: formData.scheduleStops.map(stop => ({
          stopId: stop.stopId,
          stopOrder: stop.stopOrder,
          arrivalTime: formatTimeForBackend(stop.arrivalTime),
          departureTime: formatTimeForBackend(stop.departureTime)
        })),
        exceptions: formData.scheduleExceptions.map(exception => ({
          exceptionDate: exception.exceptionDate,
          exceptionType: exception.exceptionType
        }))
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };  const sections = [
    { id: 'basic', label: 'Basic Information', icon: Info },
    { id: 'calendar', label: 'Operating Schedule', icon: Calendar },
    { id: 'stops', label: 'Route Stops', icon: MapPin },
    { id: 'exceptions', label: 'Schedule Exceptions', icon: AlertCircle }
  ];

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Error Display */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Section Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const hasErrors = Object.keys(validationErrors).some(key => 
                key.startsWith(section.id) || 
                (section.id === 'basic' && ['name', 'routeId', 'effectiveStartDate', 'effectiveEndDate'].includes(key)) ||
                (section.id === 'calendar' && key === 'calendar') ||
                (section.id === 'stops' && (key === 'scheduleStops' || key.startsWith('stop_'))) ||
                (section.id === 'exceptions' && (key === 'scheduleExceptions' || key.startsWith('exception_')))
              );

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`
                    flex items-center px-1 py-2 border-b-2 font-medium text-sm transition-colors
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : hasErrors
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {section.label}
                  {hasErrors && (
                    <AlertCircle className="w-4 h-4 ml-2 text-red-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6">
          {activeSection === 'basic' && (
            <ScheduleBasicForm
              formData={formData}
              onChange={setFormData}
              routeGroups={routeGroups}
              routes={routes}
              onRouteGroupChange={setRoutes}
              validationErrors={validationErrors}
              mode={mode}
            />
          )}

          {activeSection === 'calendar' && (
            <ScheduleCalendarForm
              formData={formData}
              onChange={setFormData}
              validationErrors={validationErrors}
            />
          )}

          {activeSection === 'stops' && (
            <ScheduleStopsForm
              formData={formData}
              onChange={setFormData}
              selectedRoute={routes.find(r => r.id === formData.routeId) || null}
              validationErrors={validationErrors}
            />
          )}

          {activeSection === 'exceptions' && (
            <ScheduleExceptionsForm
              formData={formData}
              onChange={setFormData}
              validationErrors={validationErrors}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {Object.keys(validationErrors).length > 0 && (
                <span className="text-red-600">
                  {(() => {
                  console.log('Validation errors:', validationErrors);
                  return `Please fix ${Object.keys(validationErrors).length} error(s) before saving`;
                  })()}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}