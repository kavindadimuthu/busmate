import { Link } from "react-router-dom";
import { Armchair, QrCode, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import TripSearchBar from "@/components/search/TripSearchBar";
import RouteCard from "@/components/landing/RouteCard";
import { townsServed, useAllRoutes, useStopCount } from "@/lib/network";
import heroBus from "@/assets/hero-bus.webp";

// Every claim below is something passengers can do today (INC-064): no live tracking, ratings or
// testimonials, which the design shows but BusMate doesn't have.
const PERKS: { icon: LucideIcon; text: string }[] = [
  { icon: Search, text: "Stop-to-stop\nsearch" },
  { icon: Armchair, text: "Online seat\nbooking" },
  { icon: QrCode, text: "QR\ne-tickets" },
  { icon: ShieldCheck, text: "Community-checked\ntimetables" },
];

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Search,
    title: "Stop-to-stop search",
    body: "Type any two stops or towns and see the buses that run between them on your date.",
  },
  {
    icon: Armchair,
    title: "Pick your seat",
    body: "Choose seats on the bus's own layout and pay online before you travel.",
  },
  {
    icon: QrCode,
    title: "Digital tickets",
    body: "Your ticket and its QR code stay in your account — the conductor scans it on board.",
  },
  {
    icon: ShieldCheck,
    title: "Honest timetables",
    body: "Local contributors check and correct schedules, and each timetable shows how sure we are of it.",
  },
];

const STEPS = [
  { title: "Search your trip", body: "Enter where you're going and when, then pick from the buses that run that day." },
  { title: "Book your seat", body: "Choose seats, add passenger details and pay securely online." },
  { title: "Show your ticket", body: "Open the QR ticket in My Tickets and show it to the conductor when you board." },
];

// Phones get a 16px gutter and tighter vertical rhythm; the design's spacing applies from md up.
const GUTTER = "px-4 min-[400px]:px-5 md:px-6";

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-extrabold tracking-[0.2em] text-primary md:text-xs ${className}`}>{children}</div>
  );
}

function Hero() {
  return (
    <section
      className={`relative overflow-hidden bg-[#1e3a8a] bg-cover bg-no-repeat pb-[92px] pt-7 text-white md:pb-[150px] md:pt-[72px] ${GUTTER}`}
      style={{ backgroundImage: `url(${heroBus})`, backgroundPosition: "78% center" }}
    >
      {/* The design's left-to-right fade keeps the photo's bus visible on wide screens; on phones the
          text spans the whole photo, so the overlay stays dark all the way across. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,22,68,.9),rgba(20,48,130,.78))] md:bg-[linear-gradient(90deg,rgba(9,22,68,.94)_0%,rgba(20,48,130,.82)_38%,rgba(30,64,175,.25)_68%,rgba(30,64,175,0)_100%)]" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-semibold md:px-3.5 md:py-[7px] md:text-xs">
          Bus travel across Sri Lanka
        </div>
        <h1 className="mb-3 mt-4 max-w-[600px] text-[clamp(30px,8.6vw,68px)] font-extrabold leading-[1.06] tracking-[-0.03em] md:mb-5 md:mt-[22px] md:leading-[1.04]">
          Your Journey Starts with <span className="text-highlight">BusMate</span>
        </h1>
        <p className="max-w-[480px] text-[15px] leading-relaxed text-white/90 md:mb-8 md:text-lg">
          Find buses between any two stops, book your seat online and travel with a digital ticket.
        </p>
        {/* On phones these four repeat the feature list just below, and would push the search
            form off the first screen, so they're tablet-and-up only. */}
        {/* Tablets: two rows, so they stay over the dark left of the photo, not the bus. */}
        <ul className="hidden flex-wrap gap-x-7 gap-y-4 md:flex md:max-w-[480px] lg:max-w-none">
          {PERKS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-[13px] font-semibold leading-tight">
              <span className="grid h-[38px] w-[38px] place-items-center rounded-full border border-white/30 bg-white/15">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="whitespace-pre-line">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StatsBand() {
  const routes = useAllRoutes();
  const stops = useStopCount();

  // Real numbers or nothing: the band never shows a placeholder figure, and hides if either
  // request fails rather than showing half of it.
  if (routes.isError || stops.isError) return null;
  const loading = routes.isPending || stops.isPending;
  const stats = [
    { n: routes.data?.length, label: "Routes on BusMate" },
    { n: stops.data, label: "Bus stops mapped" },
    { n: routes.data ? townsServed(routes.data) : undefined, label: "Towns served" },
  ];

  return (
    <div
      aria-busy={loading}
      className="mt-6 grid grid-cols-3 gap-2 rounded-2xl bg-[linear-gradient(120deg,#1e3a8a,#2563eb_60%,#1d4ed8)] px-3 py-5 text-center text-white md:mt-8 md:gap-5 md:rounded-[20px] md:px-5 md:py-[34px]"
    >
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-[clamp(26px,8vw,40px)] font-extrabold leading-tight tracking-[-0.02em]">
            {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded-lg bg-white/20 align-middle md:h-10 md:w-16" /> : s.n}
          </div>
          <div className="mt-0.5 text-[11px] leading-tight opacity-85 md:text-sm">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function WhyBusMate() {
  return (
    <section className={`mx-auto max-w-[1200px] pb-8 pt-12 md:pb-10 md:pt-24 md:text-center ${GUTTER}`}>
      <Eyebrow>WHY CHOOSE BUSMATE</Eyebrow>
      <h2 className="mb-2 mt-2 text-[clamp(26px,7vw,40px)] font-extrabold leading-tight tracking-[-0.02em] md:mb-3 md:mt-2.5">
        A Smarter Way to <span className="text-primary">Travel</span>
      </h2>
      <p className="mb-6 max-w-[520px] leading-relaxed text-muted-foreground md:mx-auto md:mb-11">
        Everything you need for a bus trip, from finding the right bus to boarding it.
      </p>
      {/* Phones: compact icon-beside-text rows (four tall cards were a whole screen of scrolling).
          Tablet up: the design's cards. */}
      <div className="grid gap-3 text-left md:grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] md:gap-5">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 md:block md:rounded-[18px] md:p-[26px]"
          >
            <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-tint text-primary md:mb-[18px] md:h-[52px] md:w-[52px]">
              <Icon className="h-5 w-5 md:h-[22px] md:w-[22px]" aria-hidden />
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold md:mb-2 md:text-[17px]">{title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground md:text-sm">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <StatsBand />
    </section>
  );
}

function RoutesSection() {
  const { data, isPending, isError, refetch } = useAllRoutes();
  // Each route is stored once per direction; show one card per outbound working.
  const featured = (data ?? [])
    .filter((r) => r.direction !== "INBOUND")
    .sort((a, b) => (a.routeNumber ?? "").localeCompare(b.routeNumber ?? "", undefined, { numeric: true }))
    .slice(0, 4);

  // Phones: a sideways-swipe row where the next card peeks in. Tablet up: the design's grid.
  const rail =
    "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] min-[400px]:-mx-5 min-[400px]:scroll-px-5 min-[400px]:px-5 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] md:gap-5 md:overflow-visible md:p-0 [&::-webkit-scrollbar]:hidden";
  const railItem = "w-[82%] max-w-[320px] flex-none snap-start md:w-auto md:max-w-none";

  return (
    <section className={`mt-6 bg-alt py-12 md:mt-10 md:py-20 ${GUTTER}`}>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 md:mb-8">
          <div>
            <Eyebrow>ROUTES ON BUSMATE</Eyebrow>
            <h2 className="my-1.5 text-[clamp(26px,7vw,38px)] font-extrabold leading-tight tracking-[-0.02em] md:my-2">
              Explore Routes
            </h2>
            <p className="text-muted-foreground">See where the buses go, stop by stop.</p>
          </div>
          <Link
            to="/routes"
            className="inline-flex min-h-11 items-center rounded-[10px] border-[1.5px] border-primary px-[18px] text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            View All Routes →
          </Link>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center md:p-10">
            <p className="font-bold">Routes couldn't be loaded right now.</p>
            <button onClick={() => refetch()} className="mt-2 min-h-11 px-3 text-sm font-bold text-primary">
              Try again
            </button>
          </div>
        ) : isPending ? (
          <div className={rail} aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`h-[290px] animate-pulse rounded-2xl border border-border bg-card ${railItem}`} />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground md:p-10">
            No routes have been published yet.
          </div>
        ) : (
          <div className={rail}>
            {featured.map((r) => (
              <div key={r.id} className={railItem}>
                <RouteCard route={r} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className={`mx-auto max-w-[1200px] py-12 md:py-24 ${GUTTER}`}>
      <div className="mb-6 md:mb-11 md:text-center">
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <h2 className="mb-2 mt-2 text-[clamp(26px,7vw,38px)] font-extrabold leading-tight tracking-[-0.02em] md:mb-3">
          Simple Steps, <span className="text-primary">Better Journeys</span>
        </h2>
        <p className="max-w-[520px] leading-relaxed text-muted-foreground md:mx-auto">From search to boarding in three steps.</p>
      </div>
      <ol className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] md:gap-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 md:gap-4 md:rounded-[18px] md:p-6">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-tint font-extrabold text-primary md:h-[46px] md:w-[46px]">
              {i + 1}
            </span>
            <div>
              <h3 className="mb-1 text-[15px] font-bold md:text-base">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground md:text-sm">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CallToAction() {
  return (
    <section className={`bg-gradient-band py-12 text-white md:py-[72px] ${GUTTER}`}>
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8">
        <div className="w-full max-w-[620px]">
          <div className="text-[11px] font-extrabold tracking-[0.2em] opacity-85 md:text-xs">READY WHEN YOU ARE</div>
          <h2 className="my-2.5 text-[clamp(26px,7vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em] md:my-3">
            Plan your next bus trip in a minute.
          </h2>
          <p className="mb-5 opacity-90 md:mb-6">Search a route now — create a free account when you're ready to book.</p>
          <div className="grid gap-2.5 min-[400px]:grid-cols-2 md:flex md:flex-wrap md:gap-3">
            <Link
              to="/findmybus"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-[26px] font-bold text-[#1d4ed8] hover:bg-white/90"
            >
              Find My Bus →
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-[26px] font-bold text-white hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </div>
        <div className="hidden text-[30px] font-medium italic leading-snug opacity-90 md:block">
          Your Journey,
          <br />
          Our Priority
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <SiteLayout>
      <Hero />
      <div className="relative z-[5] mx-auto -mt-[68px] max-w-[1120px] px-3 min-[360px]:px-4 md:-mt-[70px] md:px-6">
        <TripSearchBar />
      </div>
      <WhyBusMate />
      <RoutesSection />
      <HowItWorks />
      <CallToAction />
    </SiteLayout>
  );
}
