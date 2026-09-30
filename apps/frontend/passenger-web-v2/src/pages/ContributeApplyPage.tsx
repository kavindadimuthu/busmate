import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { CommunityContributorsService, type ContributorApplicationRequest } from "@busmate/api-client-core";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { Field } from "@/components/auth/Field";
import { CheckRow, RadioCard, TextAreaField } from "@/components/form/controls";
import { useStanding } from "@/lib/standingApi";
import { useAgreement, useRouteGroups } from "@/lib/contributionsApi";
import { communityMessage, statusOf } from "@/lib/community/errors";
import { AFFILIATIONS, applicationPayload, applicationSchema, applyGate, EMPTY_APPLICATION, type ApplicationValues } from "@/lib/contributions.ts";
import { Link } from "react-router-dom";

const CARD = "grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-5";

/** Step into the programme: why, where, any operator link, and the agreement. Only for someone who can apply; anyone
 * already involved is sent to their contributions, and someone who can't yet is told why. */
export default function ContributeApplyPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const standingQuery = useStanding();
  const gate = applyGate(standingQuery.data);
  const agreementQuery = useAgreement(gate.kind === "form");
  const groups = useRouteGroups(gate.kind === "form").data ?? [];
  const [problem, setProblem] = useState<string | null>(null);
  // Set the moment an application goes through, before the standing refreshes: refreshing it makes the gate below send
  // the person to their contributions, and that redirect has to carry the "just applied" note with it.
  const justApplied = useRef(false);

  const form = useForm<ApplicationValues>({ resolver: zodResolver(applicationSchema), mode: "onTouched", defaultValues: EMPTY_APPLICATION });
  const affiliation = form.watch("affiliation");
  const agreement = agreementQuery.data;

  useEffect(() => {
    document.title = "Apply to contribute · BusMate";
  }, []);

  const submit = useMutation({
    mutationFn: (v: ApplicationValues) => CommunityContributorsService.applyToContribute(applicationPayload(v, agreement!.version!) as ContributorApplicationRequest),
    onSuccess: async () => {
      justApplied.current = true;
      await qc.invalidateQueries({ queryKey: ["my-standing"] });
      navigate("/contribute/mine", { replace: true, state: { justApplied: true } });
    },
    onError: async (e) => {
      const status = statusOf(e);
      setProblem(communityMessage(e, "We couldn't submit your application. Please try again."));
      // The agreement moved on, or they applied in another tab: re-read both so the page tells the truth.
      if (status === 409) await Promise.all([qc.invalidateQueries({ queryKey: ["contributor-agreement"] }), qc.invalidateQueries({ queryKey: ["my-standing"] })]);
    },
  });

  const hero = (
    <PageHero compact>
      <HeroBackLink to="/contribute">About contributing</HeroBackLink>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Apply to contribute</h1>
    </PageHero>
  );
  const shell = (body: React.ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="mx-auto max-w-2xl px-3 pb-16 pt-5 min-[360px]:px-4 md:px-6">{body}</div>
    </SiteLayout>
  );

  if (gate.kind === "contributions") return <Navigate to="/contribute/mine" replace state={justApplied.current ? { justApplied: true } : undefined} />;
  if (standingQuery.isError) {
    return shell(
      <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't check your account" actions={<button type="button" onClick={() => standingQuery.refetch()} className={noticePrimary}>Try again</button>}>
        Check your connection and try again.
      </Notice>,
    );
  }
  if (gate.kind === "loading") return shell(<div role="status" aria-busy aria-label="Loading" className="h-64 animate-pulse rounded-2xl border border-border bg-card" />);
  if (gate.kind === "blocked") {
    return shell(
      <Notice role="status" icon={<AlertTriangle className="h-6 w-6" />} title="You can't apply yet" actions={<Link to="/profile" className={noticePrimary}>Back to your account</Link>}>
        {gate.text}
      </Notice>,
    );
  }

  const errors = form.formState.errors;
  return shell(
    <form onSubmit={form.handleSubmit((v) => { setProblem(null); submit.mutate(v); })} noValidate className="grid gap-4">
      {agreement?.draft && (
        <p role="note" className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <span>
            This agreement is a <strong>draft</strong>. Applications are still reviewed, but nobody is accepted as a contributor until BusMate publishes the final agreement.
          </span>
        </p>
      )}

      <section aria-label="About you" className={CARD}>
        <TextAreaField label="Why do you want to contribute?" placeholder="Which routes do you know well, and why?" error={errors.motivation?.message} {...form.register("motivation")} />
        <Field label="Home district (optional)" placeholder="e.g. Colombo" autoComplete="address-level1" error={errors.homeDistrict?.message} {...form.register("homeDistrict")} />

        {groups.length > 0 && (
          <fieldset>
            <legend className="mb-1 text-[13px] font-bold">Corridors you know (optional)</legend>
            <p className="mb-1.5 text-xs text-muted-foreground">Routes you travel often. Reviewers of those corridors will see your proposals.</p>
            <Controller
              control={form.control}
              name="corridorRouteGroupIds"
              render={({ field }) => (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-1.5">
                  {groups.map((g) => (
                    <CheckRow
                      key={g.id}
                      checked={field.value.includes(g.id!)}
                      onChange={(e) => field.onChange(e.target.checked ? [...field.value, g.id!] : field.value.filter((x) => x !== g.id))}
                    >
                      {g.name}
                    </CheckRow>
                  ))}
                </div>
              )}
            />
            {errors.corridorRouteGroupIds && <p className="mt-1.5 text-[13px] font-medium text-destructive">{errors.corridorRouteGroupIds.message}</p>}
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-bold">Do you have any link to a bus operator?</legend>
          <div className="grid gap-2">
            {AFFILIATIONS.map((a) => (
              <RadioCard key={a.value} value={a.value} {...form.register("affiliation")}>
                {a.label}
              </RadioCard>
            ))}
          </div>
        </fieldset>
        {affiliation !== "NONE" && <TextAreaField label="Which operator, and how are you linked to them?" className="min-h-20" error={errors.affiliationDetail?.message} {...form.register("affiliationDetail")} />}
      </section>

      <section aria-label="The contributor agreement" className={CARD}>
        <h2 className="text-[15px] font-extrabold">The contributor agreement</h2>
        {agreementQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            We couldn't load the agreement.{" "}
            <button type="button" onClick={() => agreementQuery.refetch()} className="inline-flex min-h-10 items-center font-bold underline">Try again</button>
          </p>
        ) : !agreement ? (
          <div role="status" aria-busy aria-label="Loading the agreement" className="h-32 animate-pulse rounded-xl bg-soft" />
        ) : (
          <>
            <div tabIndex={0} role="region" aria-label="Contributor agreement text" className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-soft p-3 text-[13px] leading-relaxed text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {agreement.text}
            </div>
            <div>
              <CheckRow {...form.register("agreementAccepted")}>I have read and accept the contributor agreement above.</CheckRow>
              {errors.agreementAccepted && <p className="mt-1 text-[13px] font-medium text-destructive">{errors.agreementAccepted.message}</p>}
            </div>
          </>
        )}
      </section>

      {problem && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-none" aria-hidden />
          {problem}
        </p>
      )}
      <button
        type="submit"
        disabled={submit.isPending || !agreement?.version}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {submit.isPending ? "Submitting…" : "Submit application"}
      </button>
    </form>,
  );
}
