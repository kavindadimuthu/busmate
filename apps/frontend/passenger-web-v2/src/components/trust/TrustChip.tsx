import type { TrustInfo } from "@busmate/api-client-core";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TRUST_CONFIG, confirmedText, trustKey } from "@/lib/trust";
import { cn } from "@/lib/utils";

interface TrustChipProps {
  trust?: TrustInfo | null;
  /** Short lead-in such as "Departs", so two chips on one card read apart. */
  prefix?: string;
  className?: string;
  /** Just the icon, for tight spots like a stop list. It is still a button with the full explanation. */
  iconOnly?: boolean;
}

/** How far to trust a value, as a small chip. Tap it for what that means and when it was confirmed:
 * a popover rather than a hover tooltip, because a phone has no hover. */
export function TrustChip({ trust, prefix, className, iconOnly = false }: TrustChipProps) {
  const key = trustKey(trust);
  if (!key) return null;
  const { label, meaning, className: tone, icon: Icon } = TRUST_CONFIG[key];
  const confirmed = confirmedText(trust);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-7 items-center justify-center gap-1 rounded-full border text-xs font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch:min-h-10",
            iconOnly ? "min-w-7 px-1.5 touch:min-w-10" : "px-2.5",
            tone,
            className,
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {iconOnly ? (
            <span className="sr-only">
              {prefix ? `${prefix}: ` : ""}
              {label} — what does this mean?
            </span>
          ) : (
            <>
              {prefix ? `${prefix}: ` : ""}
              {label}
              <span className="sr-only"> — what does this mean?</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-bold">{label}</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">{meaning}</p>
        {confirmed && <p className="mt-2 text-xs text-muted-foreground">{confirmed}</p>}
      </PopoverContent>
    </Popover>
  );
}
