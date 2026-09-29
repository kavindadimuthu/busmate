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

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-xs font-extrabold tracking-[0.2em] text-primary ${className}`}>{children}</div>;
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-[#1e3a8a] bg-cover bg-no-repeat px-6 pb-[150px] pt-[72px] text-white max-md:pb-[120px] max-md:pt-12"
      style={{ backgroundImage: `url(${heroBus})`, backgroundPosition: "78% center" }}
    >
      {/* The design's left-to-right fade keeps the photo's bus visible on wide screens; on phones the
          text spans the whole photo, so the overlay stays dark all the way across. */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,22,68,.94)_0%,rgba(20,48,130,.82)_38%,rgba(30,64,175,.25)_68%,rgba(30,64,175,0)_100%)] max-md:bg-[linear-gradient(180deg,rgba(9,22,68,.9),rgba(20,48,130,.78))]" />
      <div className="relative mx-auto max-w-[1200px]">
        <div className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3.5 py-[7px] text-xs font-semibold">
          Bus travel across Sri Lanka
        </div>
        <h1 className="mb-5 mt-[22px] max-w-[600px] text-[clamp(34px,9vw,68px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
          Your Journey Starts with <span className="text-highlight">BusMate</span>
        </h1>
        <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-white/90">
          Find buses between any two stops, book your seat online and travel with a digital ticket.
        </p>
        <ul className="flex flex-wrap gap-x-7 gap-y-4">
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
      className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5 rounded-[20px] bg-[linear-gradient(120deg,#1e3a8a,#2563eb_60%,#1d4ed8)] px-5 py-[34px] text-white"
    >
      {stats.map((s) => (
        <div key={s.label}>
          <div className="text-[40px] font-extrabold tracking-[-0.02em]">
            {loading ? <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-white/20 align-middle" /> : s.n}
          </div>
          <div className="text-sm opacity-85">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function WhyBusMate() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-10 pt-24 text-center max-md:pt-16">
      <Eyebrow>WHY CHOOSE BUSMATE</Eyebrow>
      <h2 className="mb-3 mt-2.5 text-[clamp(28px,5vw,40px)] font-extrabold tracking-[-0.02em]">
        A Smarter Way to <span className="text-primary">Travel</span>
      </h2>
      <p className="mx-auto mb-11 max-w-[520px] leading-relaxed text-muted-foreground">
        Everything you need for a bus trip, from finding the right bus to boarding it.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,230px),1fr))] gap-5 text-left">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-[18px] border border-border bg-card p-[26px]">
            <div className="mb-[18px] grid h-[52px] w-[52px] place-items-center rounded-full bg-tint text-primary">
              <Icon className="h-[22px] w-[22px]" aria-hidden />
            </div>
            <h3 className="mb-2 text-[17px] font-bold">{title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
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

  return (
    <section className="mt-10 bg-alt px-6 py-20 max-md:py-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>ROUTES ON BUSMATE</Eyebrow>
            <h2 className="my-2 text-[clamp(28px,5vw,38px)] font-extrabold tracking-[-0.02em]">Explore Routes</h2>
            <p className="text-muted-foreground">See where the buses go, stop by stop.</p>
          </div>
          <Link
            to="/routes"
            className="rounded-[10px] border-[1.5px] border-primary px-[18px] py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            View All Routes →
          </Link>
        </div>

        {isError ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-bold">Routes couldn't be loaded right now.</p>
            <button onClick={() => refetch()} className="mt-2 text-sm font-bold text-primary">
              Try again
            </button>
          </div>
        ) : isPending ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No routes have been published yet.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-5">
            {featured.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24 max-md:py-16">
      <div className="mb-11 text-center">
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <h2 className="mb-3 mt-2 text-[clamp(28px,5vw,38px)] font-extrabold tracking-[-0.02em]">
          Simple Steps, <span className="text-primary">Better Journeys</span>
        </h2>
        <p className="mx-auto max-w-[520px] leading-relaxed text-muted-foreground">
          From search to boarding in three steps.
        </p>
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-6">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4 rounded-[18px] border border-border bg-card p-6">
            <span className="grid h-[46px] w-[46px] flex-none place-items-center rounded-full bg-tint font-extrabold text-primary">
              {i + 1}
            </span>
            <div>
              <h3 className="mb-1 font-bold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="bg-gradient-band px-6 py-[72px] text-white max-md:py-14">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-8">
        <div className="max-w-[620px]">
          <div className="text-xs font-extrabold tracking-[0.2em] opacity-85">READY WHEN YOU ARE</div>
          <h2 className="my-3 text-[clamp(28px,5vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em]">
            Plan your next bus trip in a minute.
          </h2>
          <p className="mb-6 opacity-90">Search a route now — create a free account when you're ready to book.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/findmybus" className="rounded-xl bg-white px-[26px] py-3.5 font-bold text-[#1d4ed8] hover:bg-white/90">
              Find My Bus →
            </Link>
            <Link to="/signup" className="rounded-xl border border-white/60 px-[26px] py-3.5 font-bold text-white hover:bg-white/10">
              Create an account
            </Link>
          </div>
        </div>
        <div className="text-[30px] font-medium italic leading-snug opacity-90">
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
      <div className="relative z-[5] mx-auto -mt-[70px] max-w-[1120px] px-4 md:px-6">
        <TripSearchBar />
      </div>
      <WhyBusMate />
      <RoutesSection />
      <HowItWorks />
      <CallToAction />
    </SiteLayout>
  );
}
