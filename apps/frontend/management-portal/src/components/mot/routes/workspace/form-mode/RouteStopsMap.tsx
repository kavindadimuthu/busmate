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
import { Button, Badge } from '@busmate/ui';
import { PanelRightClose, PanelRightOpen, MapPin, Loader2 } from 'lucide-react';

interface RouteStopsMapProps {
  onToggle: () => void;
  collapsed: boolean;
  routeIndex: number;
}

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 320px)',
  minHeight: '400px',
  maxHeight: '900px',
  borderRadius: '0.375rem',
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
  // Stores the Google Maps event listener for 'zoom_changed' so it can be
  // explicitly removed on unmount, preventing memory leaks.
  const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);

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

    // Remove any previously registered zoom listener before adding a new one.
    // This guards against handleMapLoad being called multiple times (e.g., if the
    // GoogleMap component re-mounts), which would leak stale listeners.
    if (zoomListenerRef.current) {
      google.maps.event.removeListener(zoomListenerRef.current);
      zoomListenerRef.current = null;
    }

    // Track zoom level changes and store the listener ref for cleanup.
    zoomListenerRef.current = map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom !== undefined) {
        setCurrentZoom(zoom);
      }
    });

    fetchDirections();
  }, [fetchDirections]);

  // Cleanup the zoom listener when the map component unmounts.
  // Without this, the Google Maps event listener persists in memory even after
  // the React component tree is destroyed.
  useEffect(() => {
    return () => {
      if (zoomListenerRef.current) {
        google.maps.event.removeListener(zoomListenerRef.current);
        zoomListenerRef.current = null;
      }
    };
  }, []);

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
    <div className={`flex flex-col border-l border-border ${collapsed ? 'w-12 overflow-hidden' : ''}`}>
      <div className={`flex ${collapsed ? 'flex-col items-center py-3' : 'justify-between items-center px-3 py-2'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-6">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
              <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
            </Button>
            <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs font-medium text-muted-foreground">Route Map</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground/70" />
              <span className="text-sm font-medium text-muted-foreground">Route Map</span>
              {validStops.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {validStops.length} stops
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
              <PanelRightClose className="h-4 w-4 text-muted-foreground" />
            </Button>
          </>
        )}
      </div>
      {!collapsed && (
        <div className="px-2 pb-2 flex-1">
          {coordinateEditingMode?.routeIndex === routeIndex && (
            <div className="mb-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span><strong>Coordinate Editing:</strong> Click on the map to set the stop location.</span>
            </div>
          )}
          {loadError && (
            <div className="text-xs text-destructive mb-2 px-1">Error loading Google Maps</div>
          )}
          {!isLoaded && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading Google Maps...
            </div>
          )}
          {isLoaded && (
            <>
              {validStops.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/70">
                  <MapPin className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">No stops with valid coordinates</p>
                </div>
              )}
              {validStops.length === 1 && (
                <div className="text-xs text-muted-foreground mb-2 px-1">Add more stops with coordinates to show the route.</div>
              )}
              {validStops.length >= 2 && isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading route...
                </div>
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
        </div>
      )}
    </div>
  );
}
