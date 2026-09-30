import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HeartHandshake, MapPinned, Route, Ticket } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import { TRUST_CONFIG, TRUST_ORDER } from "@/lib/trust.ts";
import { cn } from "@/lib/utils";

const BTN_PRIMARY =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-primary px-6 text-[15px] font-bold text-white shadow-[0_12px_28px_-12px_rgba(37,99,235,.7)] transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto";
const BTN_SECONDARY =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border-[1.5px] border-border bg-card px-6 text-[15px] font-bold transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto";

// Only what BusMate does today (INC-082): the design's statistics, milestones, team and photos are left out because
// there is nothing behind them.
const DOES = [
  { icon: MapPinned, title: "Find a bus", body: "Pick where you're starting and where you're going, and see the buses that run between the two, with times.", to: "/findmybus", cta: "Find my bus" },
  { icon: Route, title: "Browse routes", body: "See a route's stops in order and the buses that run on it.", to: "/routes", cta: "See routes" },
  { icon: Ticket, title: "Book a seat", body: "Where online booking is open, choose your seat, pay and keep a digital ticket in your account.", to: "/tickets", cta: "Your tickets" },
  { icon: HeartHandshake, title: "Help fill the gaps", body: "Tell us where a stop really is, or which operator runs a departure. Someone else checks it before anyone sees it.", to: "/contribute", cta: "Contribute" },
];

const PRINCIPLES = [
  { title: "Honest about what we know", body: "Times and details carry a label saying where they came from, so you can decide how far to rely on them. We'd rather say \"observed\" than pretend something is official." },
  { title: "Checked before it's shown", body: "What contributors add is reviewed by someone else first, and is always marked as seen by a contributor, never as official." },
  { title: "Corrections welcome", body: "Anyone with an account can report a problem on a bus, and suggest a fix if they know the right answer." },
];

const FAQ = [
  { q: "Are the times exact?", a: "It depends on the label next to them. An official or operator timetable is as good as the source. An observed time was seen by someone on the ground and can drift. An estimate is worked out from distance and typical speeds. Check the label before you plan around a time." },
  { q: "Can I book a seat online?", a: "Online booking is being introduced carefully. A bus's page says whether booking is open right now. Until it is, you can still find buses and their times." },
  { q: "Do I need an account?", a: "Not to find buses or browse routes. You need one to book a seat, keep your tickets, or contribute." },
  { q: "I found a mistake. What do I do?", a: "Open the bus or trip and log in and use \"report a problem\". If you know the right answer and would like to help regularly, apply to contribute." },
  { q: "Who adds the information?", a: "BusMate's own records, timetables from operators and authorities where we have them, and contributors who ride these routes. The label on each detail tells you which." },
];

const Section = ({ eyebrow, title, children, className }: { eyebrow: string; title: string; children: React.ReactNode; className?: string }) => (
  <section className={cn("mt-10 md:mt-14", className)}>
    <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
    <h2 className="mt-1 text-[clamp(20px,5.4vw,28px)] font-extrabold leading-tight tracking-tight">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

/** What BusMate is and how far to trust it. Static: says only what the product does today. */
export default function AboutPage() {
  useEffect(() => {
    document.title = "About · BusMate";
  }, []);

  return (
    <SiteLayout>
      <PageHero compact>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/80">About BusMate</p>
        <h1 className="mt-1 max-w-2xl text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Making bus travel in Sri Lanka easier to plan</h1>
      </PageHero>

      <div className="mx-auto max-w-3xl px-3 pb-16 pt-6 min-[360px]:px-4 md:px-6">
        <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
          BusMate brings routes, timetables and seat booking for Sri Lanka's public buses into one place, and tells you how well it knows
          each thing it shows.
        </p>

        <Section eyebrow="Why it exists" title="Bus information is scattered">
          <div className="grid gap-3 text-[15px] leading-relaxed text-muted-foreground">
            <p>Timetables live on posters and in people's heads. Routes are known by word of mouth, and details differ between operators. Working out which bus to catch shouldn't need a friend who happens to know.</p>
            <p>BusMate gathers what is known, shows it clearly, and makes it easy for the people who know these routes to correct it.</p>
          </div>
        </Section>

        <Section eyebrow="What you can do" title="Here, today">
          <ul className="grid gap-3 sm:grid-cols-2">
            {DOES.map((d) => (
              <li key={d.title} className="flex flex-col rounded-2xl border border-border bg-card p-4">
                <d.icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-2 text-[15px] font-extrabold">{d.title}</h3>
                <p className="mt-1 flex-1 text-[13px] leading-relaxed text-muted-foreground">{d.body}</p>
                <Link to={d.to} className="mt-2 inline-flex min-h-11 items-center text-[13px] font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {d.cta} →
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="How far to trust it" title="Every detail says where it came from">
          <p className="text-[15px] leading-relaxed text-muted-foreground">You'll see these labels beside times and stops. They mean:</p>
          <ul className="mt-3 grid gap-2">
            {/* "Live" is left out: this app doesn't show a bus's live position. */}
            {TRUST_ORDER.filter((k) => k !== "LIVE").map((k) => {
              const t = TRUST_CONFIG[k];
              return (
                <li key={k} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5 min-[400px]:flex-row min-[400px]:items-start min-[400px]:gap-3">
                  <span className={cn("inline-flex min-h-7 w-fit flex-none items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold", t.className)}>
                    <t.icon className="h-3.5 w-3.5" aria-hidden />
                    {t.label}
                  </span>
                  <span className="text-[13px] leading-relaxed text-muted-foreground">{t.meaning}</span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section eyebrow="What we hold ourselves to" title="Principles">
          <ul className="grid gap-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-[15px] font-extrabold">{p.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Questions" title="Questions, answered">
          <div className="grid gap-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 flex-none text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <section className="mt-10 rounded-2xl border border-border bg-card p-5 text-center md:mt-14 md:p-8">
          <h2 className="text-xl font-extrabold tracking-tight">Ready to plan a journey?</h2>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/findmybus" className={BTN_PRIMARY}>Find my bus</Link>
            <Link to="/contribute" className={BTN_SECONDARY}>Help improve it</Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
