import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bus, Loader2, SearchX } from "lucide-react";
import { CommunityContributorsService, type WorkingProposalRequest } from "@busmate/api-client-core";
import ProposeShell from "@/components/contribute/ProposeShell";
import WorkingFields from "@/components/contribute/WorkingFields";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { useSchedule } from "@/lib/proposeApi";
import { communityMessage } from "@/lib/community/errors";
import { todayInSriLanka } from "@/lib/search";
import { emptyWorkingForm, workingProblems, workingRequest, type WorkingForm } from "@/lib/propose.ts";

const COPY = {
  operatorLabel: "Operator, as written on the bus",
  operatorPlaceholder: "e.g. Weerasinghe Midnight Express",
  platesLabel: "Plate numbers, separated by commas",
  platesPlaceholder: "e.g. ND-1712, ND-1713",
  classLabel: "Service class (if you know)",
  classPlaceholder: "Not sure",
};

/** Say who usually runs a departure (ADR-026). Reached from a bus's page, which says which departure. Passengers read it as
 * "usually", never as a promise about a given day. */
export default function ProposeWorkingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const scheduleId = params.get("scheduleId");
  const today = todayInSriLanka();
  const schedule = useSchedule(scheduleId);
  const [form, setForm] = useState<WorkingForm>(() => emptyWorkingForm(today));
  const [attempted, setAttempted] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const problems = useMemo(() => workingProblems(form, today), [form, today]);
  const set = <K extends keyof WorkingForm>(k: K, v: WorkingForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const send = useMutation({
    mutationFn: () => CommunityContributorsService.proposeScheduleWorking(workingRequest(form, scheduleId!) as WorkingProposalRequest),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-proposals"] });
      navigate("/contribute/mine", { replace: true, state: { sent: "working" } });
    },
    onError: (e) => setProblem(communityMessage(e, "We couldn't send your proposal. Please try again.")),
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
    <ProposeShell title="Who usually runs this bus?" back={{ to: "/findmybus", label: "Find My Bus" }}>
      {!scheduleId || schedule.isError ? (
        <Notice role="alert" icon={<SearchX className="h-6 w-6" />} title={!scheduleId ? "Open this from a bus's page" : "We couldn't find that departure"} actions={<Link to="/findmybus" className={noticePrimary}>Find a bus</Link>}>
          {!scheduleId ? "Start from a bus's details page so we know which departure you mean." : "It may have been removed. Search again and open the bus."}
        </Notice>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-muted-foreground">Tell us what you've seen. Passengers will read it as "usually", never as a promise for a given day.</p>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-soft px-4 py-3 text-sm">
            <Bus className="mt-0.5 h-5 w-5 flex-none text-primary" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">The departure</span>
              {schedule.data ? <span className="block font-bold">{[schedule.data.routeName, schedule.data.name].filter(Boolean).join(" · ")}</span> : <span className="block h-4 w-48 animate-pulse rounded bg-border" />}
            </span>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="mt-4 grid gap-4">
            {attempted && Object.keys(problems).length > 0 && (
              <div ref={summary} tabIndex={-1} role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 outline-none dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
                {problems._form ?? "Some of this needs fixing before it can be sent. It's marked below."}
              </div>
            )}
            <section aria-label="What you saw" className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
              <WorkingFields form={form} set={set} errors={attempted ? problems : {}} today={today} copy={COPY} />
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
