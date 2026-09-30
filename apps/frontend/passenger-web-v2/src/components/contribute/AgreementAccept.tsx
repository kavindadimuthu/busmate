import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { CommunityContributorsService } from "@busmate/api-client-core";
import { CheckRow } from "@/components/form/controls";
import { useAgreement } from "@/lib/contributionsApi";
import { communityMessage } from "@/lib/community/errors";

/** A contributor whose agreement has changed since they accepted it can't propose anything until they accept the new
 * one. Shows the text in force, and accepts that exact version. passenger-web has no screen for this. */
export default function AgreementAccept() {
  const qc = useQueryClient();
  const agreement = useAgreement().data;
  const [agreed, setAgreed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const accept = useMutation({
    mutationFn: () => CommunityContributorsService.acceptContributorAgreement({ agreementVersion: agreement!.version! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-standing"] }),
    onError: (e) => {
      setProblem(communityMessage(e, "We couldn't record that. Please try again."));
      qc.invalidateQueries({ queryKey: ["contributor-agreement"] });
    },
  });

  return (
    <section aria-label="New contributor agreement" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10 md:p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
        <FileText className="h-5 w-5" aria-hidden />
        The contributor agreement has changed
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">Read the new agreement and accept it to carry on contributing. Nothing you've already proposed is affected.</p>
      {agreement?.text && (
        <div tabIndex={0} role="region" aria-label="Contributor agreement text" className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-[13px] leading-relaxed text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {agreement.text}
        </div>
      )}
      <CheckRow checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-2">
        I have read and accept the agreement above.
      </CheckRow>
      {problem && (
        <p role="alert" className="mt-2 flex items-start gap-2 text-[13px] font-semibold text-red-800 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          {problem}
        </p>
      )}
      <button
        type="button"
        disabled={!agreed || !agreement?.version || accept.isPending}
        onClick={() => { setProblem(null); accept.mutate(); }}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Accept and carry on
      </button>
    </section>
  );
}
