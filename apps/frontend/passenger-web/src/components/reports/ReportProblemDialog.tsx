import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CommunityContributorsService, PassengerReportRequest } from "@busmate/api-client-core";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

type EntityType = PassengerReportRequest.entityType;
type Reason = PassengerReportRequest.reason;

/** Which reasons make sense to offer for what is being reported (mirrors the server's own rule). */
const REASONS: Record<EntityType, { value: Reason; label: string }[]> = {
  [PassengerReportRequest.entityType.SCHEDULE]: [
    { value: PassengerReportRequest.reason.WRONG_TIME, label: "The time is wrong" },
    { value: PassengerReportRequest.reason.WRONG_DAYS, label: "It doesn't run these days" },
    { value: PassengerReportRequest.reason.BUS_DID_NOT_COME, label: "The bus didn't come" },
    { value: PassengerReportRequest.reason.WRONG_OPERATOR_OR_PLATE, label: "Who runs it is wrong" },
    { value: PassengerReportRequest.reason.OTHER, label: "Something else" },
  ],
  [PassengerReportRequest.entityType.SCHEDULE_WORKING]: [
    { value: PassengerReportRequest.reason.WRONG_OPERATOR_OR_PLATE, label: "Who runs it is wrong" },
    { value: PassengerReportRequest.reason.OTHER, label: "Something else" },
  ],
};

function errorText(e: unknown, fallback: string): string {
  const body = (e as { body?: { message?: string } })?.body;
  return body?.message ?? fallback;
}

/**
 * A passenger saying something is wrong, without needing to be a contributor (INC-056). This is not a
 * correction — it proposes nothing — so there's no form to fill beyond a reason and an optional note; staff
 * take it from there.
 */
export function ReportProblemDialog({ entityType, targetId, label }: { entityType: EntityType; targetId: string; label: string }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const startReport = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setOpen(true);
  };

  const reset = () => {
    setReason("");
    setNote("");
    setError(null);
    setDone(false);
  };

  const submit = async () => {
    if (!reason) {
      setError("Choose what's wrong");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await CommunityContributorsService.reportProblem({ entityType, targetId, reason, note: note.trim() || undefined });
      setDone(true);
    } catch (e) {
      setError(errorText(e, "Could not send your report."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={startReport}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive underline underline-offset-2"
      >
        <Flag className="h-3 w-3" />
        {label}
      </button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a problem</DialogTitle>
          </DialogHeader>
          {done ? (
            <p className="text-sm text-muted-foreground py-4">
              Thank you — a staff member will take a look. This never changes what other passengers see by itself.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>What's wrong?</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as Reason)}>
                  <SelectTrigger aria-label="What's wrong">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS[entityType].map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-note">Anything else? (optional)</Label>
                <Textarea id="report-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
          <DialogFooter>
            {done ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
