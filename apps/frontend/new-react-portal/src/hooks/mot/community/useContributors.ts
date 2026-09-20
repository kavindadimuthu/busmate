import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CommunityContributorsService,
  type ContributorCountsResponse,
  type ContributorResponse,
} from '@busmate/api-client-core';
import { UsersControllerService, type UserResponse } from '@busmate/api-client-user';

/** A contributor row plus the account name/email, which live in user-service, not core-service. */
export interface ContributorRow extends ContributorResponse {
  account?: Pick<UserResponse, 'fullName' | 'email'>;
}

export type ContributorTab = 'APPLIED' | 'ACTIVE' | 'DECLINED' | 'SUSPENDED';

/** The community review queue: one status tab at a time, real API, no mock resource layer. */
export function useContributors(tab: ContributorTab) {
  const [contributors, setContributors] = useState<ContributorRow[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState<ContributorCountsResponse | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContributorRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await CommunityContributorsService.countContributors());
    } catch {
      // Counts are a convenience badge; a failure here shouldn't block the list.
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await CommunityContributorsService.listContributors(tab, page, pageSize);
      const rows = result.content ?? [];
      setContributors(rows);
      setTotalItems(result.totalElements ?? 0);
      // Names and emails live in user-service; fetch them alongside, best-effort per row so
      // one missing account never blocks the rest of the list from rendering.
      const withAccounts = await Promise.all(
        rows.map(async (row) => {
          try {
            const account = await UsersControllerService.getUser(row.userId!);
            return { ...row, account: { fullName: account.fullName, email: account.email } };
          } catch {
            return row;
          }
        }),
      );
      setContributors(withAccounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      const body = (err as { body?: { message?: string } } | undefined)?.body;
      toast.error(body?.message || message || 'Could not load contributors.');
    } finally {
      setLoading(false);
    }
  }, [tab, page, pageSize]);

  // One page load per (tab, page, pageSize) change; switching tabs also resets to page 0, done
  // here rather than as a separate effect so it can't fire a stale request for the old tab first.
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current !== tab) {
      previousTab.current = tab;
      if (page !== 0) {
        setPage(0);
        return; // the page-change re-run below does the actual load
      }
    }
    load();
    loadCounts();
  }, [tab, page, pageSize, load, loadCounts]);

  const refresh = useCallback(() => {
    load();
    loadCounts();
  }, [load, loadCounts]);

  const withReload = useCallback(
    async (action: () => Promise<ContributorResponse>, successMessage: string) => {
      setActionLoading(true);
      try {
        const updated = await action();
        toast.success(successMessage);
        setSelected((prev) => (prev ? { ...updated, account: prev.account } : updated));
        refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : undefined;
        const body = (err as { body?: { message?: string } } | undefined)?.body;
        toast.error(body?.message || message || 'That action could not be completed.');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [refresh],
  );

  const accept = useCallback(
    (userId: string) => withReload(() => CommunityContributorsService.acceptContributor(userId), 'Contributor accepted'),
    [withReload],
  );
  const decline = useCallback(
    (userId: string, reason: string) =>
      withReload(() => CommunityContributorsService.declineContributor(userId, { reason }), 'Application declined'),
    [withReload],
  );
  const suspend = useCallback(
    (userId: string, reason: string) =>
      withReload(() => CommunityContributorsService.suspendContributor(userId, { reason }), 'Contributor suspended'),
    [withReload],
  );
  const reinstate = useCallback(
    (userId: string) => withReload(() => CommunityContributorsService.reinstateContributor(userId), 'Contributor reinstated'),
    [withReload],
  );

  return {
    contributors,
    totalItems,
    counts,
    page,
    pageSize,
    loading,
    actionLoading,
    selected,
    setSelected,
    setPage,
    setPageSize,
    accept,
    decline,
    suspend,
    reinstate,
  };
}
