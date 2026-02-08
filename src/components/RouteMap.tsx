import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, Navigation } from "lucide-react";

interface Stop {
  name: string;
  km: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  isOrigin?: boolean;
  isDestination?: boolean;
}

interface RouteMapProps {
  stops: Stop[];
  routeName: string;
  originStopId?: string;
  destinationStopId?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const RouteMap: React.FC<RouteMapProps> = ({ stops, routeName, originStopId, destinationStopId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: "weekly",
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        if (!mapRef.current) return;

        // Get coordinates for all stops using real API location data
        const stopsWithCoordinates = stops.filter(stop => 
          stop.location?.latitude && stop.location?.longitude
        ).map(stop => ({
          ...stop,
          coords: {
            lat: stop.location!.latitude,
            lng: stop.location!.longitude
          }
        }));
        
        if (stopsWithCoordinates.length === 0) {
          setError("No valid location coordinates found for route stops");
          setIsLoading(false);
          return;
        }

        if (stopsWithCoordinates.length < 2) {
          setError("At least 2 stops with valid coordinates are required to display route");
          setIsLoading(false);
          return;
        }

        // Find origin and destination indices
        const originIndex = stopsWithCoordinates.findIndex(s => s.isOrigin);
        const destIndex = stopsWithCoordinates.findIndex(s => s.isDestination);

        // Calculate center of the route
        const bounds = new google.maps.LatLngBounds();
        stopsWithCoordinates.forEach(stop => {
          bounds.extend(new google.maps.LatLng(stop.coords.lat, stop.coords.lng));
        });

        // Create map
        const mapInstance = new Map(mapRef.current, {
          zoom: 10,
          center: bounds.getCenter(),
          mapId: "route-map", // Required for advanced markers
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Fit map to bounds
        mapInstance.fitBounds(bounds);

        // Create route using Google Directions API for realistic road paths
        const directionsService = new google.maps.DirectionsService();
        
        // Full route renderer (lighter color)
        const fullRouteRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#93c5fd", // Light blue
            strokeOpacity: 0.6,
            strokeWeight: 3,
          },
          preserveViewport: true
        });
        fullRouteRenderer.setMap(mapInstance);

        // Highlighted segment renderer (bold color)
        const highlightedRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#2563eb", // Primary blue
            strokeOpacity: 1.0,
            strokeWeight: 5,
          },
          preserveViewport: true
        });
        highlightedRenderer.setMap(mapInstance);

        // Prepare waypoints for directions
        const origin = stopsWithCoordinates[0].coords;
        const destination = stopsWithCoordinates[stopsWithCoordinates.length - 1].coords;
        const waypoints = stopsWithCoordinates.slice(1, -1).map(stop => ({
          location: stop.coords,
          stopover: true
        }));

        // Request directions for full route
        try {
          const fullRouteResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route({
              origin: origin,
              destination: destination,
              waypoints: waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
              avoidHighways: false,
              avoidTolls: false
            }, (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Directions request failed: ${status}`));
              }
            });
          });

          fullRouteRenderer.setDirections(fullRouteResult);

          // Draw highlighted segment between origin and destination if specified
          if (originIndex >= 0 && destIndex >= 0 && originIndex !== destIndex) {
            const highlightOrigin = stopsWithCoordinates[originIndex].coords;
            const highlightDest = stopsWithCoordinates[destIndex].coords;
            const highlightWaypoints = stopsWithCoordinates
              .slice(Math.min(originIndex, destIndex) + 1, Math.max(originIndex, destIndex))
              .map(stop => ({
                location: stop.coords,
                stopover: true
              }));

            const highlightResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
              directionsService.route({
                origin: highlightOrigin,
                destination: highlightDest,
                waypoints: highlightWaypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
                avoidHighways: false,
                avoidTolls: false
              }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  resolve(result);
                } else {
                  reject(new Error(`Highlight directions request failed: ${status}`));
                }
              });
            });

            highlightedRenderer.setDirections(highlightResult);
          }
        } catch (directionsError) {
          console.warn("Failed to get directions, falling back to straight lines:", directionsError);
          
          // Fallback: Draw full route with straight lines
          const fullRoutePath = stopsWithCoordinates.map(stop => stop.coords);
          const fullRouteLine = new google.maps.Polyline({
            path: fullRoutePath,
            geodesic: true,
            strokeColor: "#93c5fd",
            strokeOpacity: 0.6,
            strokeWeight: 3,
          });
          fullRouteLine.setMap(mapInstance);

          // Draw highlighted segment if specified
          if (originIndex >= 0 && destIndex >= 0 && originIndex !== destIndex) {
            const start = Math.min(originIndex, destIndex);
            const end = Math.max(originIndex, destIndex);
            const highlightPath = stopsWithCoordinates.slice(start, end + 1).map(stop => stop.coords);
            const highlightLine = new google.maps.Polyline({
              path: highlightPath,
              geodesic: true,
              strokeColor: "#2563eb",
              strokeOpacity: 1.0,
              strokeWeight: 5,
            });
            highlightLine.setMap(mapInstance);
          }
        }

        // Add markers for each stop with tooltip on hover/click
        stopsWithCoordinates.forEach((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stopsWithCoordinates.length - 1;
          const isOrigin = stop.isOrigin || false;
          const isDestination = stop.isDestination || false;
          
          // Create custom marker element - smaller and without stop name
          const markerDiv = document.createElement('div');
          markerDiv.className = 'flex flex-col items-center';
          markerDiv.innerHTML = `
            <div class="w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
              isOrigin ? 'bg-green-500 ring-2 ring-green-300' : 
              isDestination ? 'bg-red-500 ring-2 ring-red-300' : 
              isFirst ? 'bg-purple-500' :
              isLast ? 'bg-orange-500' :
              'bg-blue-500'
            }">
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map: mapInstance,
            position: stop.coords,
            content: markerDiv,
            title: stop.name
          });

          // Create info window with comprehensive stop information
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3 min-w-[200px]">
                <h3 class="font-bold text-base mb-2 text-gray-800">${stop.name}</h3>
                <div class="space-y-1 text-sm">
                  <p class="text-gray-600">
                    <span class="font-semibold">Distance:</span> ${stop.km.toFixed(1)} km
                  </p>
                  <p class="text-gray-600">
                    <span class="font-semibold">Stop:</span> ${
                      isOrigin ? '<span class="text-green-600 font-semibold">Your Origin</span>' :
                      isDestination ? '<span class="text-red-600 font-semibold">Your Destination</span>' :
                      isFirst ? '<span class="text-purple-600">Route Start</span>' :
                      isLast ? '<span class="text-orange-600">Route End</span>' :
                      `#${index + 1}`
                    }
                  </p>
                </div>
              </div>
            `
          });

          // Show tooltip on click
          marker.addListener("click", () => {
            infoWindow.open(mapInstance, marker);
          });

          // Optional: close info window when clicking elsewhere on the map
          mapInstance.addListener("click", () => {
            infoWindow.close();
          });
        });

        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load map. Please check your internet connection.");
        setIsLoading(false);
      }
    };

    initMap();
  }, [stops, routeName, originStopId, destinationStopId]);

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="h-4 w-4 animate-spin" />
            Loading route map...
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border"
        style={{ minHeight: "20rem" }}
      />
    </div>
  );
};

export default RouteMap;