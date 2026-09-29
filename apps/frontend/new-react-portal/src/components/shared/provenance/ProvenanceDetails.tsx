'use client';

import { AlertTriangle, Database } from 'lucide-react';
import type { ProvenanceResponse } from '@busmate/api-client-core';
import { confidenceMeta, formatObserved, tierMeta } from '@/lib/provenance';
import { ProvenanceBadge } from './ProvenanceBadge';

/** The "where did this come from" block for a record's detail page. */
export function ProvenanceDetails({ provenance }: { provenance?: ProvenanceResponse }) {
  const meta = tierMeta(provenance?.sourceTier);
  const confidence = confidenceMeta(provenance);
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
        {confidence && (
          <div>
            <label className="block font-medium text-foreground/80 mb-1">Confidence</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${confidence.stale ? 'bg-warning' : 'bg-primary'}`}
                  style={{ width: `${confidence.effective}%` }}
                />
              </div>
              <span className="text-muted-foreground w-10 text-right">{confidence.effective}%</span>
            </div>
            {confidence.stale && (
              <p className="text-warning flex items-center gap-1 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Has decayed since it was last observed — worth re-verifying.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
