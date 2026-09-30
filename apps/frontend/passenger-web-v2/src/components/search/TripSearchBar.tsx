import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Search } from "lucide-react";
import StopField from "./StopField";
import { findMyBusPath, todayInSriLanka, type TripSearch } from "@/lib/search";
import { cn } from "@/lib/utils";

export default function TripSearchBar({ className, initial }: { className?: string; initial?: Partial<TripSearch> }) {
  const navigate = useNavigate();
  const [s, setS] = useState<TripSearch>({
    fromStopId: "",
    toStopId: "",
    fromText: "",
    toText: "",
    date: todayInSriLanka(),
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  // On phones the swap button floats over the From/To edge, right where From's suggestions open.
  const [fromListOpen, setFromListOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const path = findMyBusPath(s);
    if (!path) {
      setError("Enter where you're leaving from or going to.");
      return;
    }
    navigate(path);
  };

  const swap = () =>
    setS((p) => ({ ...p, fromStopId: p.toStopId, toStopId: p.fromStopId, fromText: p.toText, toText: p.fromText }));

  return (
    <form
      onSubmit={submit}
      className={cn("rounded-[18px] border border-border bg-card p-3 shadow-float min-[360px]:p-3.5 md:p-5", className)}
      aria-label="Search for a bus"
    >
      {/* Three layouts. Phones: From/To stacked with the swap button on their shared edge, then
          date and search side by side (~230px tall, so it all fits on the first screen). Tablets:
          From ⇄ To on one row, date and search below. Desktop (lg): the design's single row of five,
          where both wrappers dissolve (lg:contents) into the outer grid. */}
      <div className="grid gap-2 md:gap-3 lg:grid-cols-[1fr_auto_1fr_minmax(150px,0.7fr)_auto] lg:items-stretch lg:gap-3.5">
        <div className="relative grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3 lg:contents">
          <StopField
            label="From"
            placeholder="Departure stop or town"
            text={s.fromText}
            className="pr-14 md:pr-3.5 lg:pr-4"
            onListOpenChange={setFromListOpen}
            onTextChange={(t) => {
              setError(null);
              setS((p) => ({ ...p, fromText: t, fromStopId: "" }));
            }}
            onPick={(stop) => setS((p) => ({ ...p, fromText: stop.name, fromStopId: stop.id }))}
          />

          <button
            type="button"
            onClick={swap}
            aria-label="Swap from and to"
            className={cn(
              "absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 rotate-90 place-items-center self-center rounded-full border border-border bg-card text-primary shadow-sm transition-colors hover:bg-accent md:static md:mx-auto md:h-[38px] md:w-[38px] md:translate-y-0 md:rotate-0 md:shadow-none touch:h-11 touch:w-11",
              fromListOpen && "max-md:invisible",
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <StopField
            label="To"
            placeholder="Destination stop or town"
            text={s.toText}
            className="pr-14 md:pr-3.5 lg:pr-4"
            onTextChange={(t) => {
              setError(null);
              setS((p) => ({ ...p, toText: t, toStopId: "" }));
            }}
            onPick={(stop) => setS((p) => ({ ...p, toText: stop.name, toStopId: stop.id }))}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:gap-3 lg:contents">
          <label className="block min-w-0 rounded-xl border border-border bg-soft px-3.5 py-2.5 focus-within:border-primary md:px-4 md:py-3">
            <span className="block text-xs font-bold text-primary">Date</span>
            <input
              type="date"
              value={s.date}
              min={todayInSriLanka()}
              onChange={(e) => setS((p) => ({ ...p, date: e.target.value }))}
              className="mt-1 w-full min-w-0 border-0 bg-transparent text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
          </label>

          <button
            type="submit"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 text-[15px] font-bold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:px-8"
          >
            <Search className="h-[18px] w-[18px] md:hidden" aria-hidden />
            <span className="md:hidden">Search</span>
            <span className="hidden md:inline">Find My Bus →</span>
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
