import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, RefreshCw, ShieldAlert } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { Chip } from "@/components/findmybus/FilterControls";
import { useCorridorNames, useStanding } from "@/lib/standingApi";
import { useReviewQueue, type QueueKind, type QueueStatus } from "@/lib/reviewApi";
import { KIND_FILTERS, type KindFilter, distanceText, waitingText } from "@/lib/review.ts";
import { formatDay, proposalKind, proposalTitle } from "@/lib/contributions.ts";

const PAGE = 50;
const STATUS_CHIPS: { value: QueueStatus; label: string }[] = [
  { value: "PENDING", label: "Waiting" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Not approved" },
];

/** A steward's queue: proposals inside their corridors, oldest first so the longest wait is at the top. Who proposed
 * each is hidden by core-service and their own proposals are left out. */
export default function ReviewQueuePage() {
  const location = useLocation();
  const decided = (location.state as { decided?: "approved" | "rejected" } | null)?.decided;
  const standingQuery = useStanding();
  const standing = standingQuery.data;
  const isSteward = standing?.activeSteward === true;
  const corridors = useCorridorNames(isSteward ? standing?.contributor?.stewardScopeRouteGroupIds : undefined);
  const [status, setStatus] = useState<QueueStatus>("PENDING");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const query = useReviewQueue(status, kind === "ALL" ? undefined : (kind as QueueKind), PAGE, isSteward);
  const items = useMemo(() => query.data?.content ?? [], [query.data]);
  const total = query.data?.totalElements ?? items.length;

  useEffect(() => {
    document.title = "Review · BusMate";
  }, []);

  const body = (() => {
    if (standingQuery.isError) {
      return (
        <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't load this page" actions={<button type="button" onClick={() => standingQuery.refetch()} className={noticePrimary}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</button>}>
          Check your connection and try again.
        </Notice>
      );
    }
    if (!standing) return <div role="status" aria-busy aria-label="Loading" className="h-40 animate-pulse rounded-2xl border border-border bg-card" />;
    if (!isSteward) {
      return (
        <Notice icon={<ShieldAlert className="h-6 w-6" />} title="Reviewing is for stewards" actions={<Link to="/contribute/mine" className={noticePrimary}>My contributions</Link>}>
          Stewards are trusted contributors appointed by BusMate to check other contributors' proposals on their corridors.
        </Notice>
      );
    }
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {decided && (
          <p role="status" className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900 dark:border-green-400/30 dark:bg-green-500/10 dark:text-green-200">
            <CheckCircle2 className="h-5 w-5 flex-none" aria-hidden />
            {decided === "approved" ? "Approved. It's now on the network, marked as seen by a contributor." : "Not approved. The contributor will see your reason."}
          </p>
        )}
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {corridors.length > 0 ? `You review proposals on ${corridors.join(", ")}. ` : ""}You can't see who proposed something, and you can't decide your own.
        </p>

        <div className="grid gap-2">
          <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((s) => (
              <Chip key={s.value} pressed={status === s.value} onClick={() => setStatus(s.value)}>{s.label}</Chip>
            ))}
          </div>
          <div role="group" aria-label="Kind" className="flex flex-wrap gap-2">
            {KIND_FILTERS.map((k) => (
              <Chip key={k.value} pressed={kind === k.value} onClick={() => setKind(k.value)}>{k.label}</Chip>
            ))}
          </div>
        </div>

        {query.isError ? (
          <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't load the queue" actions={<button type="button" onClick={() => query.refetch()} className={noticePrimary}>Try again</button>}>
            Check your connection and try again.
          </Notice>
        ) : query.isPending ? (
          <div role="status" aria-busy aria-label="Loading the queue" className="grid gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-border bg-card" />)}
          </div>
        ) : items.length === 0 ? (
          <Notice icon={<ClipboardCheck className="h-6 w-6" />} title={status === "PENDING" ? "Nothing waiting for you" : "Nothing here yet"}>
            {status === "PENDING" ? "New proposals on your corridors will appear here, oldest first." : "Proposals you or another reviewer decide on your corridors will appear here."}
          </Notice>
        ) : (
          <section aria-label="Proposals" className="grid grid-cols-[minmax(0,1fr)] gap-2">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
              {items.map((it) => {
                const c = it.changeset;
                if (!c?.id) return null;
                const dist = distanceText(it.positionDistanceMeters);
                const age = status === "PENDING" ? waitingText(c.createdAt) : formatDay(c.decidedAt);
                return (
                  <li key={c.id}>
                    <Link to={`/contribute/review/${c.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-bold">{proposalTitle(c.entityType, c.proposedValues)}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {proposalKind(c.entityType, c.action)}
                          {age ? ` · ${status === "PENDING" ? "sent " : ""}${age}` : ""}
                          {dist ? ` · moves it ${dist}` : ""}
                        </span>
                        {it.stale && status === "PENDING" && <span className="mt-1 inline-block rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200">Out of date</span>}
                      </span>
                      <ChevronRight className="h-5 w-5 flex-none text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {total > items.length && <p className="text-center text-xs text-muted-foreground">Showing the first {items.length} of {total}.</p>}
          </section>
        )}
      </div>
    );
  })();

  return (
    <AccountLayout>
      <div className="max-w-2xl">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight">Review</h2>
        {body}
      </div>
    </AccountLayout>
  );
}
