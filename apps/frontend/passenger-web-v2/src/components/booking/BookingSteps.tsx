import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Seats", "Review", "Pay"] as const;

/** Where the passenger is in booking: seats, review, pay. Passenger details isn't a step: BusMate books a seat, not a named person. */
export default function BookingSteps({ current, onDark = false }: { current: 1 | 2 | 3; onDark?: boolean }) {
  return (
    <ol aria-label="Booking steps" className="flex items-center gap-2 text-xs font-bold">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const here = n === current;
        return (
          <li key={label} aria-current={here ? "step" : undefined} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full border text-[11px]",
                here
                  ? onDark ? "border-white bg-white text-primary" : "border-primary bg-primary text-primary-foreground"
                  : onDark
                    ? done ? "border-white/70 bg-white/20 text-white" : "border-white/50 text-white/80"
                    : done ? "border-primary bg-tint text-primary" : "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
            </span>
            <span className={cn(onDark ? (here ? "text-white" : "text-white/80") : here ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < STEPS.length && <span aria-hidden className={cn("h-px w-5 sm:w-8", onDark ? "bg-white/40" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
