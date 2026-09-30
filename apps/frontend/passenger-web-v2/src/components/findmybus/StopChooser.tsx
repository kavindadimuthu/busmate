import { MapPin } from "lucide-react";
import type { StopCandidate } from "@/lib/findMyBus";

/** "Which stop did you mean?": shown when what the passenger typed matches several stops and we won't guess. */
export default function StopChooser({ label, typed, options, onPick }: { label: string; typed: string; options: StopCandidate[]; onPick: (s: StopCandidate) => void }) {
  return (
    <section aria-label={`Choose your ${label.toLowerCase()} stop`} className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h2 className="text-[15px] font-extrabold">
        Which stop is “{typed}”? <span className="font-medium text-muted-foreground">({label})</span>
      </h2>
      <ul className="mt-3 grid gap-2">
        {options.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => onPick(o)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-soft px-3.5 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MapPin className="h-4 w-4 flex-none text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug">{o.name}</span>
                {o.city && o.city.toLowerCase() !== o.name.toLowerCase() && <span className="block text-xs text-muted-foreground">{o.city}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
