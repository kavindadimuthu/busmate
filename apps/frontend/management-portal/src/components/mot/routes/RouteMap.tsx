'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { AlertCircle, RotateCcw, Maximize2, ExternalLink, Maximize } from 'lucide-react';
import type { RouteResponse, LocationDto } from '../../../../generated/api-clients/route-management';
import { RouteMapFullscreen } from './RouteMapFullscreen';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface RouteMapProps {
  route: RouteResponse;
  className?: string;
}

interface RouteStop {
  stopId?: string;
  stopName?: string;
  location?: LocationDto;
  distanceFromStartKm?: number;
  stopOrder?: number;
}

// Declare global google maps types
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export function RouteMap({ route, className = "" }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  
  // Use centralized Google Maps loader
  const { isLoaded, loadError } = useGoogleMaps();
  const mapError = loadError ? 'Failed to load Google Maps' : null;
  const isLoading = !isLoaded;

  // Process route stops and add start/end stops
  const getOrderedStops = useCallback((): RouteStop[] => {
    const stops: RouteStop[] = [];
    
    // Add start stop (only if coordinates are valid)
    if (route.startStopName && route.startStopLocation && 
        typeof route.startStopLocation.latitude === 'number' && 
        typeof route.startStopLocation.longitude === 'number') {
      stops.push({
        stopName: route.startStopName,
        location: route.startStopLocation,
        distanceFromStartKm: 0,
        stopOrder: 0
      });
    }

    // Add intermediate stops (sorted by stopOrder, only with valid coordinates)
    if (route.routeStops && route.routeStops.length > 0) {
      const sortedStops = [...route.routeStops]
        .filter(stop => 
          stop.location?.latitude != null && 
          stop.location?.longitude != null &&
          typeof stop.location.latitude === 'number' &&
          typeof stop.location.longitude === 'number'
        )
        .sort((a, b) => (a.stopOrder || 0) - (b.stopOrder || 0));
      
      stops.push(...sortedStops);
    }

    // Add end stop if it's different from start and not already in routeStops (only if coordinates are valid)
    if (route.endStopName && route.endStopLocation && 
        typeof route.endStopLocation.latitude === 'number' && 
        typeof route.endStopLocation.longitude === 'number' &&
        route.endStopName !== route.startStopName) {
      const endStopExists = stops.some(stop => 
        stop.stopName === route.endStopName ||
        (stop.location?.latitude === route.endStopLocation?.latitude &&
         stop.location?.longitude === route.endStopLocation?.longitude)
      );
      
      if (!endStopExists) {
        stops.push({
          stopName: route.endStopName,
          location: route.endStopLocation,
          distanceFromStartKm: route.distanceKm || 0,
          stopOrder: 999
        });
      }
    }

    return stops.filter(stop => 
      stop.location?.latitude != null && 
      stop.location?.longitude != null &&
      typeof stop.location.latitude === 'number' &&
      typeof stop.location.longitude === 'number'
    );
  }, [route]);

  // Initialize Google Maps when loaded
  useEffect(() => {
    if (!isLoaded || isMapInitialized) return;

    const initializeMap = () => {
      try {
        createMap();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const createRoadBasedRoute = async (map: google.maps.Map, stops: RouteStop[]) => {
      if (!window.google || stops.length < 2) return;

      try {
        // Clear existing polyline
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        const directionsService = new window.google.maps.DirectionsService();
        
        // Create waypoints (excluding start and end)
        const waypoints: google.maps.DirectionsWaypoint[] = [];
        if (stops.length > 2) {
          for (let i = 1; i < stops.length - 1; i++) {
            const stop = stops[i];
            if (stop.location && 
                typeof stop.location.latitude === 'number' && 
                typeof stop.location.longitude === 'number') {
              waypoints.push({
                location: {
                  lat: stop.location.latitude,
                  lng: stop.location.longitude
                },
                stopover: true
              });
            }
          }
        }

        // Get the first and last stops
        const startStop = stops[0];
        const endStop = stops[stops.length - 1];

        if (!startStop?.location || !endStop?.location ||
            typeof startStop.location.latitude !== 'number' ||
            typeof startStop.location.longitude !== 'number' ||
            typeof endStop.location.latitude !== 'number' ||
            typeof endStop.location.longitude !== 'number') {
          console.warn('Invalid start or end stop coordinates');
          return;
        }

        // Determine route color based on direction
        const routeColor = route.direction === 'INBOUND' ? '#7c3aed' : '#2563eb'; // Purple for INBOUND, Blue for OUTBOUND

        // Request directions
        const request: google.maps.DirectionsRequest = {
          origin: {
            lat: startStop.location.latitude,
            lng: startStop.location.longitude
          },
          destination: {
            lat: endStop.location.latitude,
            lng: endStop.location.longitude
          },
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false, // Keep the order of stops as provided
          avoidHighways: false,
          avoidTolls: false
        };

        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Create a DirectionsRenderer to display the route
            const directionsRenderer = new window.google.maps.DirectionsRenderer({
              directions: result,
              map: map,
              suppressMarkers: true, // We already have our custom markers
              polylineOptions: {
                strokeColor: routeColor,
                strokeOpacity: 1.0,
                strokeWeight: 4,
              }
            });

            // Store reference for cleanup
            polylineRef.current = directionsRenderer as any;

          } else {
            console.warn('Directions request failed:', status);
            // Fallback to direct polyline if directions fail
            createFallbackPolyline(map, stops);
          }
        });

      } catch (error) {
        console.error('Error creating road-based route:', error);
        // Fallback to direct polyline
        createFallbackPolyline(map, stops);
      }
    };

    const createFallbackPolyline = (map: google.maps.Map, stops: RouteStop[]) => {
      // Fallback: Create direct polyline path (original behavior)
      const path: google.maps.LatLng[] = [];
      
      stops.forEach(stop => {
        if (stop.location && 
            typeof stop.location.latitude === 'number' && 
            typeof stop.location.longitude === 'number') {
          path.push(new window.google.maps.LatLng(stop.location.latitude, stop.location.longitude));
        }
      });

      if (path.length > 1) {
        // Use different colors for fallback based on direction
        const fallbackColor = route.direction === 'INBOUND' ? '#dc2626' : '#dc2626'; // Red for fallback (both directions)
        
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: fallbackColor,
          strokeOpacity: 1.0,
          strokeWeight: 3,
        });

        polyline.setMap(map);
        polylineRef.current = polyline;
      }
    };

    const createMap = async () => {
      if (!mapRef.current || !window.google) return;

      try {
        const stops = getOrderedStops();
        
        if (stops.length === 0) {
          return;
        }

        // Calculate map center and bounds
        const bounds = new window.google.maps.LatLngBounds();
        stops.forEach(stop => {
          if (stop.location && 
              typeof stop.location.latitude === 'number' && 
              typeof stop.location.longitude === 'number') {
            bounds.extend({
              lat: stop.location.latitude,
              lng: stop.location.longitude
            });
          }
        });

        const center = bounds.getCenter();

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: 13,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
        });

        googleMapRef.current = map;

        // Clear existing markers and polyline
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        // Create markers for each stop
        const path: google.maps.LatLng[] = [];
        
        stops.forEach((stop, index) => {
          if (!stop.location || 
              typeof stop.location.latitude !== 'number' || 
              typeof stop.location.longitude !== 'number') return;

          const position = {
            lat: stop.location.latitude,
            lng: stop.location.longitude
          };

          path.push(new window.google.maps.LatLng(position.lat, position.lng));

          // Determine marker color based on stop type
          let markerColor = '#2563eb'; // Default blue
          if (index === 0) markerColor = '#16a34a'; // Green for start
          else if (index === stops.length - 1) markerColor = '#dc2626'; // Red for end

          // Create custom marker
          const marker = new window.google.maps.Marker({
            position,
            map,
            title: stop.stopName || `Stop ${index + 1}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: markerColor,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          // Create info window for marker
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h4 class="font-semibold text-sm">${stop.stopName || 'Unknown Stop'}</h4>
                <p class="text-xs text-gray-600">Stop ${index + 1} of ${stops.length}</p>
                <p class="text-xs text-gray-600">Distance: ${(stop.distanceFromStartKm || 0).toFixed(1)} km</p>
                <p class="text-xs text-gray-600">Coordinates: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            // Close other info windows
            markersRef.current.forEach(m => {
              if ((m as any).infoWindow) {
                (m as any).infoWindow.close();
              }
            });
            
            infoWindow.open(map, marker);
            (marker as any).infoWindow = infoWindow;
          });

          markersRef.current.push(marker);
        });

        // Create route path using Google Directions API for road-based routing
        if (path.length > 1) {
          await createRoadBasedRoute(map, stops);
        }

        // Fit map to show all stops
        map.fitBounds(bounds);
        
        // Add some padding
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        map.fitBounds(bounds, padding);

        setIsMapInitialized(true);

      } catch (error) {
        console.error('Error creating map:', error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      if (polylineRef.current) {
        // Handle both Polyline and DirectionsRenderer
        if (typeof (polylineRef.current as any).setMap === 'function') {
          (polylineRef.current as any).setMap(null);
        }
        if (typeof (polylineRef.current as any).setDirections === 'function') {
          // It's a DirectionsRenderer
          (polylineRef.current as any).setMap(null);
        }
        polylineRef.current = null;
      }
    };
  }, [isLoaded, route, getOrderedStops, isMapInitialized]);

  // Reset map view
  const resetMapView = useCallback(() => {
    if (googleMapRef.current) {
      const stops = getOrderedStops();
      
      if (stops.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        stops.forEach(stop => {
          if (stop.location && 
              typeof stop.location.latitude === 'number' && 
              typeof stop.location.longitude === 'number') {
            bounds.extend({
              lat: stop.location.latitude,
              lng: stop.location.longitude
            });
          }
        });
        
        googleMapRef.current.fitBounds(bounds);
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        googleMapRef.current.fitBounds(bounds, padding);
      }
    }
  }, [getOrderedStops]);

  // Open in full screen Google Maps with complete route
  const openInFullMaps = useCallback(() => {
    const stops = getOrderedStops();
    if (stops.length >= 2) {
      // Create Google Maps URL with directions for multiple stops
      const firstStop = stops[0];
      const lastStop = stops[stops.length - 1];
      
      if (firstStop.location && lastStop.location) {
        let url = `https://www.google.com/maps/dir/`;
        
        // Add origin
        url += `${firstStop.location.latitude},${firstStop.location.longitude}/`;
        
        // Add waypoints (intermediate stops)
        for (let i = 1; i < stops.length - 1; i++) {
          const stop = stops[i];
          if (stop.location) {
            url += `${stop.location.latitude},${stop.location.longitude}/`;
          }
        }
        
        // Add destination
        url += `${lastStop.location.latitude},${lastStop.location.longitude}`;
        
        // Add additional parameters for driving directions
        url += `/@${firstStop.location.latitude},${firstStop.location.longitude},12z/data=!3m1!4b1!4m2!4m1!3e0`;
        
        window.open(url, '_blank');
      }
    } else if (stops.length === 1 && stops[0].location) {
      // Fallback for single stop
      const { latitude, longitude } = stops[0].location;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
      window.open(url, '_blank');
    }
  }, [getOrderedStops]);

  if (mapError) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Map Error</h3>
        <p className="text-gray-600 mb-4">{mapError}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const stops = getOrderedStops();

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg bg-gray-200 border border-gray-300"
          style={{ minHeight: '720px' }}
        />
        
        {(isLoading || !isMapInitialized) && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading route map...</p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        {isMapInitialized && (
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <button
              onClick={resetMapView}
              className="bg-white shadow-md rounded p-2 hover:bg-gray-50 transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="bg-white shadow-md rounded p-2 hover:bg-gray-50 transition-colors"
              title="View fullscreen"
            >
              <Maximize className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={openInFullMaps}
              className="bg-white shadow-md rounded p-2 hover:bg-gray-50 transition-colors"
              title="Open in Google Maps"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Coordinates overlay */}
        {isMapInitialized && stops.length > 0 && (() => {
          const firstStop = stops[0];
          const lastStop = stops[stops.length - 1];
          
          if (firstStop?.location && 
              typeof firstStop.location.latitude === 'number' && 
              typeof firstStop.location.longitude === 'number' && 
              lastStop?.location && 
              typeof lastStop.location.latitude === 'number' && 
              typeof lastStop.location.longitude === 'number') {
            return (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                Route: {firstStop.location.latitude.toFixed(4)}, {firstStop.location.longitude.toFixed(4)} → {lastStop.location.latitude.toFixed(4)}, {lastStop.location.longitude.toFixed(4)}
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Legend */}
      <div className={`${route.direction === 'INBOUND' ? 'bg-purple-50' : 'bg-blue-50'} rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Legend</div>
          
          <div className={`flex items-center gap-2 text-sm ${route.direction === 'INBOUND' ? 'text-purple-700' : 'text-blue-700'}`}>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Start
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              Stop
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              End
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <RouteMapFullscreen 
        route={route}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </div>
  );
}