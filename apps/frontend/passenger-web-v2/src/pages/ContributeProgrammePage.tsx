import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, MapPin, ShieldCheck, Users } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import { useAuth } from "@/lib/auth/AuthContext";
import { useStanding } from "@/lib/standingApi";
import { applyGate } from "@/lib/contributions.ts";
import type { AuthRouteState } from "@/lib/auth/redirect";

const CTA =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto";

const POINTS = [
  { icon: MapPin, title: "Add what you know", body: "Suggest a stop, correct where one is, or say which operator usually runs a departure, on a corridor you actually travel." },
  { icon: Eye, title: "Reviewed, never published blind", body: "Nothing you send changes what other passengers see until someone else has checked it." },
  { icon: ShieldCheck, title: "Labelled honestly", body: "What you contribute is shown as observed, never as official, and passengers can see the difference." },
  { icon: Users, title: "A record that follows you", body: "Reviewers can see how your earlier proposals fared. Staff can invite people with a good record to review others' proposals." },
];

/** The public "why would I do this" page (ADR-017). Anyone can read it; the button takes a signed-out visitor through log in
 * first, and a signed-in passenger to the form or, if they're already involved, to their contributions. */
export default function ContributeProgrammePage() {
  const { isAuthenticated } = useAuth();
  const standing = useStanding().data;
  const gate = isAuthenticated ? applyGate(standing) : null;

  useEffect(() => {
    document.title = "Contribute · BusMate";
  }, []);

  const loginState: AuthRouteState = { from: "/contribute/apply", notice: "Log in to apply to contribute." };

  return (
    <SiteLayout>
      <PageHero compact>
        <h1 className="mt-4 max-w-2xl text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Help map Sri Lanka's buses</h1>
      </PageHero>

      <div className="mx-auto max-w-3xl px-3 pb-16 pt-6 min-[360px]:px-4 md:px-6">
        <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
          Much of what people know about Sri Lanka's buses isn't written down anywhere: where a stop really is, who runs a departure, what
          changed last month. BusMate can only show what it has been told. People who ride and know their routes can fill the gaps, and
          every contribution is checked by someone else before other passengers see it.
        </p>

        <div className="mt-5">
          {!isAuthenticated ? (
            <Link to="/login" state={loginState} className={CTA}>
              Log in to apply
            </Link>
          ) : gate?.kind === "contributions" ? (
            <Link to="/contribute/mine" className={CTA}>
              Your contributions
            </Link>
          ) : gate?.kind === "blocked" ? (
            <p role="note" className="rounded-2xl border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">
              {gate.text}
            </p>
          ) : (
            <Link to="/contribute/apply" className={CTA}>
              Apply to contribute
            </Link>
          )}
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-4 md:p-5">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <h2 className="mt-2 text-[15px] font-extrabold">{title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>

        <section aria-label="Before you apply" className="mt-6 rounded-2xl border border-border bg-soft p-4 md:p-5">
          <h2 className="text-[15px] font-extrabold">Before you apply</h2>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-[13px] leading-relaxed text-muted-foreground">
            <li>You need a BusMate account with a verified email address.</li>
            <li>You'll say why you want to contribute, and about any link you have to a bus operator.</li>
            <li>You'll accept a short agreement about how your contributions are used and credited.</li>
            <li>Staff review every application, so it isn't instant.</li>
          </ul>
        </section>

      </div>
    </SiteLayout>
  );
}
