import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import SiteLayout from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/layout/PageHero";
import { useStanding } from "@/lib/standingApi";
import { accountTabs, roleOf, tabFor } from "@/lib/account.ts";
import { cn } from "@/lib/utils";

/** The account area: a small menu that shows what this passenger has (Profile and My tickets for everyone, and
 * Contributions or Review when their standing gives them those) beside the page they are on. A strip across the top
 * on a phone, a menu down the side on a desktop. The tabs come from their standing; the server decides what they may
 * actually do, so a hidden tab is never the only thing keeping a page closed. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const standing = useStanding().data;
  const tabs = accountTabs(roleOf(standing), standing);
  const current = tabFor(pathname);

  return (
    <SiteLayout>
      <PageHero compact>
        <h1 className="mt-4 text-[clamp(24px,6.6vw,42px)] font-extrabold leading-[1.1] tracking-[-0.03em]">Account</h1>
      </PageHero>

      <div className="mx-auto max-w-[1240px] px-3 pb-16 pt-4 min-[360px]:px-4 md:px-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8 lg:pt-6">
        <nav aria-label="Account" className="mb-4 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
          <ul className="flex gap-0.5 overflow-x-auto rounded-2xl border border-border bg-card p-1 lg:flex-col lg:overflow-visible lg:p-1.5">
            {tabs.map((t) => {
              const active = t.id === current;
              return (
                <li key={t.id} className="flex-1 lg:flex-none">
                  <Link
                    to={t.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center justify-center whitespace-nowrap rounded-xl px-2 text-[13px] font-bold max-[359px]:px-1 max-[359px]:text-[12px] min-[400px]:px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:justify-start lg:px-4 lg:text-sm",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-soft hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </SiteLayout>
  );
}
