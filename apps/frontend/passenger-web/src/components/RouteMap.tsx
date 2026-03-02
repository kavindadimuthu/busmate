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
}

interface RouteMapProps {
  stops: Stop[];
  routeName: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const RouteMap: React.FC<RouteMapProps> = ({ stops, routeName }) => {
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
        const directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true, // We'll add custom markers
          polylineOptions: {
            strokeColor: "#2563eb", // Primary color
            strokeOpacity: 1.0,
            strokeWeight: 4,
          }
        });
        
        directionsRenderer.setMap(mapInstance);

        // Prepare waypoints for directions
        const origin = stopsWithCoordinates[0].coords;
        const destination = stopsWithCoordinates[stopsWithCoordinates.length - 1].coords;
        const waypoints = stopsWithCoordinates.slice(1, -1).map(stop => ({
          location: stop.coords,
          stopover: true
        }));

        // Request directions
        try {
          const directionsResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            directionsService.route({
              origin: origin,
              destination: destination,
              waypoints: waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false, // Keep the order of stops
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

          directionsRenderer.setDirections(directionsResult);
        } catch (directionsError) {
          console.warn("Failed to get directions, falling back to straight lines:", directionsError);
          
          // Fallback to straight-line polyline if Directions API fails
          const routePath = stopsWithCoordinates.map(stop => stop.coords);
          const routeLine = new google.maps.Polyline({
            path: routePath,
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 1.0,
            strokeWeight: 4,
          });
          routeLine.setMap(mapInstance);
        }

        // Add markers for each stop
        stopsWithCoordinates.forEach((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === stopsWithCoordinates.length - 1;
          
          // Create custom marker element
          const markerDiv = document.createElement('div');
          markerDiv.className = 'flex flex-col items-center';
          markerDiv.innerHTML = `
            <div class="flex flex-col items-center">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                isFirst ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-blue-500'
              }">
                ${isFirst ? 'S' : isLast ? 'E' : index + 1}
              </div>
              <div class="text-xs font-medium text-gray-800 bg-white px-2 py-1 rounded shadow-md mt-1 whitespace-nowrap">
                ${stop.name}
              </div>
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map: mapInstance,
            position: stop.coords,
            content: markerDiv,
            title: `${stop.name} (${stop.km} km)`
          });

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-sm">${stop.name}</h3>
                <p class="text-xs text-gray-600">Distance: ${stop.km} km</p>
                <p class="text-xs text-gray-600">${isFirst ? 'Starting Point' : isLast ? 'End Point' : 'Stop ' + (index + 1)}</p>
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(mapInstance, marker);
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
  }, [stops, routeName]);

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