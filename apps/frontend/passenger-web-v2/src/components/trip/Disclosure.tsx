import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** A collapsible card section, on the browser's own <details> (keyboard and screen-reader support for free).
 * The summary row is 48px tall so it can be opened with a thumb. */
export default function Disclosure({
  title,
  hint,
  defaultOpen,
  children,
  className,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={cn("group rounded-2xl border border-border bg-card", className)}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[15px] font-extrabold leading-snug">{title}</span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
        <ChevronDown className="h-5 w-5 flex-none text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-4 border-t border-border px-4 pb-4 pt-4 md:px-5 md:pb-5">{children}</div>
    </details>
  );
}

/** A label and its value, side by side, wrapping cleanly on a narrow screen. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] items-start gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-semibold">{children}</dd>
    </div>
  );
}
