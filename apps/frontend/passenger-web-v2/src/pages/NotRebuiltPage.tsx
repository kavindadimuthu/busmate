import { Link } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";

/** Any address v2 has no page for. Every screen of the current passenger-web is now rebuilt, so this is a plain 404
 * (it used to say "coming to v2" for addresses that had not been rebuilt yet). */
export default function NotRebuiltPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="text-xs font-extrabold tracking-[0.2em] text-primary">404</div>
        <h1 className="mb-3 mt-2 text-3xl font-extrabold tracking-[-0.02em]">Page not found</h1>
        <p className="mb-8 text-muted-foreground">There's nothing at this address.</p>
        <Link to="/" className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary-hover">
          Back to Home
        </Link>
      </section>
    </SiteLayout>
  );
}
