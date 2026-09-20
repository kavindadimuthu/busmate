import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Loader2, XCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommunityContributorsService, type ChangesetResponse } from "@busmate/api-client-core";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Under review",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

const OBSERVATION_LABEL: Record<string, string> = {
  RODE_THE_ROUTE: "Rode the route past this stop",
  LIVES_OR_WORKS_NEARBY: "Lives or works nearby",
  TIMETABLE_OR_SIGNBOARD: "From a timetable or signboard",
  TOLD_BY_CREW: "A conductor or driver said so",
  OTHER: "Other",
};

const DIFF_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "nameSinhala", label: "Name (Sinhala)" },
  { key: "nameTamil", label: "Name (Tamil)" },
  { key: "description", label: "Description" },
];

function get(values: unknown, path: string): unknown {
  if (!values || typeof values !== "object") return undefined;
  return (values as Record<string, unknown>)[path];
}

/** What was proposed, what it's decided against (for a correction), and the reviewer's reason. */
export default function ContributionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ChangesetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // There's no single-proposal GET yet, so the small "mine" page is fetched and filtered —
        // fine at this scale; a dedicated endpoint can follow if the list grows large.
        const result = await CommunityContributorsService.listMyChangesets(undefined, 0, 100);
        const found = (result.content ?? []).find((p) => p.id === id);
        if (!cancelled) {
          if (found) setProposal(found);
          else setError("That proposal couldn't be found, or isn't yours.");
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.body?.message || err?.message || "Could not load this proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const withdraw = async () => {
    if (!proposal?.id) return;
    setWithdrawing(true);
    try {
      const updated = await CommunityContributorsService.withdrawChangeset(proposal.id);
      setProposal(updated);
      toast.success("Proposal withdrawn");
    } catch (err: any) {
      toast.error(err?.body?.message || err?.message || "Could not withdraw this proposal.");
    } finally {
      setWithdrawing(false);
    }
  };

  const locationText = (values: unknown) => {
    const loc = get(values, "location") as { latitude?: number; longitude?: number; city?: string } | undefined;
    if (!loc) return "—";
    const parts = [] as string[];
    if (loc.city) parts.push(loc.city);
    if (loc.latitude != null && loc.longitude != null) parts.push(`${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`);
    return parts.join(" · ") || "—";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/contribute/mine")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to my contributions
        </Button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !proposal ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error ?? "Not found."}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-foreground">
                {proposal.action === "CREATE" ? "New stop" : "Correction"}
              </h1>
              <Badge>{STATUS_LABEL[proposal.status ?? ""] ?? proposal.status}</Badge>
            </div>

            <Card>
              <CardContent className="p-5 space-y-3">
                <h2 className="text-sm font-semibold text-foreground">What you proposed</h2>
                {proposal.action === "UPDATE" && proposal.targetSnapshot ? (
                  <div className="space-y-2">
                    {DIFF_FIELDS.map(({ key, label }) => {
                      const before = get(proposal.targetSnapshot, key);
                      const after = get(proposal.proposedValues, key);
                      if (before === after || (!before && !after)) return null;
                      return (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground">{label}: </span>
                          <span className="line-through text-muted-foreground">{String(before ?? "—")}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{String(after ?? "—")}</span>
                        </div>
                      );
                    })}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Position: </span>
                      <span className="line-through text-muted-foreground">{locationText(proposal.targetSnapshot)}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{locationText(proposal.proposedValues)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-muted-foreground">Name: </span>
                      {String(get(proposal.proposedValues, "name") ?? "—")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Position: </span>
                      {locationText(proposal.proposedValues)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Observed: </span>
                  {proposal.observedOn} — {OBSERVATION_LABEL[proposal.observationMethod ?? ""] ?? proposal.observationMethod}
                </p>
                {proposal.note && (
                  <p>
                    <span className="text-muted-foreground">Your note: </span>
                    {proposal.note}
                  </p>
                )}
              </CardContent>
            </Card>

            {proposal.status !== "PENDING" && proposal.decisionReason && (
              <Card className={proposal.status === "REJECTED" ? "border-destructive/30" : ""}>
                <CardContent className="p-5 flex gap-3">
                  {proposal.status === "REJECTED" && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Reviewer's note</p>
                    <p className="text-sm text-muted-foreground">{proposal.decisionReason}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {proposal.status === "PENDING" && (
              <Button variant="outline" onClick={withdraw} disabled={withdrawing}>
                {withdrawing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Withdraw this proposal
              </Button>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
