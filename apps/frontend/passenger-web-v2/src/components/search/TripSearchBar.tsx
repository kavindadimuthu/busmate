import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import StopField from "./StopField";
import { findMyBusPath, localIsoDate, type TripSearch } from "@/lib/search";
import { cn } from "@/lib/utils";

export default function TripSearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [s, setS] = useState<TripSearch>({
    fromStopId: "",
    toStopId: "",
    fromText: "",
    toText: "",
    date: localIsoDate(),
  });
  const [error, setError] = useState<string | null>(null);

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
      className={cn("rounded-[18px] border border-border bg-card p-4 shadow-float md:p-5", className)}
      aria-label="Search for a bus"
    >
      <div className="grid gap-3.5 md:grid-cols-[1fr_auto_1fr_minmax(150px,0.7fr)_auto] md:items-stretch">
        <StopField
          label="From"
          placeholder="Departure stop or town"
          text={s.fromText}
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
          className="mx-auto -my-1.5 grid h-[38px] w-[38px] shrink-0 rotate-90 place-items-center self-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-accent md:my-0 md:rotate-0"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <StopField
          label="To"
          placeholder="Destination stop or town"
          text={s.toText}
          onTextChange={(t) => {
            setError(null);
            setS((p) => ({ ...p, toText: t, toStopId: "" }));
          }}
          onPick={(stop) => setS((p) => ({ ...p, toText: stop.name, toStopId: stop.id }))}
        />

        <label className="block rounded-xl border border-border bg-soft px-4 py-3 focus-within:border-primary">
          <span className="block text-xs font-bold text-primary">Date</span>
          <input
            type="date"
            value={s.date}
            min={localIsoDate()}
            onChange={(e) => setS((p) => ({ ...p, date: e.target.value }))}
            className="mt-1 w-full border-0 bg-transparent text-sm font-medium text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </label>

        <button
          type="submit"
          className="min-h-14 rounded-xl bg-gradient-primary px-8 text-[15px] font-bold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Find My Bus →
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
