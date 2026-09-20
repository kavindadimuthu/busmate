import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CommunityContributorsService,
  type ChangesetReviewResponse,
  type ChangesetResponse,
} from '@busmate/api-client-core';
import { UsersControllerService, type UserResponse } from '@busmate/api-client-user';

export type QueueTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERTED' | 'WITHDRAWN';

export interface QueueRow extends ChangesetReviewResponse {
  proposerAccount?: Pick<UserResponse, 'fullName' | 'email'>;
}

function stopName(c?: ChangesetResponse): string {
  const values = c?.proposedValues as { name?: string } | undefined;
  return values?.name ?? 'Untitled proposal';
}

/** The staff review queue for stop proposals: real API, no mock resource layer (INC-031). */
export function useChangesetQueue(tab: QueueTab) {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await CommunityContributorsService.listChangesetsForReview(tab, undefined, undefined, page, pageSize);
      const content = result.content ?? [];
      setRows(content);
      setTotalItems(result.totalElements ?? 0);
      const withAccounts = await Promise.all(
        content.map(async (row) => {
          try {
            const account = await UsersControllerService.getUser(row.changeset!.proposerUserId!);
            return { ...row, proposerAccount: { fullName: account.fullName, email: account.email } };
          } catch {
            return row;
          }
        }),
      );
      setRows(withAccounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      const body = (err as { body?: { message?: string } } | undefined)?.body;
      toast.error(body?.message || message || 'Could not load the review queue.');
    } finally {
      setLoading(false);
    }
  }, [tab, page, pageSize]);

  // Switching tabs resets to page 0; done inside this single effect (rather than a separate
  // one) so a tab change never fires a request for the old tab's stale page first.
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current !== tab) {
      previousTab.current = tab;
      if (page !== 0) {
        setPage(0);
        return;
      }
    }
    load();
  }, [tab, page, load]);

  return { rows, totalItems, page, pageSize, loading, setPage, setPageSize, refresh: load, stopName };
}
