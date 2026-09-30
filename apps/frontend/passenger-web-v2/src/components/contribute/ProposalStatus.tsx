import { statusLabel, statusTone, type Tone } from "@/lib/contributions.ts";
import { cn } from "@/lib/utils";

const TONE: Record<Tone, string> = {
  good: "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
  warn: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  bad: "border-red-200 bg-red-100 text-red-900 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
  quiet: "border-border bg-soft text-muted-foreground",
};

/** A proposal's status as a pill: the word always, colour only as a second cue. */
export default function ProposalStatus({ status, className }: { status?: string; className?: string }) {
  return <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold", TONE[statusTone(status)], className)}>{statusLabel(status)}</span>;
}
