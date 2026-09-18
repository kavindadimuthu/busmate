import { cn } from "@/lib/utils";

/** Matches core-service's Bus.seatLayout jsonb shape (fleet/entity/Bus.java). */
export interface SeatLayoutRow {
  left?: string[];
  right?: string[];
  back?: string[];
}
export interface SeatLayout {
  layoutName?: string;
  rows: SeatLayoutRow[];
  blockedSeats?: string[];
}

export type SeatStatus = "available" | "selected" | "booked" | "blocked";

interface SeatMapProps {
  layout: SeatLayout;
  /** Seats already held by a live (non-cancelled) ticket - INC-012's actual guarantee, mirrored
   * here only for display; the server is what actually enforces it at booking time. */
  occupiedSeats: Set<string>;
  selectedSeats: string[];
  onToggleSeat: (seatNumber: string) => void;
  disabled?: boolean;
}

function statusOf(seat: string, occupied: Set<string>, selected: string[], blocked: Set<string>): SeatStatus {
  if (blocked.has(seat)) return "blocked";
  if (occupied.has(seat)) return "booked";
  if (selected.includes(seat)) return "selected";
  return "available";
}

const STATUS_STYLES: Record<SeatStatus, string> = {
  available: "bg-background border-2 border-border hover:border-primary hover:bg-primary/5 cursor-pointer",
  selected: "bg-gradient-primary text-white border-2 border-transparent cursor-pointer",
  booked: "bg-muted text-muted-foreground border-2 border-transparent cursor-not-allowed opacity-60",
  blocked: "bg-muted/50 text-muted-foreground/50 border-2 border-dashed border-border cursor-not-allowed",
};

function Seat({ seat, status, onClick }: { seat: string; status: SeatStatus; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={status === "booked" || status === "blocked"}
      onClick={onClick}
      className={cn(
        "h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center justify-center transition-colors",
        STATUS_STYLES[status],
      )}
      aria-label={`Seat ${seat} (${status})`}
      title={`Seat ${seat}`}
    >
      {seat}
    </button>
  );
}

/**
 * Renders a bus's real seat layout with real occupancy - the same seatLayout+trip-tickets merge
 * pattern proven live in conductor-mobile's useSeatMap (INC-011/INC-012), adapted for a passenger
 * picking their own seat rather than a conductor viewing everyone's.
 */
export default function SeatMap({ layout, occupiedSeats, selectedSeats, onToggleSeat, disabled }: SeatMapProps) {
  const blocked = new Set((layout.blockedSeats ?? []).map(String));

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-2">
        <div className="w-10 h-8 rounded-t-xl border-2 border-border flex items-center justify-center text-[9px] text-muted-foreground">
          Front
        </div>
      </div>
      <div className="space-y-2">
        {layout.rows.map((row, i) => (
          <div key={i} className="flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex gap-1.5 sm:gap-2">
              {(row.left ?? []).map((seat) => (
                <Seat
                  key={seat}
                  seat={seat}
                  status={statusOf(seat, occupiedSeats, selectedSeats, blocked)}
                  onClick={() => !disabled && onToggleSeat(seat)}
                />
              ))}
            </div>
            <div className="w-4 sm:w-6" />
            <div className="flex gap-1.5 sm:gap-2">
              {(row.right ?? []).map((seat) => (
                <Seat
                  key={seat}
                  seat={seat}
                  status={statusOf(seat, occupiedSeats, selectedSeats, blocked)}
                  onClick={() => !disabled && onToggleSeat(seat)}
                />
              ))}
            </div>
          </div>
        ))}
        {layout.rows.some((r) => (r.back?.length ?? 0) > 0) && (
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-2 border-t mt-2">
            {layout.rows.flatMap((r) => r.back ?? []).map((seat) => (
              <Seat
                key={seat}
                seat={seat}
                status={statusOf(seat, occupiedSeats, selectedSeats, blocked)}
                onClick={() => !disabled && onToggleSeat(seat)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-3 border-t text-[11px] sm:text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-border bg-background" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-gradient-primary" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-muted opacity-60" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-dashed border-border" /> Blocked</span>
      </div>
    </div>
  );
}
