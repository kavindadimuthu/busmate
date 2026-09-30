import { statusInfo, type TicketTone } from "@/lib/tickets.ts";
import { cn } from "@/lib/utils";

const TONE: Record<TicketTone, string> = {
  good: "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
  info: "border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-200",
  warn: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  bad: "border-red-200 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
  quiet: "border-border bg-soft text-muted-foreground",
};

export default function StatusBadge({ status, className }: { status?: string; className?: string }) {
  const s = statusInfo(status);
  return <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold", TONE[s.tone], className)}>{s.label}</span>;
}
