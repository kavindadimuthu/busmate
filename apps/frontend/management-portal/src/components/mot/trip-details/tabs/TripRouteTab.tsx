'use client';

import React, { useState } from 'react';
import { 
  Map, 
  MapPin, 
  Route as RouteIcon, 
  Clock, 
  Ruler,
  Navigation,
  ExternalLink
} from 'lucide-react';
import type { TripResponse } from '../../../../../generated/api-clients/route-management/models/TripResponse';
import type { RouteResponse } from '../../../../../generated/api-clients/route-management/models/RouteResponse';

interface TripRouteTabProps {
  trip: TripResponse;
  route?: RouteResponse | null;
}

export function TripRouteTab({ trip, route }: TripRouteTabProps) {
  const [viewMode, setViewMode] = useState<'info' | 'map'>('info');

  // Helper function to format distance
  const formatDistance = (km?: number) => {
    if (!km) return 'N/A';
    return `${km.toFixed(1)} km`;
  };

  // Helper function to format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Helper function to get ordered stops
  const getOrderedStops = () => {
    if (!route?.routeStops) return [];
    
    const stops = [...route.routeStops];
    
    // Sort by stopOrder
    stops.sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
    
    return stops;
  };

  const orderedStops = getOrderedStops();

  if (!route) {
    return (
      <div className="text-center py-12">
        <RouteIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Route Information</h3>
        <p className="text-gray-500">
          Route details are not available for this trip.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
          <p className="mt-1 text-sm text-gray-500">
            Detailed route information for {route.name || 'this route'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('info')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'info'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Route Info
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {viewMode === 'info' ? (
        <>
          {/* Route Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Route Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  <RouteIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Route Name</p>
                  <p className="text-lg font-semibold text-gray-900">{route.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  <Ruler className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Distance</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDistance(route.distanceKm)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDuration(route.estimatedDurationMinutes)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="shrink-0">
                  <Navigation className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Direction</p>
                  <p className="text-lg font-semibold text-gray-900">{route.direction || 'N/A'}</p>
                </div>
              </div>
            </div>

            {route.description && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-gray-700">{route.description}</p>
              </div>
            )}
          </div>

          {/* Start and End Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Point */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Start Point</h4>
                </div>
              </div>
              <div className="ml-11">
                <p className="text-sm font-medium text-gray-900">{route.startStopName || 'N/A'}</p>
                {route.startStopLocation && (
                  <p className="text-xs text-gray-600 mt-1">
                    {route.startStopLocation.latitude?.toFixed(6)}, {route.startStopLocation.longitude?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>

            {/* End Point */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">End Point</h4>
                </div>
              </div>
              <div className="ml-11">
                <p className="text-sm font-medium text-gray-900">{route.endStopName || 'N/A'}</p>
                {route.endStopLocation && (
                  <p className="text-xs text-gray-600 mt-1">
                    {route.endStopLocation.latitude?.toFixed(6)}, {route.endStopLocation.longitude?.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Route Stops */}
          {orderedStops.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Route Stops ({orderedStops.length})</h4>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="max-h-96 overflow-y-auto">
                  {orderedStops.map((stop, index) => (
                    <div key={stop.stopId || index} className="border-b border-gray-200 last:border-b-0">
                      <div className="p-4 flex items-center space-x-4">
                        <div className="shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{stop.stopName || 'Unnamed Stop'}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            {stop.distanceFromStartKm !== undefined && (
                              <span>Distance: {stop.distanceFromStartKm.toFixed(1)} km</span>
                            )}
                            {stop.location && (
                              <span>
                                {stop.location.latitude?.toFixed(4)}, {stop.location.longitude?.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Map View */
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Route Map</h4>
              <button
                onClick={() => {
                  // Open in Google Maps
                  const start = route.startStopLocation;
                  const end = route.endStopLocation;
                  if (start && end) {
                    const url = `https://www.google.com/maps/dir/${start.latitude},${start.longitude}/${end.latitude},${end.longitude}`;
                    window.open(url, '_blank');
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Google Maps
              </button>
            </div>
            
            {/* Map placeholder - you can integrate with Google Maps or other mapping service */}
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Map className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Map</h3>
                <p className="text-gray-500 mb-4">
                  Map integration can be implemented here using Google Maps, OpenStreetMap, or other mapping services.
                </p>
                {route.startStopLocation && route.endStopLocation && (
                  <p className="text-sm text-gray-600">
                    Route from {route.startStopName} to {route.endStopName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}