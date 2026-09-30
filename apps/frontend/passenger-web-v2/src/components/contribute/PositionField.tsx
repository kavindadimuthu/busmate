import { lazy, Suspense, useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { formatCoordinate, parseCoordinate } from "@/lib/propose.ts";

// Google's map code is a separate download, fetched only when this field is on screen and a key is set.
const StopMap = lazy(() => import("./StopMap"));
const HAS_KEY = !!(import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined);

/** A stop's position. A contributor is usually standing at the stop with a phone, so the first way in is "Use my
 * location"; the numbers can be typed, and a map, where there is one, shows the pin and can move it. The numbers are
 * the truth: whichever way the position is set, they show it. */
export default function PositionField({ latitude, longitude, error, changed, onChange }: { latitude: string; longitude: string; error?: string; changed?: boolean; onChange: (lat: string, lng: string) => void }) {
  const [locating, setLocating] = useState(false);
  const [locateNote, setLocateNote] = useState<string | null>(null);

  const set = (lat: number, lng: number) => onChange(formatCoordinate(lat), formatCoordinate(lng));

  const useMyLocation = () => {
    if (!navigator.geolocation) return setLocateNote("This browser can't share your location. Tap the map or type the coordinates.");
    setLocating(true);
    setLocateNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set(pos.coords.latitude, pos.coords.longitude);
        const m = Math.round(pos.coords.accuracy);
        setLocateNote(m > 100 ? `Accurate to about ${m} m, which is loose. Stand at the stop, or adjust the pin.` : `Accurate to about ${m} m.`);
        setLocating(false);
      },
      (e) => {
        setLocateNote(e.code === e.PERMISSION_DENIED ? "Location is blocked for this site. Allow it in your browser's settings, or tap the map." : "Couldn't get your location. Tap the map or type the coordinates.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 flex w-full items-center justify-between gap-3 text-[13px] font-bold">
        Position
        {changed && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary">Changed</span>}
      </legend>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
        {locating ? "Finding you…" : "Use my location"}
      </button>
      {locateNote && (
        <p role="status" className="text-[13px] leading-snug text-muted-foreground">
          {locateNote}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" inputMode="decimal" autoComplete="off" placeholder="7.29000" value={latitude} onChange={(e) => onChange(e.target.value, longitude)} error={undefined} />
        <Field label="Longitude" inputMode="decimal" autoComplete="off" placeholder="80.63000" value={longitude} onChange={(e) => onChange(latitude, e.target.value)} error={undefined} />
      </div>
      {error && (
        <p role="alert" className="-mt-1 text-[13px] font-medium text-destructive">
          {error}
        </p>
      )}

      {HAS_KEY ? (
        <>
          <Suspense fallback={<div role="status" aria-label="Loading the map" className="h-[260px] animate-pulse rounded-xl border border-border bg-soft" />}>
            <StopMap lat={parseCoordinate(latitude)} lng={parseCoordinate(longitude)} onPick={set} />
          </Suspense>
          <p className="text-xs text-muted-foreground">Tap the map, or drag the pin, to adjust. Use two fingers to move the map.</p>
        </>
      ) : (
        <p className="rounded-xl border border-border bg-soft p-3 text-xs text-muted-foreground">The map isn't set up here. Use your location or type the coordinates.</p>
      )}
    </fieldset>
  );
}
