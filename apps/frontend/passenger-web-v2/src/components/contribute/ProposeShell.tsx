import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, HeartHandshake, RefreshCw } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { HeroBackLink, PageHero } from "@/components/layout/PageHero";
import Notice from "@/components/findmybus/Notice";
import { noticePrimary } from "@/components/findmybus/noticeStyles";
import { useStanding } from "@/lib/standingApi";
import { roleOf } from "@/lib/account.ts";

/** The frame every propose page shares: a hero with a way back, and the form only for someone who may send it. Anyone
 * else is told why, in words. core-service refuses a proposal from a non-contributor whatever this shows. */
export default function ProposeShell({ title, back, children }: { title: string; back: { to: string; label: string }; children: ReactNode }) {
  const query = useStanding();
  const standing = query.data;
  const role = roleOf(standing);

  const hero = (
    <PageHero compact>
      <HeroBackLink to={back.to}>{back.label}</HeroBackLink>
      <h1 className="mt-1 text-[clamp(24px,6.6vw,40px)] font-extrabold leading-[1.1] tracking-[-0.03em]">{title}</h1>
    </PageHero>
  );
  const frame = (body: ReactNode) => (
    <SiteLayout>
      {hero}
      <div className="mx-auto max-w-2xl px-3 pb-28 pt-5 min-[360px]:px-4 md:px-6 lg:pb-16">{body}</div>
    </SiteLayout>
  );

  if (query.isError) {
    return frame(
      <Notice role="alert" icon={<AlertTriangle className="h-6 w-6" />} title="We couldn't check your account" actions={<button type="button" onClick={() => query.refetch()} className={noticePrimary}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</button>}>
        Check your connection and try again.
      </Notice>,
    );
  }
  if (!standing) return frame(<div role="status" aria-busy aria-label="Loading" className="h-64 animate-pulse rounded-2xl border border-border bg-card" />);
  if (standing.activeContributor) return frame(children);

  const why: Record<string, { title: string; body: string; action?: { to: string; label: string } }> = {
    passenger: { title: "Only contributors can send proposals", body: "Apply to contribute and, once staff accept you, you can add stops and say who runs a bus.", action: { to: "/contribute", label: "About contributing" } },
    applicant: { title: "Your application is still under review", body: "You'll be able to send proposals once staff accept it.", action: { to: "/contribute/mine", label: "Your contributions" } },
    "agreement-due": { title: "Accept the new agreement first", body: "The contributor agreement has changed. Read and accept it to carry on.", action: { to: "/contribute/mine", label: "Read the agreement" } },
    suspended: { title: "Your contributor access is suspended", body: "You can't send proposals while it is.", action: { to: "/contribute/mine", label: "Your contributions" } },
    declined: { title: "Your application wasn't accepted", body: "You can apply again.", action: { to: "/contribute/apply", label: "Apply again" } },
    other: { title: "Proposals are for passenger accounts", body: "This is a staff account. Staff change stops and timetables in the management portal." },
  };
  const w = why[role ?? "passenger"] ?? why.passenger;
  return frame(
    <Notice role="status" icon={<HeartHandshake className="h-6 w-6" />} title={w.title} actions={w.action ? <Link to={w.action.to} className={noticePrimary}>{w.action.label}</Link> : undefined}>
      {w.body}
    </Notice>,
  );
}
