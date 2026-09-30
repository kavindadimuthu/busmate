import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bus, Loader2, SearchX } from "lucide-react";
import { CommunityContributorsService, type WorkingCorrectionRequest } from "@busmate/api-client-core";
import ProposeShell from "@/components/contribute/ProposeShell";
import WorkingFields from "@/components/contribute/WorkingFields";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { Field } from "@/components/auth/Field";
import { CheckRow } from "@/components/form/controls";
import { communityMessage } from "@/lib/community/errors";
import { todayInSriLanka } from "@/lib/search";
import { correctionProblems, correctionRequest, emptyCorrectionForm, type CorrectionForm } from "@/lib/propose.ts";

const COPY = {
  operatorLabel: "Operator, as written on the bus now",
  operatorPlaceholder: "Leave blank if it hasn't changed",
  platesLabel: "Plate numbers now, separated by commas",
  platesPlaceholder: "Leave blank if they haven't changed",
  classLabel: "Service class, if that changed",
  classPlaceholder: "Leave blank if unchanged",
};

/** Say a recorded working is wrong, or has stopped (ADR-027). Only what's different needs filling in: anything left blank
 * stays as it was. Reached from a bus's page, which passes what is currently recorded so it can be shown here. */
export default function CorrectWorkingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const workingId = params.get("workingId");
  const current = params.get("current");
  const today = todayInSriLanka();
  const [form, setForm] = useState<CorrectionForm>(() => emptyCorrectionForm(today));
  const [attempted, setAttempted] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const problems = useMemo(() => correctionProblems(form, today), [form, today]);
  const set = <K extends keyof CorrectionForm>(k: K, v: CorrectionForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const send = useMutation({
    mutationFn: () => CommunityContributorsService.proposeWorkingCorrection(correctionRequest(form, workingId!) as WorkingCorrectionRequest),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-proposals"] });
      navigate("/contribute/mine", { replace: true, state: { sent: "correction" } });
    },
    onError: (e) => setProblem(communityMessage(e, "We couldn't send your correction. Please try again.")),
  });

  const submit = () => {
    setProblem(null);
    setAttempted(true);
    if (Object.keys(problems).length > 0) {
      window.setTimeout(() => summary.current?.focus(), 0);
      return;
    }
    send.mutate();
  };

  return (
    <ProposeShell title="Something changed?" back={{ to: "/findmybus", label: "Find My Bus" }}>
      {!workingId ? (
        <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title="Open this from a bus's page" actions={<Link to="/findmybus" className={noticePrimary}>Find a bus</Link>}>
          Start from a bus that says who usually runs it, so we know which record you mean.
        </Notice>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted-foreground">Only fill in what's different. Anything you leave blank stays as it was.</p>
          {current && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-soft px-4 py-3 text-sm">
              <Bus className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Recorded now</span>
                <span className="block break-words font-bold">{current}</span>
              </span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="mt-4 grid gap-4">
            {attempted && Object.keys(problems).length > 0 && (
              <div ref={summary} tabIndex={-1} role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 outline-none dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                {problems._form ?? "Some of this needs fixing before it can be sent. It's marked below."}
              </div>
            )}
            <section aria-label="What's different" className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
              <WorkingFields form={form} set={set} errors={attempted ? problems : {}} today={today} copy={COPY} />
              <div className="grid gap-3 border-t border-border pt-4">
                <CheckRow checked={form.stopped} onChange={(e) => set("stopped", e.target.checked)}>
                  It has stopped running like this
                </CheckRow>
                {form.stopped && <Field label="Last day it ran" type="date" max={today} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} error={attempted ? problems.endDate : undefined} />}
              </div>
            </section>
            {problem && (
              <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                {problem}
              </p>
            )}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <button type="submit" disabled={send.isPending} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none">
                {send.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {send.isPending ? "Sending…" : "Send for review"}
              </button>
            </div>
          </form>
        </>
      )}
    </ProposeShell>
  );
}
