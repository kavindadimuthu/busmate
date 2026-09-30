import { Link, NavLink, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";
import heroBus from "@/assets/hero-bus.webp";

// Only things a passenger can do today; the design's usage figures and "live tracking" are left out.
const PERKS = ["Find buses between any two stops", "Book your seat and pay online", "Keep your QR tickets in one place"];

interface AuthLayoutProps {
  heading: string;
  intro: string;
  side: { heading: string; accent: string; body: string };
  children: React.ReactNode;
  footer: React.ReactNode;
}

const TAB =
  "flex min-h-11 flex-1 items-center justify-center rounded-[9px] text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Phone: brand + theme switch, a Log In / Sign Up switch, then the form, with nothing above it that
 * pushes it down. From lg up it becomes the design's two columns, with the brand panel on the left. */
export default function AuthLayout({ heading, intro, side, children, footer }: AuthLayoutProps) {
  // Switching tabs keeps where the passenger was headed (`from`), so sign-up then log-in still lands there.
  const { state } = useLocation();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside
        className="relative hidden flex-col overflow-hidden bg-[#1e3a8a] bg-cover px-12 py-10 text-white lg:flex"
        style={{ backgroundImage: `url(${heroBus})`, backgroundPosition: "80% center" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(9,22,68,.92),rgba(30,64,175,.72)_70%,rgba(59,130,246,.35))]" />
        <Link to="/" className="relative flex w-fit items-center gap-2.5 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-[11px] border border-white/30 bg-white/20 font-extrabold">
            B
          </span>
          <span className="text-lg font-extrabold">BusMate</span>
        </Link>
        <div className="relative my-auto py-12">
          <h1 className="mb-4 text-[46px] font-extrabold leading-[1.08] tracking-[-0.03em]">
            {side.heading} <span className="text-highlight">{side.accent}</span>
          </h1>
          <p className="mb-7 max-w-[400px] leading-relaxed text-white/90">{side.body}</p>
          <ul className="grid gap-3 text-sm font-semibold">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-4 pb-8 pt-3 min-[400px]:px-5 lg:px-12 lg:py-7">
        <div className="flex items-center justify-between">
          <BrandMark className="py-1.5 lg:hidden" />
          <Link to="/" className="hidden text-sm font-semibold text-foreground hover:text-primary lg:block">
            ← Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[420px] pt-6 lg:my-auto lg:py-8">
          <nav aria-label="Account" className="mb-6 flex rounded-xl border border-border bg-alt p-1 lg:mb-7">
            {[
              { to: "/login", label: "Log In" },
              { to: "/signup", label: "Sign Up" },
            ].map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                replace
                state={state}
                className={({ isActive }) =>
                  cn(TAB, isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          <h2 className="mb-2 text-[clamp(26px,7vw,32px)] font-extrabold leading-tight tracking-[-0.02em]">{heading}</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">{intro}</p>
          {children}
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  );
}
