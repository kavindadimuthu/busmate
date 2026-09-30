import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatLongDate } from "@/lib/findMyBus";
import { cn } from "@/lib/utils";

/** The same search, one day earlier or later. Plain links, so they work with the back button and can be shared. */
export function searchWithDate(search: string, date: string): string {
  const q = new URLSearchParams(search);
  q.set("date", date);
  return `?${q.toString()}`;
}

const STEP =
  "grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function DayNav({ date, today, search, className }: { date: string; today: string; search: string; className?: string }) {
  const canGoBack = date > today;
  return (
    <nav aria-label="Change date" className={cn("flex items-center gap-2", className)}>
      {canGoBack ? (
        <Link to={{ search: searchWithDate(search, addDays(date, -1)) }} replace aria-label="Previous day" className={cn(STEP, "hover:bg-accent")}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span aria-hidden className={cn(STEP, "opacity-40")}>
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-[8.5rem] text-center text-sm font-bold leading-tight">
        {formatLongDate(date)}
        {date === today && <div className="text-xs font-semibold text-primary">Today</div>}
        {date === addDays(today, 1) && <div className="text-xs font-semibold text-muted-foreground">Tomorrow</div>}
      </div>
      <Link to={{ search: searchWithDate(search, addDays(date, 1)) }} replace aria-label="Next day" className={cn(STEP, "hover:bg-accent")}>
        <ChevronRight className="h-5 w-5" />
      </Link>
    </nav>
  );
}
