import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, ExternalLink, Loader2, RefreshCw, SearchX, XCircle } from "lucide-react";
import { CommunityContributorsService } from "@busmate/api-client-core";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import ProposalStatus from "@/components/contribute/ProposalStatus";
import ProposalRows from "@/components/contribute/ProposalRows";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMyProposals } from "@/lib/contributionsApi";
import { communityMessage } from "@/lib/community/errors";
import { formatDay, isWorking, mapsLink, observationLabel, proposalKind, proposalTitle, stopRows, workingRows } from "@/lib/contributions.ts";

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
    {title && <h2 className="mb-3 text-[15px] font-extrabold">{title}</h2>}
    {children}
  </section>
);

/** One proposal: what was proposed (against what it changes, for a correction), how the contributor knows, and what a
 * reviewer decided and said. A proposal still under review can be withdrawn. */
export default function ContributionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  // There's no single-proposal read, so the contributor's most recent proposals are read and this one picked out.
  const query = useMyProposals(100);
  const proposal = (query.data?.content ?? []).find((p) => p.id === id);
  const [confirm, setConfirm] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    document.title = proposal ? `${proposalTitle(proposal.entityType, proposal.proposedValues)} · BusMate` : "Proposal · BusMate";
  }, [proposal]);

  const withdraw = useMutation({
    mutationFn: () => CommunityContributorsService.withdrawChangeset(id!),
    onSuccess: async () => {
      setConfirm(false);
      await qc.invalidateQueries({ queryKey: ["my-proposals"] });
    },
    onError: (e) => {
      setConfirm(false);
      setProblem(communityMessage(e, "We couldn't withdraw this proposal. Please try again."));
    },
  });

  const hero = (
    <PageHero compact>
      <HeroBackLink to="/contribute/mine">My contributions</HeroBackLink>
      <h1 className="mt-1 text-[clamp(22px,6vw,36px)] font-extrabold leading-[1.15] tracking-[-0.02em]">{proposal ? proposalKind(proposal.entityType, proposal.action) : "Proposal"}</h1>
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="mx-auto max-w-2xl px-3 pb-16 pt-5 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (query.isError) {
    return shell(
      <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't load this proposal" actions={<button type="button" onClick={() => query.refetch()} className={noticePrimary}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</button>}>
        Check your connection and try again.
      </Notice>,
    );
  }
  if (query.isPending) return shell(<div role="status" aria-busy aria-label="Loading the proposal" className="grid gap-4"><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /><div className="h-24 animate-pulse rounded-2xl border border-border bg-card" /></div>);
  if (!proposal) {
    return shell(
      <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="We couldn't find that proposal" actions={<Link to="/contribute/mine" className={noticePrimary}>My contributions</Link>}>
        It may not be yours, or it may be older than the latest 100 you've made.
      </Notice>,
    );
  }

  const rows = isWorking(proposal.entityType) ? workingRows(proposal) : stopRows(proposal);
  const map = isWorking(proposal.entityType) ? null : mapsLink(proposal.proposedValues);
  const decided = proposal.status !== "PENDING";

  return shell(
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-lg font-extrabold leading-tight">{proposalTitle(proposal.entityType, proposal.proposedValues)}</p>
        <ProposalStatus status={proposal.status} />
      </div>

      <Card title="What you proposed">
        <ProposalRows rows={rows} />
        {map && (
          <a href={map} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View the position on Google Maps
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        )}
      </Card>

      <Card title="How you know">
        <dl className="grid gap-3 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">Observed</dt>
            <dd className="font-semibold">{[formatDay(proposal.observedOn), observationLabel(proposal.entityType, proposal.observationMethod)].filter(Boolean).join(" · ") || "—"}</dd>
          </div>
          {proposal.note && (
            <div className="grid gap-0.5">
              <dt className="text-xs text-muted-foreground">Your note</dt>
              <dd className="whitespace-pre-wrap break-words font-semibold">{proposal.note}</dd>
            </div>
          )}
        </dl>
      </Card>

      {decided && proposal.decisionReason && (
        <section className={`flex gap-3 rounded-2xl border p-4 md:p-5 ${proposal.status === "REJECTED" ? "border-red-200 bg-red-50 dark:border-red-400/30 dark:bg-red-500/10" : "border-border bg-card"}`}>
          {proposal.status === "REJECTED" && <XCircle className="mt-0.5 h-5 w-5 flex-none text-destructive" aria-hidden />}
          <div>
            <h2 className="text-[15px] font-extrabold">The reviewer's note</h2>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">{proposal.decisionReason}</p>
          </div>
        </section>
      )}
      {proposal.status === "REVERTED" && <p className="rounded-2xl border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground md:p-5">This was approved, but a reviewer later undid it.</p>}

      {problem && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
          {problem}
        </p>
      )}
      {proposal.status === "PENDING" && (
        <button type="button" onClick={() => { setProblem(null); setConfirm(true); }} disabled={withdraw.isPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-red-300 px-6 text-[15px] font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10">
          {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Withdraw this proposal
        </button>
      )}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent variant="sheet">
          <DialogTitle>Withdraw this proposal?</DialogTitle>
          <DialogDescription>It won't be reviewed and nothing will change. You can propose it again later.</DialogDescription>
          <div className="grid gap-2">
            <button type="button" disabled={withdraw.isPending} onClick={() => withdraw.mutate()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">
              {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Yes, withdraw it
            </button>
            <DialogClose className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-border px-6 text-sm font-bold hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Keep it</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>,
  );
}
