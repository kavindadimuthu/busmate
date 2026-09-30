import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, HeartHandshake, MapPin, Plus, RefreshCw, XCircle } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary, noticeSecondary } from "@/components/findmybus/noticeStyles";
import { Chip } from "@/components/findmybus/FilterControls";
import ProposalStatus from "@/components/contribute/ProposalStatus";
import AgreementAccept from "@/components/contribute/AgreementAccept";
import { useCorridorNames, useStanding } from "@/lib/standingApi";
import { useMyProposals } from "@/lib/contributionsApi";
import { BUILT, roleOf } from "@/lib/account.ts";
import { countByStatus, filterProposals, formatDay, proposalKind, proposalTitle, STATUSES, statusLabel } from "@/lib/contributions.ts";

const PAGE = 50;

const Panel = ({ icon, title, children, tone = "plain" }: { icon: React.ReactNode; title: string; children?: React.ReactNode; tone?: "plain" | "good" }) => (
  <section aria-label="Your standing" className={`flex gap-3.5 rounded-2xl border p-4 md:p-5 ${tone === "good" ? "border-green-200 bg-green-50 dark:border-green-400/30 dark:bg-green-500/10" : "border-border bg-card"}`}>
    <span className="mt-0.5 flex-none" aria-hidden>{icon}</span>
    <div className="min-w-0 flex-1">
      <h3 className="text-[15px] font-extrabold leading-snug">{title}</h3>
      {children && <div className="mt-1.5 grid gap-3 text-[13px] leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  </section>
);

/** Where a contributor stands, and everything they've proposed. What appears depends on their standing; core-service
 * decides what they may actually do. */
export default function MyContributionsPage() {
  const location = useLocation();
  const justApplied = (location.state as { justApplied?: boolean } | null)?.justApplied === true;
  const standingQuery = useStanding();
  const standing = standingQuery.data;
  const role = roleOf(standing);
  const corridors = useCorridorNames(role === "steward" ? standing?.contributor?.stewardScopeRouteGroupIds : undefined);
  const involved = role !== null && role !== "passenger" && role !== "other";
  const proposalsQuery = useMyProposals(PAGE, involved);
  const proposals = useMemo(() => proposalsQuery.data?.content ?? [], [proposalsQuery.data]);
  const total = proposalsQuery.data?.totalElements ?? proposals.length;
  const [filter, setFilter] = useState("ALL");
  const counts = useMemo(() => countByStatus(proposals), [proposals]);
  const shown = useMemo(() => filterProposals(proposals, filter), [proposals, filter]);
  const c = standing?.contributor;

  useEffect(() => {
    document.title = "Contributions · BusMate";
  }, []);

  const body = (() => {
    if (standingQuery.isError) {
      return (
        <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't load your contributions" actions={<button type="button" onClick={() => standingQuery.refetch()} className={noticePrimary}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</button>}>
          Check your connection and try again.
        </Notice>
      );
    }
    if (!standing) return <div role="status" aria-busy aria-label="Loading your contributions" className="grid gap-4"><div className="h-28 animate-pulse rounded-2xl border border-border bg-card" /><div className="h-40 animate-pulse rounded-2xl border border-border bg-card" /></div>;
    if (role === "other") {
      return <Notice icon={<HeartHandshake className="h-6 w-6" />} title="Contributing is for passenger accounts">This account is a staff account. Staff review contributions in the management portal.</Notice>;
    }
    if (role === "passenger") {
      return (
        <Notice icon={<HeartHandshake className="h-6 w-6" />} title="You haven't applied to contribute" actions={<Link to="/contribute" className={noticePrimary}>About contributing</Link>}>
          Contributors add stops and say who runs a bus, and their proposals are checked by others before anyone sees them.
        </Notice>
      );
    }
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {justApplied && (
          <p role="status" className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900 dark:border-green-400/30 dark:bg-green-500/10 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5 flex-none" aria-hidden />
            Application submitted. Staff will look at it soon.
          </p>
        )}

        {role === "applicant" && (
          <Panel icon={<Clock className="h-7 w-7 text-amber-500" />} title="Your application is under review">
            <p>{c?.appliedAt ? `Applied ${formatDay(c.appliedAt)}. ` : ""}We'll show the decision here. There's nothing more you need to do right now.</p>
          </Panel>
        )}
        {(role === "contributor" || role === "steward") && (
          <Panel icon={<CheckCircle2 className="h-7 w-7 text-green-600" />} title={role === "steward" ? "You're a steward" : "You're a contributor"} tone="good">
            <p>{role === "steward" ? (corridors.length > 0 ? `Thank you for helping. You review proposals on ${corridors.join(", ")}.` : "Thank you for helping. You review other contributors' proposals.") : "Thanks for helping map the network."}</p>
            {BUILT.proposals && (
              <Link to="/contribute/propose" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Plus className="h-4 w-4" aria-hidden />
                Propose a stop
              </Link>
            )}
          </Panel>
        )}
        {role === "agreement-due" && <AgreementAccept />}
        {role === "suspended" && (
          <Panel icon={<XCircle className="h-7 w-7 text-destructive" />} title="Your contributor access is suspended">
            {c?.decisionReason?.trim() ? <p>{c.decisionReason}</p> : <p>Contact BusMate if you'd like to know more.</p>}
          </Panel>
        )}
        {role === "declined" && (
          <Panel icon={<XCircle className="h-7 w-7 text-muted-foreground" />} title="Your application wasn't accepted">
            <p>{c?.decisionReason?.trim() || "No reason was given."}</p>
            <Link to="/contribute/apply" className={`${noticeSecondary} w-full sm:w-fit`}>Apply again</Link>
          </Panel>
        )}

        {proposalsQuery.isError ? (
          <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't load your proposals" actions={<button type="button" onClick={() => proposalsQuery.refetch()} className={noticePrimary}>Try again</button>}>
            Check your connection and try again.
          </Notice>
        ) : proposalsQuery.isPending ? (
          <div role="status" aria-busy aria-label="Loading your proposals" className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
        ) : proposals.length === 0 ? (
          role === "applicant" || role === "declined" || role === "suspended" || role === "agreement-due" ? null : (
            <Notice icon={<MapPin className="h-6 w-6" />} title="You haven't proposed anything yet">Your proposals will appear here, with what reviewers decided.</Notice>
          )
        ) : (
          <section aria-label="Your proposals" className="grid grid-cols-[minmax(0,1fr)] gap-3">
            <h3 className="text-[15px] font-extrabold">Your proposals</h3>
            <div role="group" aria-label="Filter by status" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 min-[360px]:-mx-4 min-[360px]:px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
              <Chip pressed={filter === "ALL"} onClick={() => setFilter("ALL")}>
                All <span className="text-xs font-medium opacity-80">{proposals.length}</span>
              </Chip>
              {STATUSES.filter((s) => counts[s]).map((s) => (
                <Chip key={s} pressed={filter === s} onClick={() => setFilter(filter === s ? "ALL" : s)}>
                  {statusLabel(s)} <span className="text-xs font-medium opacity-80">{counts[s]}</span>
                </Chip>
              ))}
            </div>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
              {shown.map((p) => (
                <li key={p.id}>
                  <Link to={`/contribute/mine/${p.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold">{proposalTitle(p.entityType, p.proposedValues)}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {proposalKind(p.entityType, p.action)}
                        {p.createdAt ? ` · ${formatDay(p.createdAt)}` : ""}
                      </span>
                    </span>
                    <span className="flex flex-none items-center gap-2">
                      <ProposalStatus status={p.status} />
                      <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {total > proposals.length && <p className="text-center text-xs text-muted-foreground">Showing your latest {proposals.length} of {total} proposals.</p>}
          </section>
        )}
      </div>
    );
  })();

  return (
    <AccountLayout>
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight">Contributions</h2>
        {body}
      </div>
    </AccountLayout>
  );
}
