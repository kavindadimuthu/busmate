import type { ProvenanceResponse } from '@busmate/api-client-core';

/** Where a network record came from (ADR-007, ADR-018). A lower number outranks a higher one. */
export type SourceTierKey = 'SRC_1' | 'SRC_2' | 'SRC_3' | 'SRC_4' | 'SRC_5' | 'SRC_6';

interface TierMeta {
  label: string;
  description: string;
  /** Tailwind classes for the badge; official is the only tier drawn as "success". */
  className: string;
}

export const SOURCE_TIERS: Record<SourceTierKey, TierMeta> = {
  SRC_1: {
    label: 'Official',
    description: 'Issued by the authority — gazetted routes, official timetables.',
    className: 'bg-success/10 text-success border-success/20',
  },
  SRC_2: {
    label: 'Operator (live)',
    description: 'Recorded by an operator running on BusMate.',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  SRC_3: {
    label: 'Operator feed',
    description: "From an operator's shared file or feed.",
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  SRC_4: {
    label: 'Observed',
    description: 'Field observation by BusMate or an accepted contributor. Not official.',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  SRC_5: {
    label: 'Reported',
    description: 'Reported by passengers and not yet verified.',
    className: 'bg-muted text-muted-foreground border-border',
  },
  SRC_6: {
    label: 'Estimated',
    description: 'Derived from historical patterns.',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

/** The tiers staff may record directly. SRC_1 is further limited to MOT by the backend. */
export const STAFF_ENTERABLE_TIERS: SourceTierKey[] = ['SRC_4', 'SRC_3', 'SRC_2', 'SRC_1'];

export function tierMeta(tier?: string): TierMeta {
  return SOURCE_TIERS[(tier as SourceTierKey) ?? 'SRC_4'] ?? SOURCE_TIERS.SRC_4;
}

export function formatObserved(observedAt?: string): string {
  if (!observedAt) return '—';
  const d = new Date(observedAt);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** One line for a tooltip: "Observed · credited to BusMate · last observed 3 Sep 2026". */
export function provenanceSummary(p?: ProvenanceResponse): string {
  if (!p) return 'Source not recorded';
  const meta = tierMeta(p.sourceTier);
  return `${meta.label} · credited to ${p.attributionLabel ?? 'BusMate'} · last observed ${formatObserved(p.observedAt)}`;
}
