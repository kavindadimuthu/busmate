import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, Ticket } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import TripGroupCard from "@/components/tickets/TripGroupCard";
import { useAuth } from "@/lib/auth/AuthContext";
import { ticketsProblem, tripRecordQuery, useMyTickets } from "@/lib/ticketsApi";
import { groupTickets, sectionOf, sortGroups, type Section } from "@/lib/tickets.ts";
import { todayInSriLanka } from "@/lib/search";

/** Every booking the signed-in passenger has made, grouped by trip: what's coming up first, then what's behind them. */
export default function MyTicketsPage() {
  const { user } = useAuth();
  const mine = useMyTickets(user?.userId);
  const today = todayInSriLanka();

  useEffect(() => {
    document.title = "My tickets · BusMate";
  }, []);

  const groups = useMemo(() => groupTickets(mine.data ?? []), [mine.data]);
  const tripIds = useMemo(() => [...new Set(groups.map((g) => g.tripId).filter(Boolean))], [groups]);
  // The same query the cards use, so this costs nothing extra: it is what tells upcoming from past.
  const trips = useQueries({
    queries: tripIds.map((id) => tripRecordQuery(id)),
  });
  const tripById = new Map(tripIds.map((id, i) => [id, trips[i]?.data]));
  const tripsSettled = trips.every((q) => !q.isPending);

  const sections = useMemo(() => {
    const out: Record<Section, typeof groups> = { upcoming: [], past: [] };
    for (const g of groups) out[sectionOf(g, tripById.get(g.tripId), today)].push(g);
    const dateOf = (g: (typeof groups)[number]) => tripById.get(g.tripId)?.tripDate;
    return { upcoming: sortGroups(out.upcoming, dateOf, "upcoming"), past: sortGroups(out.past, dateOf, "past") };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, today, tripsSettled, trips.map((q) => q.dataUpdatedAt).join(",")]);

  const problem = mine.isError ? ticketsProblem(mine.error) : null;
  const loading = mine.isPending || (groups.length > 0 && !tripsSettled);

  return (
    <AccountLayout>
      <div className="max-w-3xl">
        <h2 className="text-xl font-extrabold tracking-tight">My tickets</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Your bookings, with the seat and status of each.</p>
        {problem ? (
          <Notice
            role="alert"
            icon={<AlertTriangle className="h-6 w-6" />}
            title={problem.title}
            actions={
              <button type="button" onClick={() => mine.refetch()} className={noticePrimary}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                Try again
              </button>
            }
          >
            {problem.body}
          </Notice>
        ) : loading ? (
          <div role="status" aria-busy aria-label="Loading your tickets" className="grid gap-4">
            <div className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
            <div className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        ) : groups.length === 0 ? (
          <Notice icon={<Ticket className="h-6 w-6" />} title="You haven't booked any tickets yet" actions={<Link to="/findmybus" className={noticePrimary}>Find a bus</Link>}>
            When you book seats, they'll appear here.
          </Notice>
        ) : (
          <div className="grid gap-8">
            {sections.upcoming.length > 0 && (
              <section aria-labelledby="upcoming-h" className="grid gap-3">
                <h2 id="upcoming-h" className="text-sm font-extrabold uppercase tracking-wide">
                  Upcoming · {sections.upcoming.length}
                </h2>
                {sections.upcoming.map((g) => (
                  <TripGroupCard key={g.key} group={g} />
                ))}
              </section>
            )}
            {sections.past.length > 0 && (
              <section aria-labelledby="past-h" className="grid gap-3">
                <h2 id="past-h" className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                  Past and cancelled · {sections.past.length}
                </h2>
                {sections.past.map((g) => (
                  <TripGroupCard key={g.key} group={g} />
                ))}
              </section>
            )}
            {sections.upcoming.length === 0 && (
              <p className="-mb-4 text-center text-sm text-muted-foreground">
                Nothing coming up. <Link to="/findmybus" className="font-bold text-primary hover:underline">Find a bus</Link>
              </p>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
