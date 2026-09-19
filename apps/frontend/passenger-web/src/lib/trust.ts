import type { TrustInfo } from '@busmate/api-client-core';
import {
  Calculator,
  Building2,
  Eye,
  MessageSquare,
  Radio,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/** The server sends a label key, never wording, so each app words it (and later translates it) itself. */
export type TrustKey = 'OFFICIAL' | 'OPERATOR_TIMETABLE' | 'OBSERVED' | 'REPORTED' | 'ESTIMATED' | 'LIVE';

interface TrustConfig {
  label: string;
  /** One sentence a passenger can act on. */
  meaning: string;
  className: string;
  icon: LucideIcon;
}

// Informative, never alarming: nothing here is red, and "observed" is plain, not a warning.
export const TRUST_CONFIG: Record<TrustKey, TrustConfig> = {
  OFFICIAL: {
    label: 'Official',
    meaning: 'Issued by the authority — gazetted routes and official timetables.',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: ShieldCheck,
  },
  OPERATOR_TIMETABLE: {
    label: 'Operator timetable',
    meaning: "Taken from the operator's own timetable.",
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Building2,
  },
  OBSERVED: {
    label: 'Observed',
    meaning:
      'Recorded by someone who checked it on the ground. Not confirmed by the authority, so times can drift.',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Eye,
  },
  REPORTED: {
    label: 'Reported',
    meaning: 'Reported by travellers and not yet verified. Treat it as a guide.',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: MessageSquare,
  },
  ESTIMATED: {
    label: 'Estimated',
    meaning: 'Worked out from distance and typical travel times, not observed.',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Calculator,
  },
  LIVE: {
    label: 'Live',
    meaning: "From the bus's current position, a moment ago.",
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Radio,
  },
};

export const TRUST_ORDER: TrustKey[] = [
  'OFFICIAL',
  'OPERATOR_TIMETABLE',
  'OBSERVED',
  'REPORTED',
  'ESTIMATED',
  'LIVE',
];

export function trustKey(trust?: TrustInfo | null): TrustKey | null {
  const label = trust?.label as string | undefined;
  return label && label in TRUST_CONFIG ? (label as TrustKey) : null;
}

/** "Confirmed 3 Sep 2026", or the time of the fix for a live value. */
export function confirmedText(trust?: TrustInfo | null): string | null {
  if (!trust?.observedAt) return null;
  const d = new Date(trust.observedAt);
  if (Number.isNaN(d.getTime())) return null;
  if (trust.label === 'LIVE') {
    return `Updated ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `Confirmed ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}
