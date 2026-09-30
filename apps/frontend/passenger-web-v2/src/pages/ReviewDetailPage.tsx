import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Check, ExternalLink, Info, Loader2, RefreshCw, SearchX, X } from "lucide-react";
import { CommunityContributorsService, type RejectChangesetRequest } from "@busmate/api-client-core";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import ProposalRows from "@/components/contribute/ProposalRows";
import ProposalStatus from "@/components/contribute/ProposalStatus";
import { RadioCard, TextAreaField } from "@/components/form/controls";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useStanding } from "@/lib/standingApi";
import { useReviewItem } from "@/lib/reviewApi";
import { communityMessage, statusOf } from "@/lib/community/errors";
import { formatDay, isWorking, mapsLink, observationLabel, proposalKind, proposalTitle, stopRows, workingRows } from "@/lib/contributions.ts";
import { affiliationText, decisionOf, distanceText, NOTE_MAX, rejectProblems, rejectReasons, rejectRequest, trackText } from "@/lib/review.ts";

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
    <h2 className="mb-3 text-[15px] font-extrabold">{title}</h2>
    {children}
  </section>
);

const CLASS_LABEL: Record<string, string> = { NORMAL: "Normal", SEMI_LUXURY: "Semi-luxury", LUXURY: "Luxury", SUPER_LUXURY: "Super luxury", EXPRESSWAY_SUPER_LUXURY: "Expressway super luxury" };

/** One proposal for a steward to judge: what it says (against what is recorded now), how the contributor knows, their
 * record, and Approve or Reject. core-service enforces scope, self-review and out-of-date proposals. */
export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const standing = useStanding().data;
  const isSteward = standing?.activeSteward === true;
  const query = useReviewItem(id, isSteward);
  const item = query.data;
  const c = item?.changeset;
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [shown, setShown] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    document.title = c ? `${proposalTitle(c.entityType, c.proposedValues)} · Review · BusMate` : "Review · BusMate";
  }, [c]);

  const done = async (decided: "approved" | "rejected") => {
    await qc.invalidateQueries({ queryKey: ["review-queue"] });
    await qc.invalidateQueries({ queryKey: ["review-item"] });
    navigate("/contribute/review", { state: { decided }, replace: true });
  };
  const failed = (e: unknown, fallback: string) => {
    setConfirmApprove(false);
    setRejecting(false);
    setProblem(communityMessage(e, fallback));
    // A refusal usually means the proposal changed under us (someone else decided, or the stop moved); show it as it is now.
    if (statusOf(e) === 409 || statusOf(e) === 403) {
      qc.invalidateQueries({ queryKey: ["review-item"] });
      qc.invalidateQueries({ queryKey: ["review-queue"] });
    }
  };
  const approve = useMutation({
    mutationFn: () => CommunityContributorsService.approveChangeset(id!),
    onSuccess: () => done("approved"),
    onError: (e) => failed(e, "We couldn't approve this. Please try again."),
  });
  const reject = useMutation({
    mutationFn: () => CommunityContributorsService.rejectChangeset(id!, rejectRequest({ reason, note }) as RejectChangesetRequest),
    onSuccess: () => done("rejected"),
    onError: (e) => failed(e, "We couldn't record that. Please try again."),
  });

  const hero = (
    <PageHero compact>
      <HeroBackLink to="/contribute/review">Review</HeroBackLink>
      <h1 className="mt-1 text-[clamp(22px,6vw,36px)] font-extrabold leading-[1.15] tracking-[-0.02em]">{c ? proposalKind(c.entityType, c.action) : "Proposal"}</h1>
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="mx-auto max-w-2xl px-3 pb-24 pt-5 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (standing && !isSteward) {
    return shell(<Notice icon={<AlertTriangle className="h-6 w-6" />} title="Reviewing is for stewards" actions={<Link to="/contribute/mine" className={noticePrimary}>My contributions</Link>}>Only stewards can open a proposal to review it.</Notice>);
  }
  if (query.isError) {
    const st = statusOf(query.error);
    return shell(
      <Notice role="alert" icon={st === 403 || st === 404 ? <SearchX className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />} title={st === 403 || st === 404 ? "You can't review this one" : "We couldn't load this proposal"} actions={st === 403 || st === 404 ? <Link to="/contribute/review" className={noticePrimary}>Back to the queue</Link> : <button type="button" onClick={() => query.refetch()} className={noticePrimary}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</button>}>
        {st === 403 || st === 404 ? "It may be outside your corridors, or it may be your own." : "Check your connection and try again."}
      </Notice>,
    );
  }
  if (!item || !c) return shell(<div role="status" aria-busy aria-label="Loading the proposal" className="grid gap-4"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /><div className="h-24 animate-pulse rounded-2xl border border-border bg-card" /></div>);

  const working = isWorking(c.entityType);
  const rows = working ? workingRows(c) : stopRows(c);
  const decision = decisionOf(item);
  const proposedMap = working ? null : mapsLink(c.proposedValues);
  const currentMap = working ? null : mapsLink(item.currentStop ?? null) ?? mapsLink(c.targetSnapshot);
  const dist = distanceText(item.positionDistanceMeters);
  const link = affiliationText(item.proposerAffiliation);
  const ctx = item.scheduleContext;
  const rejectErrors = shown ? rejectProblems({ reason, note }, c.entityType) : {};

  const submitReject = () => {
    setShown(true);
    if (Object.keys(rejectProblems({ reason, note }, c.entityType)).length > 0) return;
    reject.mutate();
  };
  const busy = approve.isPending || reject.isPending;

  return shell(
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-lg font-extrabold leading-tight">{proposalTitle(c.entityType, c.proposedValues)}</p>
        <ProposalStatus status={c.status} />
      </div>

      {problem && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
          {problem}
        </p>
      )}
      {decision.approveBlockedText && (
        <p role="status" className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Info className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
          {decision.approveBlockedText}
        </p>
      )}

      <Card title={c.action === "UPDATE" ? "What it would change" : "What is proposed"}>
        {rows.length > 0 ? <ProposalRows rows={rows} /> : <p className="text-sm text-muted-foreground">Nothing differs from what is recorded.</p>}
        {(dist || proposedMap) && (
          <div className="mt-3 grid gap-1 text-[13px] text-muted-foreground">
            {dist && c.action === "UPDATE" && <p>The position moves {dist}.</p>}
            <div className="flex flex-wrap gap-x-4">
              {proposedMap && (
                <a href={proposedMap} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  See the proposed position
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
              {currentMap && c.action === "UPDATE" && (
                <a href={currentMap} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  See where it is now
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

      {working && ctx && (
        <Card title="The departure">
          <p className="text-sm font-semibold">{[ctx.routeNumber, ctx.routeName].filter(Boolean).join(" · ") || "Route not named"}</p>
          {ctx.scheduleName && <p className="mt-0.5 text-[13px] text-muted-foreground">{ctx.scheduleName}</p>}
          <h3 className="mb-1.5 mt-3 text-xs font-bold text-muted-foreground">Already recorded for it</h3>
          {(ctx.currentWorkings ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody yet.</p>
          ) : (
            <ul className="grid gap-2">
              {(ctx.currentWorkings ?? []).map((w) => (
                <li key={w.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                  <span className="font-semibold">{w.operatorNameObserved || w.operatorName || "Operator not stated"}</span>
                  <span className="block text-[13px] text-muted-foreground">
                    {[(w.vehicles ?? []).map((v) => v.plateObserved || v.plate).filter(Boolean).join(" or "), w.serviceClass ? CLASS_LABEL[w.serviceClass] ?? w.serviceClass : ""].filter(Boolean).join(" · ") || "No plate or class"}
                    {w.effectiveEndDate ? ` · ended ${formatDay(w.effectiveEndDate)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card title="How they know">
        <dl className="grid gap-3 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Observed</dt>
            <dd className="font-semibold">{[formatDay(c.observedOn), observationLabel(c.entityType, c.observationMethod)].filter(Boolean).join(" · ") || "—"}</dd>
          </div>
          {c.note && (
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Their note</dt>
              <dd className="whitespace-pre-wrap break-words font-semibold">{c.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card title="About the contributor">
        <p className="text-sm font-semibold">{trackText(item.proposerTrackRecord)}</p>
        {link && <p className="mt-1 text-[13px] text-muted-foreground">{link}. Weigh what they say about a bus with that in mind.</p>}
        <p className="mt-1 text-[13px] text-muted-foreground">Sent {formatDay(c.createdAt)}. Their name isn't shown to you.</p>
      </Card>

      {c.status !== "PENDING" && (
        <Card title="Decision">
          <p className="text-sm font-semibold">{c.decidedAt ? `Decided ${formatDay(c.decidedAt)}` : "Decided"}</p>
          {c.decisionReason && <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted-foreground">{c.decisionReason}</p>}
        </Card>
      )}

      {decision.canReject && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 py-3 backdrop-blur min-[360px]:px-4 md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => { setProblem(null); setShown(false); setReason(""); setNote(""); setRejecting(true); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-[1.5px] border-red-300 px-4 text-[15px] font-bold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">
              <X className="h-4 w-4" aria-hidden />
              Reject
            </button>
            <button type="button" disabled={busy || !decision.canApprove} onClick={() => { setProblem(null); setConfirmApprove(true); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 text-[15px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              <Check className="h-4 w-4" aria-hidden />
              Approve
            </button>
          </div>
        </div>
      )}

      <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <DialogContent variant="sheet">
          <DialogTitle>Approve this proposal?</DialogTitle>
          <DialogDescription>{working ? "It will be recorded for the departure as seen by a contributor, not confirmed by the operator." : "It will change the stop on the network, marked as seen by a contributor. Passengers will see it."}</DialogDescription>
          <div className="grid gap-2">
            <button type="button" disabled={approve.isPending} onClick={() => approve.mutate()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
              {approve.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Yes, approve it
            </button>
            <DialogClose className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-border px-6 text-sm font-bold hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Go back</DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent variant="sheet">
          <DialogTitle>Why isn't it approved?</DialogTitle>
          <DialogDescription>The contributor will see this.</DialogDescription>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Reason</legend>
            {rejectReasons(c.entityType).map((r) => (
              <RadioCard key={r.value} name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)}>{r.label}</RadioCard>
            ))}
            {rejectErrors.reason && <p role="alert" className="text-[13px] font-medium text-destructive">{rejectErrors.reason}</p>}
          </fieldset>
          <TextAreaField label={reason === "OTHER" ? "What's wrong" : "A note (optional)"} className="min-h-20" value={note} onChange={(e) => setNote(e.target.value)} error={rejectErrors.note} hint={`${note.trim().length}/${NOTE_MAX}`} />
          <div className="grid gap-2">
            <button type="button" disabled={reject.isPending} onClick={submitReject} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
              {reject.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Reject it
            </button>
            <DialogClose className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-border px-6 text-sm font-bold hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Go back</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
  );
}
