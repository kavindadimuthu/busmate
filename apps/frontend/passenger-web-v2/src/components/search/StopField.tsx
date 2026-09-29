import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { PassengerQueryService } from "@busmate/api-client-core";
import { cn } from "@/lib/utils";

export interface StopOption {
  id: string;
  name: string;
  city: string;
}

interface StopFieldProps {
  label: string;
  placeholder: string;
  text: string;
  onTextChange: (text: string) => void;
  onPick: (stop: StopOption) => void;
  onListOpenChange?: (open: boolean) => void;
  className?: string;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/** A labelled stop box with type-ahead over the real stop registry. Typing clears any picked stop
 * (the parent does that in onTextChange), so a stop id is only ever sent for a name the passenger
 * actually chose from the list. */
export default function StopField({
  label,
  placeholder,
  text,
  onTextChange,
  onPick,
  onListOpenChange,
  className,
}: StopFieldProps) {
  const listId = useId();
  const [options, setOptions] = useState<StopOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query === null) return;
    if (query.trim().length < MIN_CHARS) {
      setOptions([]);
      setOpen(false);
      return;
    }
    let stale = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await PassengerQueryService.searchStops(undefined, undefined, query.trim(), undefined, 0, 8);
        if (stale) return;
        setOptions(
          (res.content ?? []).map((s) => ({ id: s.stopId ?? "", name: s.name ?? "", city: s.city ?? "" })),
        );
        setActive(-1);
        setOpen(true);
      } catch {
        if (!stale) setOptions([]);
      } finally {
        if (!stale) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (stop: StopOption) => {
    onPick(stop);
    setOpen(false);
    setQuery(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showEmpty = open && !loading && options.length === 0;
  const listVisible = (open && options.length > 0) || showEmpty;

  useEffect(() => {
    onListOpenChange?.(listVisible);
  }, [listVisible, onListOpenChange]);

  return (
    <div ref={wrapRef} className="relative">
      <label
        className={cn(
          "block rounded-xl border border-border bg-soft px-3.5 py-2.5 focus-within:border-primary md:px-4 md:py-3",
          className,
        )}
      >
        <span className="block text-xs font-bold text-primary">{label}</span>
        <span className="mt-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={text}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(e) => {
              onTextChange(e.target.value);
              setQuery(e.target.value);
            }}
            onFocus={() => options.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 border-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-label="Searching" />}
        </span>
      </label>

      {listVisible ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-auto rounded-xl border border-border bg-popover p-1 shadow-float"
        >
          {showEmpty && <li className="px-3 py-2.5 text-sm text-muted-foreground">No stops match "{text}"</li>}
          {options.map((stop, i) => (
            <li
              key={stop.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(stop)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2.5 text-sm",
                i === active ? "bg-accent text-accent-foreground" : "text-foreground",
              )}
            >
              <div className="font-semibold">{stop.name}</div>
              {stop.city && stop.city.toLowerCase() !== stop.name.toLowerCase() && (
                <div className="text-xs text-muted-foreground">{stop.city}</div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
