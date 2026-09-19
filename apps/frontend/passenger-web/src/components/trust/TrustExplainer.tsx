import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TRUST_CONFIG, TRUST_ORDER } from "@/lib/trust";

/** "What do these labels mean?" — one entry point, reachable from every screen that shows a label. */
export function TrustExplainer({ className = "" }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className={`h-auto p-0 text-xs sm:text-sm ${className}`}>
          <Info className="h-3.5 w-3.5 mr-1" />
          What do these labels mean?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How much to trust a time</DialogTitle>
          <DialogDescription>
            BusMate shows where each time comes from, so you can decide how much room to leave.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {TRUST_ORDER.map((key) => {
            const { label, meaning, className: tone, icon: Icon } = TRUST_CONFIG[key];
            return (
              <li key={key} className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${tone}`}>
                  <Icon className="h-3 w-3" />
                  {label}
                </span>
                <span className="text-sm text-muted-foreground">{meaning}</span>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
