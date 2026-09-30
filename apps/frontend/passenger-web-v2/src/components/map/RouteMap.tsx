import { useEffect, useMemo, useState } from "react";
import { GoogleMap, InfoWindow, Marker, Polyline, useLoadScript } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { GOOGLE_MAPS_KEY, NO_LIBRARIES } from "@/lib/googleMaps";
import { boundsOf, journeyOf, ROLE_TEXT, type MapPoint } from "@/lib/routeMap.ts";

const OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  // A finger scrolls the page; two fingers move the map.
  gestureHandling: "cooperative" as const,
};
const COLOUR = { origin: "#16a34a", destination: "#dc2626", between: "#2563eb", outside: "#94a3b8" };

/** The route on a map: its stops, in order, joined by a line. With `highlightJourney`, the part a passenger rides is drawn
 * bold and the rest of the route light. The line joins the stops; it isn't the road the bus takes. Loaded on demand
 * (see MapDisclosure), because Google's script is heavy. */
export default function RouteMap({ points, highlightJourney = false }: { points: MapPoint[]; highlightJourney?: boolean }) {
  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_KEY, libraries: NO_LIBRARIES });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [open, setOpen] = useState<MapPoint | null>(null);
  const path = useMemo(() => points.map((p) => ({ lat: p.lat, lng: p.lng })), [points]);
  const ride = useMemo(() => (highlightJourney ? journeyOf(points).map((p) => ({ lat: p.lat, lng: p.lng })) : []), [points, highlightJourney]);

  useEffect(() => {
    const b = boundsOf(points);
    if (!map || !b) return;
    map.fitBounds({ south: b.south, west: b.west, north: b.north, east: b.east }, 32);
  }, [map, points]);

  if (loadError) {
    return <p role="status" className="rounded-xl border border-border bg-soft p-3 text-[13px] text-muted-foreground">The map couldn't load. The stops are listed in order.</p>;
  }
  if (!isLoaded) {
    return (
      <div role="status" aria-label="Loading the map" className="grid h-[300px] place-items-center rounded-xl border border-border bg-soft md:h-[380px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }
  return (
    <div className="h-[300px] overflow-hidden rounded-xl border border-border md:h-[380px]" data-testid="route-map">
      <GoogleMap mapContainerClassName="h-full w-full" options={OPTIONS} onLoad={setMap} onUnmount={() => setMap(null)} onClick={() => setOpen(null)}>
        <Polyline path={path} options={{ strokeColor: highlightJourney ? "#93c5fd" : "#2563eb", strokeOpacity: 1, strokeWeight: highlightJourney ? 3 : 4, clickable: false }} />
        {ride.length > 1 && <Polyline path={ride} options={{ strokeColor: "#2563eb", strokeOpacity: 1, strokeWeight: 5, clickable: false }} />}
        {points.map((p, i) => {
          const big = p.role === "origin" || p.role === "destination";
          return (
            <Marker
              key={`${i}-${p.lat}-${p.lng}`}
              position={{ lat: p.lat, lng: p.lng }}
              title={p.name}
              onClick={() => setOpen(p)}
              zIndex={big ? 2 : 1}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: big ? 8 : 5, fillColor: COLOUR[p.role], fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 }}
            />
          );
        })}
        {open && (
          <InfoWindow position={{ lat: open.lat, lng: open.lng }} onCloseClick={() => setOpen(null)}>
            <div className="text-sm text-slate-900">
              <p className="font-bold">{open.name}</p>
              <p className="text-xs text-slate-600">{ROLE_TEXT[open.role]}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
