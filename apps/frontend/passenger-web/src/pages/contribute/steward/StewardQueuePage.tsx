import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ChevronRight, ClipboardList, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StewardGate from "@/components/contribute/StewardGate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityContributorsService, type ChangesetReviewResponse } from "@busmate/api-client-core";
import { coreErrorMessage } from "@/lib/coreError";

type Tab = "PENDING" | "APPROVED" | "REJECTED";

const TABS: { value: Tab; label: string }[] = [
  { value: "PENDING", label: "Waiting" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function proposalName(r: ChangesetReviewResponse): string {
  const values = r.changeset?.proposedValues as { name?: string } | undefined;
  return values?.name ?? "Untitled proposal";
}

/**
 * A steward's queue: the stop proposals waiting in the corridors they were appointed to (INC-042, ADR-022).
 * The server already filters to those corridors and leaves out anything the steward proposed themselves.
 */
function Queue() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [rows, setRows] = useState<ChangesetReviewResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await CommunityContributorsService.listChangesetsForReview(tab, undefined, undefined, 0, 50);
        if (cancelled) return;
        setRows(result.content ?? []);
        setTotal(result.totalElements ?? 0);
      } catch (err) {
        if (!cancelled) setError(coreErrorMessage(err, "Could not load the review queue."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/contribute/mine">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> My contributions
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Review proposals</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Proposals from other contributors in the corridors you steward. You won't see who made them.
        </p>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                tab === t.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {tab === t.value && !loading && <span className="ml-1.5 opacity-80">({total})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {tab === "PENDING" ? "Nothing is waiting for you right now." : "Nothing in this list yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link key={r.changeset?.id} to={`/contribute/review/${r.changeset?.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{proposalName(r)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.changeset?.action === "CREATE" ? "New stop" : "Correction"} ·{" "}
                        {r.changeset?.createdAt ? new Date(r.changeset.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.stale && <Badge variant="destructive">Outdated</Badge>}
                      {r.targetOutranksCommunityTier && <Badge variant="secondary">Outranked</Badge>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function StewardQueuePage() {
  return (
    <StewardGate>
      <Queue />
    </StewardGate>
  );
}
