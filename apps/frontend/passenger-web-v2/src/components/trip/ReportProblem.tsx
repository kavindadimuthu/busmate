import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Flag, Loader2 } from "lucide-react";
import { ApiError, CommunityContributorsService, PassengerReportRequest } from "@busmate/api-client-core";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { inputClass } from "@/components/auth/Field";
import { cn } from "@/lib/utils";

const REASONS: { value: PassengerReportRequest.reason; label: string }[] = [
  { value: PassengerReportRequest.reason.WRONG_TIME, label: "The time is wrong" },
  { value: PassengerReportRequest.reason.WRONG_DAYS, label: "It doesn't run these days" },
  { value: PassengerReportRequest.reason.BUS_DID_NOT_COME, label: "The bus didn't come" },
  { value: PassengerReportRequest.reason.WRONG_OPERATOR_OR_PLATE, label: "Who runs it is wrong" },
  { value: PassengerReportRequest.reason.OTHER, label: "Something else" },
];

function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "Too many reports just now. Please try again in a minute.";
    const body = e.body as { message?: string; error?: string } | undefined;
    if (body?.message) return body.message;
  }
  return "We couldn't send your report. Please try again.";
}

/** A passenger saying a departure is wrong (INC-056). It proposes nothing and changes nothing by itself: staff
 * take it from there. Any signed-in passenger can send one; a signed-out one is taken to log in and back. */
export default function ReportProblem({ scheduleId }: { scheduleId: string }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const start = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    setOpen(true);
  };

  const change = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setReason("");
      setNote("");
      setError(null);
      setDone(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Choose what's wrong.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await CommunityContributorsService.reportProblem({
        entityType: PassengerReportRequest.entityType.SCHEDULE,
        targetId: scheduleId,
        reason: reason as PassengerReportRequest.reason,
        note: note.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Flag className="h-4 w-4" aria-hidden />
        Report a problem with this departure
      </button>

      <Dialog open={open} onOpenChange={change}>
        <DialogContent variant="sheet">
          <div className="grid gap-1.5">
            <DialogTitle>Report a problem</DialogTitle>
            <DialogDescription>Tell us what's wrong. A staff member will look at it; it never changes what other passengers see by itself.</DialogDescription>
          </div>
          {done ? (
            <div className="grid gap-4">
              <p role="status" className="rounded-xl border border-green-200 bg-green-100 px-4 py-3 text-sm font-medium text-green-900 dark:border-green-400/30 dark:bg-green-500/15 dark:text-green-200">
                Thank you. We've received your report.
              </p>
              <DialogClose className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Close
              </DialogClose>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4">
              <div>
                <label htmlFor="report-reason" className="mb-1.5 block text-[13px] font-bold">
                  What's wrong?
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={!!error && !reason}
                  className={cn(inputClass(!!error && !reason), "appearance-auto")}
                >
                  <option value="">Choose one</option>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-note" className="mb-1.5 block text-[13px] font-bold">
                  Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea id="report-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={cn(inputClass(false), "min-h-24 py-3")} />
              </div>
              {error && (
                <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {sending ? "Sending…" : "Send report"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
