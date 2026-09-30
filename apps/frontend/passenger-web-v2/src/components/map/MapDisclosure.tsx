import { lazy, Suspense, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { HAS_MAPS_KEY } from "@/lib/googleMaps";
import { canDraw, missingNote, type MapPoints } from "@/lib/routeMap.ts";
import { cn } from "@/lib/utils";

const RouteMap = lazy(() => import("./RouteMap"));

/** A "Show on map" card. The map, and Google's script with it, load only when it is opened: most visitors just want the
 * stops, and the script is heavy on a phone. Left out entirely when there's no key or fewer than two known positions,
 * rather than showing a map that can't be drawn. */
export default function MapDisclosure({
  title,
  data,
  highlightJourney,
  legend,
  className,
}: {
  title: string;
  data: MapPoints;
  highlightJourney?: boolean;
  /** One line under the map about what it shows. */
  legend: string;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  if (!HAS_MAPS_KEY || !canDraw(data)) return null;
  const note = missingNote(data);
  return (
    <section aria-label={title} className={cn("rounded-2xl border border-border bg-card p-4 md:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
          <MapIcon className="h-4 w-4 text-primary" aria-hidden />
          {title}
        </h2>
        <button
          type="button"
          aria-expanded={shown}
          onClick={() => setShown((s) => !s)}
          className="inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-primary px-4 text-[13px] font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {shown ? "Hide map" : "Show map"}
        </button>
      </div>
      {shown && (
        <div className="mt-3 grid gap-2">
          <Suspense fallback={<div role="status" aria-label="Loading the map" className="h-[300px] animate-pulse rounded-xl border border-border bg-soft md:h-[380px]" />}>
            <RouteMap points={data.points} highlightJourney={highlightJourney} />
          </Suspense>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {legend} {note}
          </p>
        </div>
      )}
    </section>
  );
}
