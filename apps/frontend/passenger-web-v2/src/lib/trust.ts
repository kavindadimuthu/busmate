import type { TrustInfo } from "@busmate/api-client-core";
import { Building2, Calculator, Eye, MessageSquare, Radio, ShieldCheck, type LucideIcon } from "lucide-react";

/** The server sends a label key, never wording, so each app words it (and later translates it) itself. */
export type TrustKey = "OFFICIAL" | "OPERATOR_TIMETABLE" | "OBSERVED" | "REPORTED" | "ESTIMATED" | "LIVE";

interface TrustConfig {
  label: string;
  /** One sentence a passenger can act on. Same wording as passenger-web. */
  meaning: string;
  className: string;
  icon: LucideIcon;
}

// Informative, never alarming: nothing here is red. Each has a dark-mode pair.
export const TRUST_CONFIG: Record<TrustKey, TrustConfig> = {
  OFFICIAL: {
    label: "Official",
    meaning: "Issued by the authority — gazetted routes and official timetables.",
    className: "border-green-200 bg-green-100 text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200",
    icon: ShieldCheck,
  },
  OPERATOR_TIMETABLE: {
    label: "Operator timetable",
    meaning: "Taken from the operator's own timetable.",
    className: "border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-200",
    icon: Building2,
  },
  OBSERVED: {
    label: "Observed",
    meaning: "Recorded by someone who checked it on the ground. Not confirmed by the authority, so times can drift.",
    className: "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
    icon: Eye,
  },
  REPORTED: {
    label: "Reported",
    meaning: "Reported by travellers and not yet verified. Treat it as a guide.",
    className: "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-400/30 dark:bg-slate-500/15 dark:text-slate-200",
    icon: MessageSquare,
  },
  ESTIMATED: {
    label: "Estimated",
    meaning: "Worked out from distance and typical travel times, not observed.",
    className: "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-400/30 dark:bg-slate-500/15 dark:text-slate-200",
    icon: Calculator,
  },
  LIVE: {
    label: "Live",
    meaning: "From the bus's current position, a moment ago.",
    className: "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: Radio,
  },
};

export const TRUST_ORDER: TrustKey[] = ["OFFICIAL", "OPERATOR_TIMETABLE", "OBSERVED", "REPORTED", "ESTIMATED", "LIVE"];

export function trustKey(trust?: TrustInfo | null): TrustKey | null {
  const label = trust?.label as string | undefined;
  return label && label in TRUST_CONFIG ? (label as TrustKey) : null;
}

/** "Confirmed 3 Sep 2026", or the time of the fix for a live value. */
export function confirmedText(trust?: TrustInfo | null): string | null {
  if (!trust?.observedAt) return null;
  const d = new Date(trust.observedAt);
  if (Number.isNaN(d.getTime())) return null;
  if (trust.label === "LIVE") {
    return `Updated ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return `Confirmed ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}
