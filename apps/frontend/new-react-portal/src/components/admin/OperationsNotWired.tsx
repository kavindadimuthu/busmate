'use client';

import { EmptyState } from '@busmate/ui';
import { Activity } from 'lucide-react';

export interface OperationsNotWiredProps {
  /** What this page will eventually show, in the reader's terms. */
  what: string;
  /** Where the information lives in the meantime. */
  where?: string;
}

/**
 * Stands in for an operations surface that has no data source.
 *
 * The screens this replaces rendered generated numbers, which is worse than an empty
 * page: a health indicator that cannot turn red only ever builds false confidence
 * (ADR-021, INC-038). Until a real reader exists, these pages say so.
 */
export function OperationsNotWired({
  what,
  where = 'Host, container, service and log telemetry live in Grafana on the production host, reachable over an SSH tunnel.',
}: OperationsNotWiredProps) {
  return (
    <EmptyState
      icon={<Activity className="h-6 w-6" />}
      title="Not wired up yet"
      description={`${what} ${where}`}
    />
  );
}
