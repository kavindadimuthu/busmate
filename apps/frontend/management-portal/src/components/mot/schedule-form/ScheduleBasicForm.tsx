'use client';

import { Route, Info, Calendar } from 'lucide-react';
import { RouteResponse, RouteGroupResponse } from '../../../../generated/api-clients/route-management';
import { ScheduleFormData } from './ScheduleForm';

interface ScheduleBasicFormProps {
  formData: ScheduleFormData;
  onChange: (data: ScheduleFormData) => void;
  routeGroups: RouteGroupResponse[];
  routes: RouteResponse[];
  onRouteGroupChange: (routes: RouteResponse[]) => void;
  validationErrors: Record<string, string>;
  mode: 'create' | 'edit';
}

export function ScheduleBasicForm({
  formData,
  onChange,
  routeGroups,
  routes,
  onRouteGroupChange,
  validationErrors,
  mode
}: ScheduleBasicFormProps) {

  const handleFieldChange = (field: keyof ScheduleFormData, value: any) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  const handleRouteGroupChange = (routeGroupId: string) => {
    const selectedGroup = routeGroups.find(rg => rg.id === routeGroupId);
    if (selectedGroup) {
      onRouteGroupChange(selectedGroup.routes || []);
      // Reset route selection when route group changes
      handleFieldChange('routeId', '');
    }
  };

  // Get current route's route group
  const selectedRoute = routes.find(r => r.id === formData.routeId);
  const selectedRouteGroup = routeGroups.find(rg => 
    rg.routes?.some(r => r.id === formData.routeId)
  );

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${validationErrors.name 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
              placeholder="Enter schedule name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Type *
            </label>
            <select
              value={formData.scheduleType}
              onChange={(e) => handleFieldChange('scheduleType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="REGULAR">Regular Schedule</option>
              <option value="SPECIAL">Special Schedule</option>
            </select>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description for this schedule"
            />
          </div>
        </div>
      </div>

      {/* Route Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Route className="w-5 h-5 mr-2" />
          Route Assignment
          {mode === 'edit' && (
            <span className="ml-2 text-sm text-gray-500 font-normal">
              (Cannot be changed in edit mode)
            </span>
          )}
        </h3>
        
        {mode === 'edit' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Route and route group cannot be changed when editing an existing schedule 
              as they are foundational elements that affect the entire schedule structure.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Group
            </label>
            <select
              value={selectedRouteGroup?.id || ''}
              onChange={(e) => handleRouteGroupChange(e.target.value)}
              disabled={mode === 'edit'}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${mode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            >
              <option value="">Select a route group</option>
              {routeGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.routes?.length || 0} routes)
                </option>
              ))}
            </select>
            {mode === 'edit' && selectedRouteGroup && (
              <p className="mt-1 text-sm text-gray-600">
                Current: {selectedRouteGroup.name}
              </p>
            )}
          </div>

          {/* Route Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route *
            </label>
            <select
              value={formData.routeId}
              onChange={(e) => handleFieldChange('routeId', e.target.value)}
              disabled={mode === 'edit' || routes.length === 0}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${validationErrors.routeId 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
                ${mode === 'edit' || routes.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            >
              <option value="">
                {routes.length === 0 ? 'Select a route group first' : 'Select a route'}
              </option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
            {validationErrors.routeId && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.routeId}</p>
            )}
            {mode === 'edit' && selectedRoute && (
              <p className="mt-1 text-sm text-gray-600">
                Current: {selectedRoute.name}
              </p>
            )}
          </div>

          {/* Selected Route Info */}
          {selectedRoute && (
            <div className="lg:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Selected Route Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Name:</span>
                  <span className="ml-1 text-blue-900">{selectedRoute.name}</span>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Stops:</span>
                  <span className="ml-1 text-blue-900">
                    {selectedRoute.routeStops?.length || 0} stops
                  </span>
                </div>
              </div>
              {selectedRoute.description && (
                <p className="mt-2 text-sm text-blue-800">{selectedRoute.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Period */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Schedule Period
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Effective Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Start Date *
            </label>
            <input
              type="date"
              value={formData.effectiveStartDate}
              onChange={(e) => handleFieldChange('effectiveStartDate', e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${validationErrors.effectiveStartDate 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {validationErrors.effectiveStartDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.effectiveStartDate}</p>
            )}
          </div>

          {/* Effective End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective End Date
            </label>
            <input
              type="date"
              value={formData.effectiveEndDate}
              onChange={(e) => handleFieldChange('effectiveEndDate', e.target.value)}
              min={formData.effectiveStartDate}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${validationErrors.effectiveEndDate 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
                }
              `}
            />
            {validationErrors.effectiveEndDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.effectiveEndDate}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for indefinite period
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Options for Create Mode */}
      {mode === 'create' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateTrips"
                checked={formData.generateTrips}
                onChange={(e) => handleFieldChange('generateTrips', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="generateTrips" className="ml-2 block text-sm text-gray-700">
                Automatically generate trips for the schedule period
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              When enabled, actual trip instances will be created based on the operating days 
              and schedule period. You can manage individual trips later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}