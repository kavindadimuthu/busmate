'use client';

import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import {
  fetchRouteDirections,
  extractValidStops,
  calculateCenter,
  getMarkerIconUrl,
  getStopType,
  applyDistancesToRouteStops,
  DirectionsChunk,
  RouteDirectionsResult
} from '@/services/routeWorkspaceMap';

interface RouteStopsMapProps {
  onToggle: () => void;
  collapsed: boolean;
  routeIndex: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '750px',
  borderRadius: '0.375rem', // rounded-md
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

export default function RouteStopsMap({ onToggle, collapsed, routeIndex }: RouteStopsMapProps) {
  const { data, coordinateEditingMode, updateRouteStop, updateRoute, selectedRouteIndex, selectedStopIndex, registerMapAction, unregisterMapAction } = useRouteWorkspace();
  const [directionsChunks, setDirectionsChunks] = useState<DirectionsChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchedDistances, setLastFetchedDistances] = useState<Map<number, number> | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(9);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Load Google Maps script
  const { isLoaded, loadError } = useGoogleMaps();

  // Get route stops from context
  const route = data.routeGroup.routes[routeIndex];
  const routeStops = route?.routeStops || [];

  // Extract valid stops using the shared service
  const validStops = useMemo(() => {
    return extractValidStops(routeStops);
  }, [routeStops]);

  // Calculate center using the shared service
  const center = useMemo(() => {
    return calculateCenter(validStops);
  }, [validStops]);

  const getMarkerIcon = (stopIndex: number) => {
    const type = getStopType(stopIndex, validStops.length);
    return getMarkerIconUrl(type);
  };

  // Filter intermediate stops based on zoom level
  const getVisibleStops = useCallback(() => {
    if (validStops.length <= 2) return validStops; // Always show start and end

    // Start and end stops always visible
    const startStop = validStops[0];
    const endStop = validStops[validStops.length - 1];
    const intermediateStops = validStops.slice(1, -1);

    if (intermediateStops.length === 0) return validStops;

    // Determine how many intermediate stops to show based on zoom
    let showEveryNth = 1;
    if (currentZoom < 10) {
      showEveryNth = Math.ceil(intermediateStops.length / 6); // Show ~3 intermediate stops
    } else if (currentZoom < 12) {
      showEveryNth = Math.ceil(intermediateStops.length / 12); // Show ~5 intermediate stops
    } else if (currentZoom < 14) {
      showEveryNth = Math.ceil(intermediateStops.length / 24); // Show ~8 intermediate stops
    } else {
      showEveryNth = 1; // Show all intermediate stops
    }

    // Filter intermediate stops
    const visibleIntermediateStops = intermediateStops.filter((_, idx) => idx % showEveryNth === 0);

    return [startStop, ...visibleIntermediateStops, endStop];
  }, [validStops, currentZoom]);

  // Expose function to fit bounds to all stops
  const fitBoundsToRoute = useCallback(() => {
    if (!mapRef.current || validStops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    validStops.forEach(stop => {
      bounds.extend({ lat: stop.lat, lng: stop.lng });
    });

    mapRef.current.fitBounds(bounds);
  }, [validStops]);

  // Register and unregister the fitBoundsToRoute function
  useEffect(() => {
    registerMapAction('fitBoundsToRoute', fitBoundsToRoute);
    return () => {
      unregisterMapAction('fitBoundsToRoute');
    };
  }, [fitBoundsToRoute, registerMapAction, unregisterMapAction]);

  const fetchDirections = useCallback(async () => {
    if (!isLoaded || validStops.length < 2) {
      setIsLoading(false);
      setDirectionsChunks([]);
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetchRouteDirections(routeStops);
      setDirectionsChunks(result.directionsChunks);
      setLastFetchedDistances(result.distances);
    } catch (error) {
      console.error('Error fetching directions:', error);
      setDirectionsChunks([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, validStops.length, routeStops]);

  // Refetch directions when valid stops change
  useEffect(() => {
    if (!collapsed && isLoaded) {
      fetchDirections();
    }
  }, [validStops, collapsed, isLoaded, fetchDirections]);

  const onMapLoad = useCallback(() => {
    fetchDirections();
  }, [fetchDirections]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    // Only handle clicks when coordinate editing mode is active
    if (coordinateEditingMode && coordinateEditingMode.routeIndex === routeIndex) {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();

      if (lat && lng) {
        const { stopIndex } = coordinateEditingMode;
        const currentStop = routeStops[stopIndex];

        if (currentStop) {
          // Update the stop's coordinates
          updateRouteStop(routeIndex, stopIndex, {
            stop: {
              ...currentStop.stop,
              location: {
                ...currentStop.stop.location,
                latitude: lat,
                longitude: lng
              }
            }
          });
        }
      }
    }
  }, [coordinateEditingMode, routeIndex, routeStops, updateRouteStop]);

  // Store map reference and focus on selected stop when coordinate editing mode is activated
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Track zoom changes
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom !== undefined) {
        setCurrentZoom(zoom);
      }
    });

    fetchDirections();
  }, [fetchDirections]);

  // Focus on the stop when coordinate editing mode is activated
  useEffect(() => {
    if (coordinateEditingMode && coordinateEditingMode.routeIndex === routeIndex && mapRef.current) {
      const stopIndex = coordinateEditingMode.stopIndex;
      const stop = routeStops[stopIndex];

      if (stop?.stop?.location?.latitude && stop?.stop?.location?.longitude) {
        const lat = stop.stop.location.latitude;
        const lng = stop.stop.location.longitude;

        // Pan and zoom to the stop
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }
    }
  }, [coordinateEditingMode, routeIndex, routeStops]);

  // Focus on the stop when it's selected from the list
  useEffect(() => {
    if (selectedRouteIndex === routeIndex && selectedStopIndex !== null && mapRef.current) {
      const stop = routeStops[selectedStopIndex];

      if (stop?.stop?.location?.latitude && stop?.stop?.location?.longitude) {
        const lat = stop.stop.location.latitude;
        const lng = stop.stop.location.longitude;

        // Pan and zoom to the stop
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(14);
      }
    }
  }, [selectedRouteIndex, selectedStopIndex, routeIndex, routeStops]);

  const directionsRendererOptions = {
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 4,
    },
  };

  return (
    <div className={`flex flex-col border-r-3 py-2 border-gray-300 ${collapsed ? 'w-12 overflow-hidden' : ''}`}>
      <div className={`flex ${collapsed ? 'flex-col items-center py-3' : 'justify-between items-center px-3 py-2'}`}>
        {collapsed ? (
          <div className="flex flex-col gap-12">
            <button onClick={onToggle} className="p-1.5 hover:bg-slate-200 rounded transition-colors flex items-center justify-center">
              <img src="/icons/Sidebar-Collapse--Streamline-Iconoir.svg" className="w-4 h-4 opacity-60" alt="Expand" />
            </button>
            <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs font-medium text-slate-600">Route Map</span>
          </div>
        ) : (
          <>
            <span className="text-sm font-medium text-slate-700">Route Stops Map</span>
            <button onClick={onToggle} className="p-1.5 hover:bg-slate-200 rounded transition-colors flex items-center justify-center">
              <img src="/icons/Sidebar-Collapse--Streamline-Iconoir.svg" className="w-4 h-4 rotate-180 opacity-60" alt="Collapse" />
            </button>
          </>
        )}
      </div>
      {!collapsed && (
        <>
          {coordinateEditingMode?.routeIndex === routeIndex && (
            <div className="mx-3 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>Coordinate Editing Mode Active:</strong> Click anywhere on the map to update the stop location.
            </div>
          )}
          {loadError && (
            <div className="text-xs text-rose-600 mb-2 px-3">Error loading Google Maps</div>
          )}
          {!isLoaded && (
            <div className="text-xs text-slate-500 mb-2 px-3">Loading Google Maps...</div>
          )}
          {isLoaded && (
            <>
              {validStops.length === 0 && (
                <div className="text-xs text-slate-500 mb-2 px-3">No stops with valid coordinates to display.</div>
              )}
              {validStops.length === 1 && (
                <div className="text-xs text-slate-500 mb-2 px-3">Add at least one more stop with coordinates to show route.</div>
              )}
              {validStops.length >= 2 && isLoading && (
                <div className="text-xs text-slate-500 mb-2 px-3">Loading route...</div>
              )}
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={validStops.length === 0 ? 8 : 9}
                options={{
                  ...mapOptions,
                  // Change cursor to crosshair when in coordinate editing mode
                  draggableCursor: coordinateEditingMode?.routeIndex === routeIndex ? 'crosshair' : undefined,
                }}
                onLoad={handleMapLoad}
                onClick={onMapClick}
              >
                {directionsChunks.length > 0 && validStops.length >= 2 && (
                  directionsChunks.map((chunk, index) => (
                    <DirectionsRenderer
                      key={`directions-chunk-${index}`}
                      directions={chunk.directions}
                      options={directionsRendererOptions}
                    />
                  ))
                )}
                {getVisibleStops().map((stop, index) => {
                  const isEditingThisStop = coordinateEditingMode?.routeIndex === routeIndex && coordinateEditingMode?.stopIndex === stop.originalIndex;
                  const isSelectedStop = selectedRouteIndex === routeIndex && selectedStopIndex === stop.originalIndex;
                  const stopType = getStopType(index, validStops.length);
                  // Use scaledSize only for start/end markers, not for custom bullet markers
                  const useScaledSize = stopType !== 'intermediate' && (isEditingThisStop || isSelectedStop);

                  return (
                    <Marker
                      key={stop.id}
                      position={{ lat: stop.lat, lng: stop.lng }}
                      title={stop.name}
                      icon={{
                        url: getMarkerIcon(index),
                        // Only apply scaledSize for start/end pins when editing/selected, not for bullet markers
                        scaledSize: useScaledSize ? new google.maps.Size(40, 40) : undefined,
                      }}
                      animation={(isEditingThisStop || isSelectedStop) ? google.maps.Animation.BOUNCE : undefined}
                    />
                  );
                })}
              </GoogleMap>
            </>
          )}
        </>
      )}
    </div>
  );
}
