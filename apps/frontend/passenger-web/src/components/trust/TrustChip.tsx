import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TrustInfo } from "@busmate/api-client-core";
import { TRUST_CONFIG, confirmedText, trustKey } from "@/lib/trust";

interface TrustChipProps {
  trust?: TrustInfo | null;
  /** Short lead-in such as "Departs", so two chips on one card read apart. */
  prefix?: string;
  className?: string;
  /** Just the icon (still with the full tooltip), for tight spots like a timeline. */
  iconOnly?: boolean;
}

/** How far to trust a value, as a small chip; the tooltip says what it means and when it was confirmed. */
export function TrustChip({ trust, prefix, className = "", iconOnly = false }: TrustChipProps) {
  const key = trustKey(trust);
  if (!key) return null;
  const config = TRUST_CONFIG[key];
  const Icon = config.icon;
  const confirmed = confirmedText(trust);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs font-medium px-2 py-0.5 flex items-center gap-1 cursor-help ${config.className} ${className}`}
          >
            <Icon className="h-3 w-3" aria-label={config.label} />
            {!iconOnly && (
              <>
                {prefix ? `${prefix}: ` : ""}
                {config.label}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{config.meaning}</p>
          {confirmed && <p className="mt-1 opacity-80">{confirmed}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
