import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CommunityContributorsService, type PromotionCandidateResponse } from '@busmate/api-client-core';
import { UsersControllerService } from '@busmate/api-client-user';
import type { ContributorRow } from './useContributors';

export interface PromotionCandidateRow {
  contributor: ContributorRow;
  approved: number;
  rejected: number;
  reverted: number;
  approvalRate: number;
}

/**
 * Active contributors whose record clears the promotion thresholds (ADR-022). Advisory: this only
 * decides who staff look at, nothing here promotes anyone. Loads only while its tab is showing.
 */
export function usePromotionCandidates(enabled: boolean) {
  const [candidates, setCandidates] = useState<PromotionCandidateRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result: PromotionCandidateResponse[] = await CommunityContributorsService.listPromotionCandidates();
      const rows = await Promise.all(
        result.map(async (r) => {
          // Names live in user-service; best-effort per row so one missing account never hides the rest.
          let account: ContributorRow['account'];
          try {
            const a = await UsersControllerService.getUser(r.contributor!.userId!);
            account = { fullName: a.fullName, email: a.email };
          } catch {
            account = undefined;
          }
          return {
            contributor: { ...r.contributor!, account },
            approved: r.approved ?? 0,
            rejected: r.rejected ?? 0,
            reverted: r.reverted ?? 0,
            approvalRate: r.approvalRate ?? 0,
          };
        }),
      );
      setCandidates(rows);
    } catch (err) {
      const body = (err as { body?: { message?: string } } | undefined)?.body;
      toast.error(body?.message || (err instanceof Error ? err.message : undefined) || 'Could not load promotion candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { candidates, loading, reload: load };
}
