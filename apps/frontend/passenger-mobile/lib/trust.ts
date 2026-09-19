import type { TrustInfo } from '@busmate/api-client-core';

/** The server sends a label key, never wording, so each app words it (and later translates it) itself. */
export type TrustKey = 'OFFICIAL' | 'OPERATOR_TIMETABLE' | 'OBSERVED' | 'REPORTED' | 'ESTIMATED' | 'LIVE';

export interface TrustConfig {
  label: string;
  /** One sentence a passenger can act on. */
  meaning: string;
  bg: string;
  fg: string;
  border: string;
}

// Informative, never alarming: nothing here is red, and "observed" is plain, not a warning.
export const TRUST_CONFIG: Record<TrustKey, TrustConfig> = {
  OFFICIAL: {
    label: 'Official',
    meaning: 'Issued by the authority — gazetted routes and official timetables.',
    bg: '#DCFCE7', fg: '#166534', border: '#BBF7D0',
  },
  OPERATOR_TIMETABLE: {
    label: 'Operator timetable',
    meaning: "Taken from the operator's own timetable.",
    bg: '#DBEAFE', fg: '#1E40AF', border: '#BFDBFE',
  },
  OBSERVED: {
    label: 'Observed',
    meaning: 'Recorded by someone who checked it on the ground. Not confirmed by the authority, so times can drift.',
    bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A',
  },
  REPORTED: {
    label: 'Reported',
    meaning: 'Reported by travellers and not yet verified. Treat it as a guide.',
    bg: '#F1F5F9', fg: '#334155', border: '#E2E8F0',
  },
  ESTIMATED: {
    label: 'Estimated',
    meaning: 'Worked out from distance and typical travel times, not observed.',
    bg: '#F1F5F9', fg: '#334155', border: '#E2E8F0',
  },
  LIVE: {
    label: 'Live',
    meaning: "From the bus's current position, a moment ago.",
    bg: '#D1FAE5', fg: '#065F46', border: '#A7F3D0',
  },
};

export const TRUST_ORDER: TrustKey[] = [
  'OFFICIAL', 'OPERATOR_TIMETABLE', 'OBSERVED', 'REPORTED', 'ESTIMATED', 'LIVE',
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
