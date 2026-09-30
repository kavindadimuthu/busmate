import { BusFront } from "lucide-react";
import type { UsualWorking } from "@busmate/api-client-core";
import { TrustChip } from "@/components/trust/TrustChip";

const CLASS_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  SEMI_LUXURY: "Semi-luxury",
  LUXURY: "Luxury",
  SUPER_LUXURY: "Super luxury",
  EXPRESSWAY_SUPER_LUXURY: "Expressway super luxury",
};

/**
 * Who usually works a departure (ADR-024). Always worded "usually": it is a pattern people have reported,
 * not a promise about today's bus, and the chip says where the claim came from. More than one plate means the
 * operator alternates among them, and nobody has said which runs today.
 */
export function UsualWorkingLine({ workings, limit }: { workings?: UsualWorking[] | null; limit?: number }) {
  const all = (workings ?? []).filter((w) => w.operatorName || (w.plates && w.plates.length > 0));
  if (all.length === 0) return null;
  const shown = limit ? all.slice(0, limit) : all;
  const hidden = all.length - shown.length;
  return (
    <div className="grid gap-1.5">
      {shown.map((w, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
          <BusFront className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Usually <span className="font-semibold text-foreground">{w.operatorName ?? "an operator not yet named"}</span>
            {w.plates && w.plates.length > 0 && <> · {w.plates.join(" or ")}</>}
            {w.serviceClass && w.serviceClass !== "NORMAL" && <> · {CLASS_LABEL[w.serviceClass] ?? w.serviceClass}</>}
          </span>
          <TrustChip trust={w.trust} />
        </div>
      ))}
      {hidden > 0 && <p className="text-xs text-muted-foreground">+{hidden} more usually run this departure</p>}
    </div>
  );
}
