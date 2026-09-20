import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CommunityContributorsService,
  RejectChangesetRequest,
  type ChangesetReviewResponse,
} from '@busmate/api-client-core';
import { UsersControllerService, type UserResponse } from '@busmate/api-client-user';

/** One proposal's full review context, plus the account the proposal came from (INC-031). */
export function useChangesetReview(changesetId: string | undefined) {
  const [review, setReview] = useState<ChangesetReviewResponse | null>(null);
  const [proposerAccount, setProposerAccount] = useState<Pick<UserResponse, 'fullName' | 'email'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!changesetId) return;
    setLoading(true);
    try {
      const result = await CommunityContributorsService.getChangesetForReview(changesetId);
      setReview(result);
      if (result.changeset?.proposerUserId) {
        try {
          const account = await UsersControllerService.getUser(result.changeset.proposerUserId);
          setProposerAccount({ fullName: account.fullName, email: account.email });
        } catch {
          setProposerAccount(null);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      const body = (err as { body?: { message?: string } } | undefined)?.body;
      toast.error(body?.message || message || 'Could not load this proposal.');
    } finally {
      setLoading(false);
    }
  }, [changesetId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setActionLoading(true);
      try {
        await action();
        toast.success(successMessage);
        await load();
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
    [load],
  );

  const approve = useCallback(
    () => changesetId && runAction(() => CommunityContributorsService.approveChangeset(changesetId), 'Proposal approved'),
    [changesetId, runAction],
  );
  const reject = useCallback(
    (request: RejectChangesetRequest) =>
      changesetId && runAction(() => CommunityContributorsService.rejectChangeset(changesetId, request), 'Proposal rejected'),
    [changesetId, runAction],
  );
  const revert = useCallback(
    () => changesetId && runAction(() => CommunityContributorsService.revertChangeset(changesetId), 'Approval reverted'),
    [changesetId, runAction],
  );

  return { review, proposerAccount, loading, actionLoading, approve, reject, revert };
}
