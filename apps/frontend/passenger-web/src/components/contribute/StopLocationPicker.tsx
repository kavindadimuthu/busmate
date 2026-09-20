import { useCallback, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface StopLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Sri Lanka's rough centre — the map opens here until a position is chosen.
const DEFAULT_CENTER = { lat: 7.29, lng: 80.63 };
const MAP_STYLE = { width: "100%", height: "280px", borderRadius: "0.5rem" };

/**
 * A draggable pin for choosing a stop's position. Dragging the marker or clicking the map both
 * move it; "Use my location" centres on the browser's geolocation, one tap from there.
 */
export function StopLocationPicker({ latitude, longitude, onChange }: StopLocationPickerProps) {
  const { isReady, loadError } = useGoogleMaps();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  const position = latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null;

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange(e.latLng.lat(), e.latLng.lng());
    },
    [onChange],
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange(e.latLng.lat(), e.latLng.lng());
    },
    [onChange],
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError("Your browser can't share your location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocateError("Couldn't get your location — you can still drag the pin.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (loadError) {
    return <p className="text-sm text-destructive">The map couldn't load. You can still enter coordinates below.</p>;
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-[280px] bg-muted rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={position ?? DEFAULT_CENTER}
        zoom={position ? 16 : 8}
        onClick={handleMapClick}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {position && <Marker position={position} draggable onDragEnd={handleMarkerDragEnd} />}
      </GoogleMap>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {position ? "Drag the pin, or tap the map, to adjust." : "Tap the map to place a pin."}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          {locating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5 mr-1.5" />}
          Use my location
        </Button>
      </div>
      {locateError && <p className="text-xs text-destructive">{locateError}</p>}
    </div>
  );
}
