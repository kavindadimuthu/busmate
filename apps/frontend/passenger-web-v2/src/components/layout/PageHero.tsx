import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import heroBus from "@/assets/hero-bus.webp";
import { cn } from "@/lib/utils";

/** The blue strip under the header that inner pages open with; the page's card overlaps its lower edge. */
export function PageHero({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <section
      className={cn("relative overflow-hidden bg-[#1e3a8a] bg-cover px-4 pt-3 text-white md:px-6 lg:bg-[image:var(--hero)]", compact ? "pb-7 lg:pb-9" : "pb-[64px] lg:pb-[84px]")}
      style={{ ["--hero" as string]: `url(${heroBus})`, backgroundPosition: "78% center" }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,22,68,.94),rgba(30,64,175,.85))] lg:bg-[linear-gradient(90deg,rgba(9,22,68,.94)_0%,rgba(20,48,130,.85)_50%,rgba(30,64,175,.35)_100%)]" />
      <div className="relative mx-auto max-w-[1240px]">{children}</div>
    </section>
  );
}

export function HeroBackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-[13px] font-bold text-white/95 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}

/** Same look as [HeroBackLink], for going back to wherever the passenger came from. */
export function HeroBackButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-[13px] font-bold text-white/95 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {children}
    </button>
  );
}
