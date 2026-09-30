import type { RouteScheduleStop } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";
import { formatClock } from "@/lib/findMyBus.ts";
import type { StopRole, StopRow } from "@/lib/tripDetails.ts";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Partial<Record<StopRole, string>> = { origin: "Board here", destination: "Get off here" };

function Dot({ role }: { role: StopRole }) {
  const end = role === "origin" || role === "destination";
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1.5 flex-none rounded-full border-[3px]",
        end ? "h-4 w-4 border-primary bg-card" : "h-3 w-3 border-primary",
        role === "between" && "bg-primary",
        role === "outside" && "border-border bg-card",
      )}
    />
  );
}

/** The route as a vertical timeline: the passenger's own stops emphasised, the rest of the route dimmed.
 * Times carry their trust icon (tap it to see what it means). */
export default function StopTimeline({ rows }: { rows: StopRow<RouteScheduleStop>[] }) {
  return (
    <ol className="grid">
      {rows.map((r, i) => {
        const last = i === rows.length - 1;
        const s = r.stop;
        const trust = r.depart != null ? s.departureTimeTrust : s.arrivalTimeTrust;
        const role = ROLE_LABEL[r.role];
        return (
          <li key={s.scheduleStopId || s.routeStopId || i} className={cn("grid grid-cols-[4.75rem_1.25rem_minmax(0,1fr)] gap-x-3", r.role === "outside" && "opacity-60")}>
            <div className="text-right">
              <div className="flex items-center justify-end gap-0.5">
                <TrustChip trust={trust} iconOnly className="border-0 bg-transparent px-0 dark:bg-transparent" />
                <span className="text-[15px] font-extrabold leading-tight">{r.main != null ? formatClock(r.main) : "—"}</span>
              </div>
              {r.haltMinutes ? <div className="text-[11px] text-muted-foreground">{r.haltMinutes} min stop</div> : null}
            </div>

            <div className="flex flex-col items-center">
              <Dot role={r.role} />
              {!last && <span aria-hidden className={cn("w-[3px] flex-1 rounded-full", r.role === "outside" ? "bg-border" : "bg-gradient-to-b from-primary to-highlight")} />}
            </div>

            <div className={cn("min-w-0", !last && "pb-5")}>
              <div className="text-[15px] font-bold leading-snug">{s.stop?.name ?? "Stop"}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {role && <span className="rounded-full bg-tint px-2 py-0.5 font-bold text-primary">{role}</span>}
                {r.km != null && <span>{r.km === 0 ? "Start of route" : `${r.km} km from start`}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
