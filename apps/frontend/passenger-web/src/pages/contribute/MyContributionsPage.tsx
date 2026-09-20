import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, Loader2, MapPin, Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommunityContributorsService, type ChangesetResponse } from "@busmate/api-client-core";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500",
  APPROVED: "bg-green-600",
  REJECTED: "bg-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

function proposalName(c: ChangesetResponse): string {
  const values = c.proposedValues as { name?: string } | undefined;
  return values?.name ?? "Untitled proposal";
}

/** Everything the signed-in contributor has proposed, newest first (INC-030). */
export default function MyContributionsPage() {
  const [proposals, setProposals] = useState<ChangesetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await CommunityContributorsService.listMyChangesets(undefined, 0, 50);
        if (!cancelled) setProposals(result.content ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.body?.message || err?.message || "Could not load your contributions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = filter === "ALL" ? proposals : proposals.filter((p) => p.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My contributions</h1>
          <Button asChild size="sm" className="bg-gradient-primary">
            <Link to="/contribute/propose">
              <Plus className="h-4 w-4 mr-1.5" /> Propose a stop
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "WITHDRAWN"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_LABEL[s]}
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
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {proposals.length === 0 ? "You haven't proposed anything yet." : "Nothing in this status."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <Link key={p.id} to={`/contribute/mine/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{proposalName(p)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.action === "CREATE" ? "New stop" : "Correction"} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={STATUS_STYLES[p.status ?? ""] ?? ""}>{STATUS_LABEL[p.status ?? ""] ?? p.status}</Badge>
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
