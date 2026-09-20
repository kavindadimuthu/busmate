'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MapPin, ShieldAlert, Undo2, XCircle } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@busmate/ui';
import { RejectChangesetRequest } from '@busmate/api-client-core';
import { useParams, useRouter } from '@/lib/router';
import { useSetPageMetadata } from '@/context/PageContext';
import { useChangesetReview } from '@/hooks/mot/community/useChangesetReview';
import { StopProposalDiff } from '@/components/mot/community/StopProposalDiff';

const REJECT_REASONS: { value: RejectChangesetRequest.reason; label: string }[] = [
  { value: RejectChangesetRequest.reason.DUPLICATE, label: 'Duplicate of an existing stop' },
  { value: RejectChangesetRequest.reason.WRONG_POSITION, label: 'Position is wrong' },
  { value: RejectChangesetRequest.reason.CANNOT_VERIFY, label: "Can't verify this" },
  { value: RejectChangesetRequest.reason.NOT_A_STOP, label: 'Not a real stop' },
  { value: RejectChangesetRequest.reason.OTHER, label: 'Other' },
];

const AFFILIATION_LABEL: Record<string, string> = {
  NONE: 'No declared link to an operator',
  OPERATOR_EMPLOYEE: 'Works for a bus operator',
  BUS_OWNER: 'Owns or runs buses',
  OTHER: 'Other declared link',
};

const OBSERVATION_LABEL: Record<string, string> = {
  RODE_THE_ROUTE: 'Rode the route past this stop',
  LIVES_OR_WORKS_NEARBY: 'Lives or works nearby',
  TIMETABLE_OR_SIGNBOARD: 'From a timetable or signboard',
  TOLD_BY_CREW: 'A conductor or driver said so',
  OTHER: 'Other',
};

export default function ChangesetReviewDetailPage() {
  const { changesetId } = useParams<{ changesetId: string }>();
  const router = useRouter();
  const { review, proposerAccount, loading, actionLoading, approve, reject, revert } = useChangesetReview(changesetId);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectChangesetRequest.reason | ''>('');
  const [rejectNote, setRejectNote] = useState('');

  useSetPageMetadata({
    title: 'Review Proposal',
    description: 'Compare this proposal with the current stop and decide',
    activeItem: 'community-review',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Community' }, { label: 'Review', href: '/mot/community/review' }, { label: 'Proposal' }],
  });

  if (loading || !review) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { changeset, currentStop, positionDistanceMeters, proposerAffiliation, proposerTrackRecord, targetOutranksCommunityTier, stale } = review;
  const status = changeset?.status;
  const canDecide = status === 'PENDING';
  const canApprove = canDecide && !targetOutranksCommunityTier && !stale;

  const submitReject = async () => {
    if (!rejectReason) return;
    const ok = await reject({ reason: rejectReason, note: rejectNote.trim() || undefined });
    if (ok) {
      setRejectOpen(false);
      setRejectReason('');
      setRejectNote('');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/mot/community/review')}>
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to queue
      </Button>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{changeset?.action === 'CREATE' ? 'New stop proposal' : 'Correction proposal'}</h1>
            <p className="text-xs text-muted-foreground">Proposed {changeset?.createdAt ? new Date(changeset.createdAt).toLocaleString() : ''}</p>
          </div>
        </div>
        <Badge variant={status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary'}>{status}</Badge>
      </div>

      {targetOutranksCommunityTier && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            This stop's data already outranks community observations — it can't be applied here. If a
            correction is genuinely needed, edit the stop directly from Bus Stops. This proposal stays
            visible as a reference.
          </p>
        </div>
      )}
      {stale && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>This stop has changed since the proposal was made. Approving is refused — reject it as outdated if it no longer applies.</p>
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Contributor</h2>
            <span className="text-xs text-muted-foreground">
              {proposerTrackRecord?.approved ?? 0} approved · {proposerTrackRecord?.rejected ?? 0} rejected
            </span>
          </div>
          <p className="text-sm font-medium">{proposerAccount?.fullName ?? changeset?.proposerUserId}</p>
          <p className="text-xs text-muted-foreground">{proposerAccount?.email}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {AFFILIATION_LABEL[proposerAffiliation ?? 'NONE']}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1 text-sm">
          <h2 className="text-sm font-semibold mb-2">How they observed it</h2>
          <p>
            {changeset?.observedOn} — {OBSERVATION_LABEL[changeset?.observationMethod ?? ''] ?? changeset?.observationMethod}
          </p>
          {changeset?.note && <p className="text-muted-foreground italic">"{changeset.note}"</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold mb-3">What would change</h2>
          <StopProposalDiff changeset={changeset} currentStop={currentStop} positionDistanceMeters={positionDistanceMeters} />
        </CardContent>
      </Card>

      {status !== 'PENDING' && changeset?.decisionReason && (
        <Card>
          <CardContent className="p-5 flex gap-3">
            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{changeset.decisionReason}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {canDecide && (
          <>
            <Button onClick={() => approve()} disabled={!canApprove || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Approve
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={actionLoading}>
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
          </>
        )}
        {status === 'APPROVED' && (
          <Button variant="destructive" onClick={() => revert()} disabled={actionLoading}>
            {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
            Revert
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason</Label>
              <Select value={rejectReason} onValueChange={(v) => setRejectReason(v as RejectChangesetRequest.reason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reject-note">Note for the contributor (optional)</Label>
              <Textarea id="reject-note" rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReject} disabled={!rejectReason || actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
