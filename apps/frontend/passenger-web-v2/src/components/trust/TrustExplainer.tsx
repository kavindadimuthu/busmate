import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TRUST_CONFIG, TRUST_ORDER } from "@/lib/trust";
import { cn } from "@/lib/utils";

/** "What do these labels mean?": one entry point, reachable from every screen that shows a label. */
export function TrustExplainer({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-1 text-[13px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <Info className="h-4 w-4" aria-hidden />
          What do these labels mean?
        </button>
      </DialogTrigger>
      <DialogContent variant="sheet">
        <div className="grid gap-1.5">
          <DialogTitle>How much to trust a time</DialogTitle>
          <DialogDescription>
            BusMate shows where each time comes from, so you can decide how much room to leave.
          </DialogDescription>
        </div>
        <ul className="grid gap-3.5">
          {TRUST_ORDER.map((key) => {
            const { label, meaning, className: tone, icon: Icon } = TRUST_CONFIG[key];
            return (
              <li key={key} className="grid grid-cols-[auto_1fr] items-start gap-3">
                <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {label}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{meaning}</span>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
