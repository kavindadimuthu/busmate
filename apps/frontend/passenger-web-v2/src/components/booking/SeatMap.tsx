import { Check, X } from "lucide-react";
import { seatState, type SeatLayout, type SeatState } from "@/lib/booking/seatMap.ts";
import { cn } from "@/lib/utils";

const STYLE: Record<SeatState, string> = {
  available: "border-[1.5px] border-primary/40 bg-card text-foreground hover:border-primary hover:bg-tint",
  selected: "border-[1.5px] border-primary bg-primary text-primary-foreground shadow-sm",
  taken: "cursor-not-allowed border-[1.5px] border-transparent bg-soft text-muted-foreground",
  blocked: "cursor-not-allowed border-[1.5px] border-dashed border-border bg-transparent text-muted-foreground/60",
};

const STATE_WORD: Record<SeatState, string> = { available: "available", selected: "chosen by you", taken: "taken", blocked: "not for sale" };

function Seat({ seat, state, onPick }: { seat: string; state: SeatState; onPick: (seat: string) => void }) {
  const off = state === "taken" || state === "blocked";
  return (
    <button
      type="button"
      // Taken and blocked seats stay focusable-looking but inert; the label says why.
      disabled={off}
      aria-pressed={off ? undefined : state === "selected"}
      aria-label={`Seat ${seat}, ${STATE_WORD[state]}`}
      onClick={() => onPick(seat)}
      className={cn(
        "relative grid h-11 w-11 place-items-center rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch:h-12 touch:w-12 lg:h-11 lg:w-11",
        STYLE[state],
      )}
    >
      {state === "taken" ? <X className="h-4 w-4" aria-hidden /> : state === "selected" ? <Check className="h-4 w-4" aria-hidden /> : <span>{seat}</span>}
    </button>
  );
}

const LEGEND: { state: SeatState; label: string }[] = [
  { state: "available", label: "Available" },
  { state: "selected", label: "Yours" },
  { state: "taken", label: "Taken" },
];

/** The bus's real seats with real availability. Seat numbers are the bus's own; nothing here invents a class,
 * a ladies-only row or a price for a seat. A chosen seat shows a tick and not only a colour. */
export default function SeatMap({
  layout,
  taken,
  selected,
  onPick,
}: {
  layout: SeatLayout;
  taken: ReadonlySet<string>;
  selected: readonly string[];
  onPick: (seat: string) => void;
}) {
  const blocked = new Set((layout.blockedSeats ?? []).map(String));
  const state = (seat: string) => seatState(seat, taken, selected, blocked);
  const backSeats = layout.rows.flatMap((r) => r.back ?? []);
  const showBlocked = blocked.size > 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Rear</span>
        <span className="rounded-t-2xl border-[1.5px] border-b-0 border-border px-4 py-1">Front of bus</span>
      </div>
      <div className="grid gap-2" role="group" aria-label="Seats">
        {layout.rows.map((row, i) => (
          <div key={i} className="flex items-center justify-center gap-6">
            <div className="flex gap-1.5">
              {(row.left ?? []).map((s) => (
                <Seat key={s} seat={String(s)} state={state(String(s))} onPick={onPick} />
              ))}
            </div>
            <div className="flex gap-1.5">
              {(row.right ?? []).map((s) => (
                <Seat key={s} seat={String(s)} state={state(String(s))} onPick={onPick} />
              ))}
            </div>
          </div>
        ))}
        {backSeats.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-1.5 border-t border-border pt-3">
            {backSeats.map((s) => (
              <Seat key={s} seat={String(s)} state={state(String(s))} onPick={onPick} />
            ))}
          </div>
        )}
      </div>
      <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        {[...LEGEND, ...(showBlocked ? [{ state: "blocked" as SeatState, label: "Not for sale" }] : [])].map((l) => (
          <li key={l.state} className="flex items-center gap-2">
            <span aria-hidden className={cn("grid h-6 w-6 place-items-center rounded-md", STYLE[l.state], "!cursor-default hover:!bg-inherit")}>
              {l.state === "taken" ? <X className="h-3 w-3" /> : l.state === "selected" ? <Check className="h-3 w-3" /> : null}
            </span>
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
