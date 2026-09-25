import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StewardGate from "@/components/contribute/StewardGate";
import ProposalDiff from "@/components/contribute/ProposalDiff";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CommunityContributorsService,
  RejectChangesetRequest,
  type ChangesetReviewResponse,
} from "@busmate/api-client-core";
import { coreErrorMessage } from "@/lib/coreError";
import WorkingProposalDetail from "@/components/contribute/WorkingProposalDetail";
import { isWorking, proposalKind } from "@/lib/proposalLabel";

const REJECT_REASONS: { value: RejectChangesetRequest.reason; label: string }[] = [
  { value: RejectChangesetRequest.reason.DUPLICATE, label: "Duplicate of an existing stop" },
  { value: RejectChangesetRequest.reason.WRONG_POSITION, label: "Position is wrong" },
  { value: RejectChangesetRequest.reason.CANNOT_VERIFY, label: "Can't verify this" },
  { value: RejectChangesetRequest.reason.NOT_A_STOP, label: "Not a real stop" },
  { value: RejectChangesetRequest.reason.OTHER, label: "Other" },
];

const AFFILIATION_LABEL: Record<string, string> = {
  NONE: "No declared link to an operator",
  OPERATOR_EMPLOYEE: "Works for a bus operator",
  BUS_OWNER: "Owns or runs buses",
  OTHER: "Other declared link",
};

const OBSERVATION_LABEL: Record<string, string> = {
  RODE_THE_ROUTE: "Rode the route past this stop",
  LIVES_OR_WORKS_NEARBY: "Lives or works nearby",
  TIMETABLE_OR_SIGNBOARD: "From a timetable or signboard",
  TOLD_BY_CREW: "A conductor or driver said so",
  OTHER: "Other",
};

/**
 * One proposal, for a steward to decide (INC-042, ADR-022). Deliberately shows no proposer identity — the
 * server withholds it — only their declared affiliation and record, which is what a reviewer needs.
 */
function Review() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<ChangesetReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<RejectChangesetRequest.reason | "">("");
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setReview(await CommunityContributorsService.getChangesetForReview(id));
    } catch (err) {
      setError(coreErrorMessage(err, "Could not load this proposal."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (action: () => Promise<unknown>, done: string) => {
    setActing(true);
    try {
      await action();
      toast.success(done);
      await load();
      return true;
    } catch (err) {
      toast.error(coreErrorMessage(err, "That couldn't be completed."));
      return false;
    } finally {
      setActing(false);
    }
  };

  const approve = () => id && decide(() => CommunityContributorsService.approveChangeset(id), "Proposal approved");

  const reject = async () => {
    if (!id || !rejectReason) return;
    const ok = await decide(
      () =>
        CommunityContributorsService.rejectChangeset(id, {
          reason: rejectReason,
          note: rejectNote.trim() || undefined,
        }),
      "Proposal rejected",
    );
    if (ok) {
      setRejectOpen(false);
      setRejectReason("");
      setRejectNote("");
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/contribute/review")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to the queue
        </Button>
        {children}
      </main>
      <Footer />
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>,
    );
  }
  if (error || !review) {
    return shell(
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error ?? "Not found."}</AlertDescription>
      </Alert>,
    );
  }

  const { changeset, currentStop, positionDistanceMeters, proposerAffiliation, proposerTrackRecord } = review;
  const working = isWorking(changeset?.entityType);
  // Reasons that read wrongly for a working (a stop's position, "not a real stop") are not offered for one.
  const reasons = working
    ? [
        { value: RejectChangesetRequest.reason.DUPLICATE, label: "Already recorded for this departure" },
        { value: RejectChangesetRequest.reason.CANNOT_VERIFY, label: "Can't verify this" },
        { value: RejectChangesetRequest.reason.OTHER, label: "Other" },
      ]
    : REJECT_REASONS;
  const pending = changeset?.status === "PENDING";
  const canApprove = pending && !review.targetOutranksCommunityTier && !review.stale;

  return shell(
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {proposalKind(changeset?.entityType, changeset?.action)}
          </h1>
          <p className="text-xs text-muted-foreground">
            Proposed {changeset?.createdAt ? new Date(changeset.createdAt).toLocaleString() : ""}
          </p>
        </div>
        <Badge variant={changeset?.status === "REJECTED" ? "destructive" : "secondary"}>{changeset?.status}</Badge>
      </div>

      {review.targetOutranksCommunityTier && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            This stop's data already outranks community observations, so it can't be changed here. Reject it,
            or leave it for staff to consider as a correction.
          </p>
        </div>
      )}
      {review.stale && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>The stop has changed since this was proposed, so it can't be approved. Reject it as outdated.</p>
        </div>
      )}

      <Card>
        <CardContent className="p-5 space-y-1 text-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-foreground">The contributor</h2>
            <span className="text-xs text-muted-foreground">
              {proposerTrackRecord?.approved ?? 0} approved · {proposerTrackRecord?.rejected ?? 0} rejected ·{" "}
              {proposerTrackRecord?.reverted ?? 0} reverted
            </span>
          </div>
          <p className="text-muted-foreground">{AFFILIATION_LABEL[proposerAffiliation ?? "NONE"]}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-1 text-sm">
          <h2 className="text-sm font-semibold text-foreground mb-1">How they know</h2>
          <p>
            {changeset?.observedOn} —{" "}
            {OBSERVATION_LABEL[changeset?.observationMethod ?? ""] ?? changeset?.observationMethod}
          </p>
          {changeset?.note && <p className="text-muted-foreground italic">"{changeset.note}"</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">What would change</h2>
          {working ? (
            <WorkingProposalDetail changeset={changeset} context={review.scheduleContext} />
          ) : (
            <ProposalDiff changeset={changeset} currentStop={currentStop} positionDistanceMeters={positionDistanceMeters} />
          )}
        </CardContent>
      </Card>

      {!pending && changeset?.decisionReason && (
        <Card>
          <CardContent className="p-5 flex gap-3">
            <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{changeset.decisionReason}</p>
          </CardContent>
        </Card>
      )}

      {pending && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={approve} disabled={!canApprove || acting} className="bg-gradient-primary">
            {acting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Approve
          </Button>
          <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={acting}>
            <XCircle className="h-4 w-4 mr-2" /> Reject
          </Button>
        </div>
      )}

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
                  {reasons.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="steward-reject-note">A note for the contributor (optional)</Label>
              <Textarea id="steward-reject-note" rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={reject} disabled={!rejectReason || acting}>
              {acting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>,
  );
}

export default function StewardReviewPage() {
  return (
    <StewardGate>
      <Review />
    </StewardGate>
  );
}
