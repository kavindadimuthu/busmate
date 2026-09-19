'use client';

import { Database } from 'lucide-react';
import type { ProvenanceResponse } from '@busmate/api-client-core';
import { formatObserved, tierMeta } from '@/lib/provenance';
import { ProvenanceBadge } from './ProvenanceBadge';

/** The "where did this come from" block for a record's detail page. */
export function ProvenanceDetails({ provenance }: { provenance?: ProvenanceResponse }) {
  const meta = tierMeta(provenance?.sourceTier);
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Database className="w-5 h-5 mr-2" />
        Data Source
      </h3>
      <div className="space-y-4 text-sm">
        <div>
          <label className="block font-medium text-foreground/80 mb-1">Source</label>
          <ProvenanceBadge provenance={provenance} />
          <p className="text-muted-foreground mt-1.5">{meta.description}</p>
        </div>
        <div>
          <label className="block font-medium text-foreground/80 mb-1">Credited to</label>
          <p className="text-muted-foreground">{provenance?.attributionLabel ?? '—'}</p>
        </div>
        <div>
          <label className="block font-medium text-foreground/80 mb-1">Last observed</label>
          <p className="text-muted-foreground">{formatObserved(provenance?.observedAt)}</p>
        </div>
      </div>
    </div>
  );
}
