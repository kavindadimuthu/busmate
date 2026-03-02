'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { RouteResponse } from '../../../../generated/api-clients/route-management';
import { ScheduleFormData } from './ScheduleForm';

interface ScheduleStopsFormProps {
  formData: ScheduleFormData;
  onChange: (data: ScheduleFormData) => void;
  selectedRoute: RouteResponse | null;
  validationErrors: Record<string, string>;
}

export function ScheduleStopsForm({
  formData,
  onChange,
  selectedRoute,
  validationErrors
}: ScheduleStopsFormProps) {
  const [stopSearch, setStopSearch] = useState('');

  // Get route stops from selected route
  const routeStops = selectedRoute?.routeStops || [];

  const handleAddStop = () => {
    const newStop = {
      stopId: '',
      stopOrder: formData.scheduleStops.length + 1,
      arrivalTime: '',
      departureTime: ''
    };

    onChange({
      ...formData,
      scheduleStops: [...formData.scheduleStops, newStop]
    });
  };

  const handleRemoveStop = (index: number) => {
    const updatedStops = formData.scheduleStops.filter((_, i) => i !== index);
    // Reorder remaining stops
    const reorderedStops = updatedStops.map((stop, i) => ({
      ...stop,
      stopOrder: i + 1
    }));

    onChange({
      ...formData,
      scheduleStops: reorderedStops
    });
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.scheduleStops.length) return;

    const updatedStops = [...formData.scheduleStops];
    const [movedStop] = updatedStops.splice(index, 1);
    updatedStops.splice(newIndex, 0, movedStop);

    // Reorder all stops
    const reorderedStops = updatedStops.map((stop, i) => ({
      ...stop,
      stopOrder: i + 1
    }));

    onChange({
      ...formData,
      scheduleStops: reorderedStops
    });
  };

  const handleStopChange = (index: number, field: keyof (typeof formData.scheduleStops)[0], value: string | number) => {
    const updatedStops = formData.scheduleStops.map((stop, i) => 
      i === index ? { ...stop, [field]: value } : stop
    );

    onChange({
      ...formData,
      scheduleStops: updatedStops
    });
  };

  const getStopName = (stopId: string) => {
    const routeStop = routeStops.find(rs => rs.stopId === stopId);
    return routeStop?.stopName || 'Unknown Stop';
  };

  const filteredStops = routeStops.filter(routeStop => 
    routeStop.stopName?.toLowerCase().includes(stopSearch.toLowerCase()) ||
    routeStop.stopId?.toLowerCase().includes(stopSearch.toLowerCase())
  );

  // Helper to determine stop type based on position
  const getStopType = (routeStopIndex: number, totalStops: number) => {
    if (totalStops === 1) return 'single'; // Edge case: only one stop
    if (routeStopIndex === 0) return 'first'; // Origin stop
    if (routeStopIndex === totalStops - 1) return 'last'; // Destination stop
    return 'intermediate'; // Middle stops
  };

  const calculateDuration = (arrivalTime: string, departureTime: string) => {
    if (!arrivalTime || !departureTime) return null;
    
    try {
      const arrival = new Date(`1970-01-01T${arrivalTime}`);
      const departure = new Date(`1970-01-01T${departureTime}`);
      const diffMs = departure.getTime() - arrival.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins >= 0) {
        return `${diffMins}m`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getTotalJourneyTime = () => {
    if (routeStops.length < 2) return null;
    
    // Find first stop with departure time and last stop with arrival time
    const sortedRouteStops = [...routeStops].sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
    const firstRouteStop = sortedRouteStops[0];
    const lastRouteStop = sortedRouteStops[sortedRouteStops.length - 1];
    
    const firstScheduleStop = formData.scheduleStops.find(ss => ss.stopId === firstRouteStop.stopId);
    const lastScheduleStop = formData.scheduleStops.find(ss => ss.stopId === lastRouteStop.stopId);
    
    const startTime = firstScheduleStop?.departureTime; // First stop departure
    const endTime = lastScheduleStop?.arrivalTime; // Last stop arrival
    
    if (!startTime || !endTime) return null;
    
    try {
      const start = new Date(`1970-01-01T${startTime}`);
      const end = new Date(`1970-01-01T${endTime}`);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      
      if (diffMins >= 0) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Route Stops & Timing
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Configure timing for route stops: First stop needs departure time only, last stop needs arrival time only.
          Intermediate stops are optional - provide timings only when needed.
        </p>
      </div>

      {/* Route Selection Validation */}
      {!selectedRoute && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Please select a route first to configure stop timings.
            </p>
          </div>
        </div>
      )}

      {/* No Route Stops */}
      {selectedRoute && routeStops.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              The selected route has no stops configured. Please configure route stops first.
            </p>
          </div>
        </div>
      )}

      {/* Route Stops List */}
      {selectedRoute && routeStops.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Route: <span className="font-medium">{selectedRoute.name}</span>
              <span className="ml-2">• {routeStops.length} stops</span>
              {getTotalJourneyTime() && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Total journey: {getTotalJourneyTime()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                // Auto-fill all route stops with empty times based on stop type
                const allStops = routeStops
                  .filter(routeStop => routeStop.stopId && routeStop.stopOrder !== undefined)
                  .map((routeStop, index) => {
                    const stopType = getStopType(index, routeStops.length);
                    return {
                      stopId: routeStop.stopId!,
                      stopOrder: routeStop.stopOrder!,
                      // First stop: no arrival time, last stop: no departure time
                      arrivalTime: stopType === 'first' ? '' : '',
                      departureTime: stopType === 'last' ? '' : ''
                    };
                  });
                onChange({
                  ...formData,
                  scheduleStops: allStops
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Add All Stops
            </button>
          </div>

          {/* Validation Error */}
          {validationErrors.scheduleStops && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{validationErrors.scheduleStops}</p>
              </div>
            </div>
          )}

          {/* Route Stops with Timing */}
          <div className="space-y-3">
            {routeStops.map((routeStop, index) => {
              const scheduleStop = formData.scheduleStops.find(ss => ss.stopId === routeStop.stopId);
              const stopError = validationErrors[`stop_${index}_arrival`] || 
                               validationErrors[`stop_${index}_departure`];
              
              // Determine stop type for timing requirements
              const stopType = getStopType(index, routeStops.length);
              const isFirstStop = stopType === 'first' || stopType === 'single';
              const isLastStop = stopType === 'last' || stopType === 'single';
              const isIntermediateStop = stopType === 'intermediate';
              
              return (
                <div
                  key={routeStop.stopId}
                  className={`border rounded-lg p-4 ${stopError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Stop Order */}
                    <div className="shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isFirstStop ? 'bg-green-600 text-white' : 
                        isLastStop ? 'bg-red-600 text-white' : 
                        'bg-blue-600 text-white'
                      }`}>
                        {routeStop.stopOrder}
                      </div>
                    </div>

                    {/* Stop Info */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{routeStop.stopName}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isFirstStop ? 'bg-green-100 text-green-800' : 
                            isLastStop ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {isFirstStop ? 'Origin' : isLastStop ? 'Destination' : 'Stop'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Distance: {routeStop.distanceFromStartKm?.toFixed(1) || '0.0'} km
                        </p>
                      </div>

                      {/* Timing Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Arrival Time - Hidden for first stop */}
                        {!isFirstStop && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Arrival Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={scheduleStop?.arrivalTime || ''}
                              onChange={(e) => {
                                const existingIndex = formData.scheduleStops.findIndex(ss => ss.stopId === routeStop.stopId);
                                if (existingIndex >= 0) {
                                  handleStopChange(existingIndex, 'arrivalTime', e.target.value);
                                } else if (routeStop.stopId && routeStop.stopOrder !== undefined) {
                                  // Add new schedule stop
                                  const newScheduleStop = {
                                    stopId: routeStop.stopId,
                                    stopOrder: routeStop.stopOrder,
                                    arrivalTime: e.target.value,
                                    departureTime: scheduleStop?.departureTime || ''
                                  };
                                  onChange({
                                    ...formData,
                                    scheduleStops: [...formData.scheduleStops, newScheduleStop]
                                  });
                                }
                              }}
                              className={`
                                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${validationErrors[`stop_${index}_arrival`] 
                                  ? 'border-red-300 focus:border-red-500' 
                                  : 'border-gray-300 focus:border-blue-500'
                                }
                              `}
                            />
                            {validationErrors[`stop_${index}_arrival`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`stop_${index}_arrival`]}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Departure Time - Hidden for last stop */}
                        {!isLastStop && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Departure Time <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="time"
                              value={scheduleStop?.departureTime || ''}
                              onChange={(e) => {
                                const existingIndex = formData.scheduleStops.findIndex(ss => ss.stopId === routeStop.stopId);
                                if (existingIndex >= 0) {
                                  handleStopChange(existingIndex, 'departureTime', e.target.value);
                                } else if (routeStop.stopId && routeStop.stopOrder !== undefined) {
                                  // Add new schedule stop
                                  const newScheduleStop = {
                                    stopId: routeStop.stopId,
                                    stopOrder: routeStop.stopOrder,
                                    arrivalTime: scheduleStop?.arrivalTime || '',
                                    departureTime: e.target.value
                                  };
                                  onChange({
                                    ...formData,
                                    scheduleStops: [...formData.scheduleStops, newScheduleStop]
                                  });
                                }
                              }}
                              className={`
                                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${validationErrors[`stop_${index}_departure`] 
                                  ? 'border-red-300 focus:border-red-500' 
                                  : 'border-gray-300 focus:border-blue-500'
                                }
                              `}
                            />
                            {validationErrors[`stop_${index}_departure`] && (
                              <p className="mt-1 text-xs text-red-600">
                                {validationErrors[`stop_${index}_departure`]}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Dwell Time - Only for intermediate stops */}
                        {isIntermediateStop && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dwell Time
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                              {calculateDuration(scheduleStop?.arrivalTime || '', scheduleStop?.departureTime || '') || '--'}
                            </div>
                          </div>
                        )}

                        {/* Show timing info for first/last stops */}
                        {(isFirstStop || isLastStop) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {isFirstStop ? 'Journey Start' : 'Journey End'}
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                              {isFirstStop ? (scheduleStop?.departureTime || '--:--') : (scheduleStop?.arrivalTime || '--:--')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0">
                      {scheduleStop && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedStops = formData.scheduleStops.filter(ss => ss.stopId !== routeStop.stopId);
                            onChange({
                              ...formData,
                              scheduleStops: updatedStops
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remove stop timing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Timing Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <span className="font-medium">Origin stop (green):</span> Departure time is required - buses start here</li>
              <li>• <span className="font-medium">Intermediate stops (blue):</span> Timings are optional - add when needed for planning</li>
              <li>• <span className="font-medium">Destination stop (red):</span> Arrival time is required - buses end here</li>
              <li>• When providing both times, departure must be equal to or later than arrival</li>
              <li>• Times should be realistic for passenger boarding/alighting</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}