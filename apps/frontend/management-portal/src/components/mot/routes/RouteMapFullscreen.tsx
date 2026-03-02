'use client';

import { X, RotateCcw, Maximize2, ExternalLink } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import type { RouteResponse, LocationDto } from '../../../../generated/api-clients/route-management';
import { AlertCircle } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface RouteMapFullscreenProps {
  route: RouteResponse;
  isOpen: boolean;
  onClose: () => void;
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

export function RouteMapFullscreen({ route, isOpen, onClose }: RouteMapFullscreenProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
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

  // Initialize Google Maps when modal opens and API is loaded
  useEffect(() => {
    if (!isOpen || !isLoaded || isMapInitialized) return;

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
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: route.direction === 'INBOUND' ? '#8B5CF6' : '#3B82F6',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRenderer.setMap(map);

        const waypoints: google.maps.DirectionsWaypoint[] = [];
        
        if (stops.length > 2) {
          for (let i = 1; i < stops.length - 1; i++) {
            const stop = stops[i];
            if (stop.location?.latitude && stop.location?.longitude) {
              waypoints.push({
                location: { lat: stop.location.latitude, lng: stop.location.longitude },
                stopover: true
              });
            }
          }
        }

        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];

        if (!firstStop?.location || !lastStop?.location) {
          throw new Error('Invalid route endpoints');
        }

        const request: google.maps.DirectionsRequest = {
          origin: { lat: firstStop.location.latitude!, lng: firstStop.location.longitude! },
          destination: { lat: lastStop.location.latitude!, lng: lastStop.location.longitude! },
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
          avoidHighways: false,
          avoidTolls: false
        };

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          });
        });

        directionsRenderer.setDirections(result);
        console.log(`Road-based route created successfully for ${route.direction} route`);

        // Add custom markers for stops
        stops.forEach((stop, index) => {
          if (stop.location?.latitude && stop.location?.longitude) {
            const marker = new window.google.maps.Marker({
              position: { lat: stop.location.latitude, lng: stop.location.longitude },
              map: map,
              title: stop.stopName || `Stop ${index + 1}`,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: index === 0 ? '#10B981' : index === stops.length - 1 ? '#EF4444' : route.direction === 'INBOUND' ? '#8B5CF6' : '#3B82F6',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
                scale: 8
              }
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <div class="font-medium">${stop.stopName || `Stop ${index + 1}`}</div>
                  <div class="text-sm text-gray-600">${(stop.distanceFromStartKm || 0).toFixed(1)} km from start</div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
          }
        });

      } catch (error) {
        console.warn('Failed to create road-based route, using fallback:', error);
        createFallbackPolyline(map, stops);
      }
    };

    const createFallbackPolyline = (map: google.maps.Map, stops: RouteStop[]) => {
      // Fallback: Create direct polyline path
      const path: google.maps.LatLng[] = [];
      
      stops.forEach(stop => {
        if (stop.location?.latitude && stop.location?.longitude) {
          path.push(new window.google.maps.LatLng(stop.location.latitude, stop.location.longitude));
        }
      });

      if (path.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#EF4444', // Red color for fallback
          strokeOpacity: 1.0,
          strokeWeight: 4,
        });

        polylineRef.current = polyline;
        polyline.setMap(map);
      }
    };

    const createMap = async () => {
      if (!mapRef.current || !window.google) return;

      try {
        const stops = getOrderedStops();
        
        if (stops.length === 0) {
          throw new Error('No valid stops found for this route');
        }

        // Calculate center point for initial map view
        let centerLat = 0;
        let centerLng = 0;
        let validStops = 0;

        stops.forEach(stop => {
          if (stop.location?.latitude && stop.location?.longitude) {
            centerLat += stop.location.latitude;
            centerLng += stop.location.longitude;
            validStops++;
          }
        });

        if (validStops === 0) {
          throw new Error('No valid coordinates found');
        }

        centerLat /= validStops;
        centerLng /= validStops;

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          zoomControl: true,
          mapTypeControl: true,
          scaleControl: true,
          streetViewControl: true,
          rotateControl: false,
          fullscreenControl: false
        });

        googleMapRef.current = map;

        // Wait for map to be ready
        await new Promise<void>((resolve) => {
          const listener = map.addListener('tilesloaded', () => {
            window.google.maps.event.removeListener(listener);
            resolve();
          });
        });

        // Clear existing markers and polylines
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        // Create route (try road-based first, fallback to direct lines)
        await createRoadBasedRoute(map, stops);

        // Fit map bounds to show all stops
        if (stops.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          stops.forEach(stop => {
            if (stop.location?.latitude && stop.location?.longitude) {
              bounds.extend({ lat: stop.location.latitude, lng: stop.location.longitude });
            }
          });
          
          const padding = { top: 50, right: 50, bottom: 50, left: 50 };
          map.fitBounds(bounds, padding);
        }

        setIsMapInitialized(true);

      } catch (error) {
        console.error('Error creating map:', error);
      }
    };

    initializeMap();

    // Cleanup when modal closes
    return () => {
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [isOpen, isLoaded, route, getOrderedStops, isMapInitialized]);

  // Reset map view
  const resetMapView = useCallback(() => {
    if (googleMapRef.current) {
      const stops = getOrderedStops();
      
      if (stops.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        stops.forEach(stop => {
          if (stop.location?.latitude && stop.location?.longitude) {
            bounds.extend({ lat: stop.location.latitude, lng: stop.location.longitude });
          }
        });
        
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        googleMapRef.current.fitBounds(bounds, padding);
      }
    }
  }, [getOrderedStops]);

  // Open in external Google Maps with full route
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
        
        // Add additional parameters
        url += `/@${firstStop.location.latitude},${firstStop.location.longitude},12z/data=!3m1!4b1!4m2!4m1!3e0`;
        
        window.open(url, '_blank');
      }
    }
  }, [getOrderedStops]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const stops = getOrderedStops();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full mx-2 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className={`${route.direction === 'INBOUND' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'} p-4 border-b rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${route.direction === 'INBOUND' ? 'text-purple-900' : 'text-blue-900'}`}>
                {route.direction === 'INBOUND' ? '← Inbound Route' : '→ Outbound Route'}
              </h2>
              <p className={`text-sm ${route.direction === 'INBOUND' ? 'text-purple-700' : 'text-blue-700'}`}>
                {route.startStopName} → {route.endStopName}
              </p>
              <p className={`text-xs ${route.direction === 'INBOUND' ? 'text-purple-600' : 'text-blue-600'}`}>
                Distance: {route.distanceKm?.toFixed(1) || 0} km • Duration: ~{route.estimatedDurationMinutes || 0} min • {stops.length} stops
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Reset view button */}
              {isMapInitialized && (
                <button
                  onClick={resetMapView}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Reset view"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              
              {/* Open in Google Maps button */}
              {isMapInitialized && (
                <button
                  onClick={openInFullMaps}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )}
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close fullscreen view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Map Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Container */}
          <div className="flex-1 relative">
            {mapError ? (
              <div className="h-full bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
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
              </div>
            ) : (
              <>
                <div 
                  ref={mapRef} 
                  className="w-full h-full bg-gray-200"
                />
                
                {(isLoading || !isMapInitialized) && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading fullscreen route map...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar with stops list */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3">Route Stops ({stops.length})</h3>
            <p className="text-xs text-gray-500 mb-4">
              ℹ️ {route.direction === 'INBOUND' ? 'Purple' : 'Blue'} route = Road-based path • Red route = Direct fallback
            </p>
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        index === 0 ? 'bg-green-500' : 
                        index === stops.length - 1 ? 'bg-red-500' : 
                        route.direction === 'INBOUND' ? 'bg-purple-500' : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {stop.stopName || `Stop ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(stop.distanceFromStartKm || 0).toFixed(1)} km from start
                      </div>
                      {stop.location && stop.location.latitude && stop.location.longitude && (
                        <div className="text-xs text-gray-400 mt-1">
                          {stop.location.latitude.toFixed(4)}, {stop.location.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}