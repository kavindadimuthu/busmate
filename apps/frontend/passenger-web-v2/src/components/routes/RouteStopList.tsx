import { Accessibility } from "lucide-react";
import type { RouteStopDetailResponse } from "@busmate/api-client-core";
import { formatKm } from "@/lib/routes.ts";
import { cn } from "@/lib/utils";

/** A route's stops in running order on a line, the first and last drawn open. Distance is from the start of the
 * route. "Accessible" appears only where the stop record says so: its absence isn't a claim that a stop isn't. */
export default function RouteStopList({ stops }: { stops: RouteStopDetailResponse[] }) {
  const last = stops.length - 1;
  return (
    <ol className="relative">
      {stops.map((s, i) => {
        const end = i === 0 || i === last;
        const km = formatKm(s.distanceFromStartKm);
        return (
          <li key={s.routeStopId ?? s.stopId ?? i} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < last && <span aria-hidden className="absolute left-[7px] top-4 h-full w-0.5 bg-primary/25" />}
            <span aria-hidden className={cn("relative z-[1] mt-1 h-4 w-4 flex-none rounded-full border-[3px] border-primary", end ? "bg-card" : "bg-primary")} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[15px] leading-snug", end ? "font-extrabold" : "font-semibold")}>{s.stopName}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                {i === 0 ? <span className="font-semibold text-foreground">Start of route</span> : km ? <span>{km} from start</span> : null}
                {i === last && i !== 0 && km && <span className="font-semibold text-foreground">End of route</span>}
                {s.isAccessible && (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Accessibility className="h-3.5 w-3.5" aria-hidden />
                    Accessible
                  </span>
                )}
              </p>
              {s.stopDescription && <p className="mt-1 text-xs leading-snug text-muted-foreground">{s.stopDescription}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
