'use client';

import type { ProvenanceResponse } from '@busmate/api-client-core';
import { formatObserved, provenanceSummary, tierMeta } from '@/lib/provenance';

/** A record's source as a small badge; the full sentence (credit, observed date) is its tooltip. */
export function ProvenanceBadge({ provenance }: { provenance?: ProvenanceResponse }) {
  const meta = tierMeta(provenance?.sourceTier);
  return (
    <span
      title={provenanceSummary(provenance)}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Badge plus credit and observed date on one line, for dense headers and footers. */
export function ProvenanceInline({ provenance }: { provenance?: ProvenanceResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProvenanceBadge provenance={provenance} />
      <span>
        credited to {provenance?.attributionLabel ?? 'BusMate'} · observed {formatObserved(provenance?.observedAt)}
      </span>
    </div>
  );
}
