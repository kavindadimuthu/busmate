import { Link, useLocation } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";

// Paths the current passenger-web serves that v2 hasn't rebuilt yet (ADR-029). Anything else is a
// plain not-found.
const PLANNED = ["/findmybus", "/routes", "/profile", "/booking", "/tickets", "/contribute"];

export default function NotRebuiltPage() {
  const { pathname } = useLocation();
  const planned = PLANNED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="text-xs font-extrabold tracking-[0.2em] text-primary">{planned ? "COMING TO V2" : "404"}</div>
        <h1 className="mb-3 mt-2 text-3xl font-extrabold tracking-[-0.02em]">
          {planned ? "This page hasn't been rebuilt yet" : "Page not found"}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {planned
            ? "The new BusMate is being rebuilt screen by screen. This one still lives in the current app for now."
            : "There's nothing at this address."}
        </p>
        <Link to="/" className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary-hover">
          Back to Home
        </Link>
      </section>
    </SiteLayout>
  );
}
