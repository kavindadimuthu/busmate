import { ArrowRight, Pencil } from "lucide-react";
import { formatLongDate } from "@/lib/findMyBus";

/** The phone's stand-in for the search form: what was searched, in one row, with an Edit button. The full
 * form takes half a screen, and a passenger looking at results doesn't need it until they want to change it. */
export default function SearchSummary({ from, to, date, onEdit }: { from: string; to: string; date: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-float">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[15px] font-extrabold leading-snug">
          <span className="line-clamp-2 min-w-0 break-words">{from || "Anywhere"}</span>
          <ArrowRight className="h-4 w-4 flex-none text-primary" aria-hidden />
          <span className="line-clamp-2 min-w-0 break-words">{to || "Anywhere"}</span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{formatLongDate(date)}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-xl border-[1.5px] border-primary px-3.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Edit
      </button>
    </div>
  );
}
