import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { GOOGLE_MAPS_KEY as KEY, NO_LIBRARIES } from "@/lib/googleMaps";

// Sri Lanka's rough centre: where the map opens until a position is chosen.
const CENTRE = { lat: 7.87, lng: 80.77 };
const OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  // On a phone the page has to stay scrollable: one finger scrolls the page, two move the map.
  gestureHandling: "cooperative" as const,
};

interface MapMouse {
  latLng?: { lat(): number; lng(): number } | null;
}

/** The map for placing a stop: tap it, or drag the pin, to set the position. Loaded on demand, and only on the propose
 * a stop page, because Google's script is heavy and nothing else here needs it. */
export default function StopMap({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: KEY, libraries: NO_LIBRARIES });
  const position = lat !== null && lng !== null ? { lat, lng } : null;
  const pick = (e: MapMouse) => e.latLng && onPick(e.latLng.lat(), e.latLng.lng());

  if (loadError) {
    return <p role="status" className="rounded-xl border border-border bg-soft p-3 text-[13px] text-muted-foreground">The map couldn't load. You can still use your location or type the coordinates.</p>;
  }
  if (!isLoaded) {
    return (
      <div role="status" aria-label="Loading the map" className="grid h-[260px] place-items-center rounded-xl border border-border bg-soft">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border" data-testid="stop-map">
      <GoogleMap mapContainerStyle={{ width: "100%", height: "260px" }} center={position ?? CENTRE} zoom={position ? 17 : 7} onClick={pick} options={OPTIONS}>
        {position && <Marker position={position} draggable onDragEnd={pick} />}
      </GoogleMap>
    </div>
  );
}
