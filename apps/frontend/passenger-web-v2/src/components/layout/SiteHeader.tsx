import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import BrandMark from "./BrandMark";
import ThemeToggle from "@/components/theme/ThemeToggle";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/findmybus", label: "Find My Bus" },
  { to: "/routes", label: "Routes" },
  { to: "/contribute", label: "Contribute" },
];

/** Signed-out header only; the signed-in account menu arrives with the auth increment. */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-header backdrop-blur-[14px]">
      {/* Phones and tablets: one row of brand + actions, with the nav as its own full-width strip
          below that scrolls sideways (as in the design) rather than wrapping or hiding behind a
          menu. The single-row desktop header needs ~1024px before its buttons stop wrapping. */}
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2 px-3 min-[360px]:px-4 lg:flex-nowrap lg:gap-6 lg:px-6 lg:py-3">
        <BrandMark tagline className="mr-auto py-2 lg:mr-0 lg:py-0" />

        <nav
          aria-label="Main"
          className="order-last -mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto whitespace-nowrap border-t border-border/60 px-2 [scrollbar-width:none] min-[360px]:-mx-4 min-[360px]:w-[calc(100%+2rem)] min-[360px]:px-3 lg:order-none lg:mx-auto lg:w-auto lg:gap-7 lg:overflow-visible lg:border-0 lg:p-0 [&::-webkit-scrollbar]:hidden max-[400px]:[mask-image:linear-gradient(90deg,#000_82%,transparent)]"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-11 flex-none items-center rounded-md px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:min-h-0 lg:px-0 touch:min-h-11",
                  isActive
                    ? "text-primary after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary lg:after:hidden"
                    : "text-foreground hover:text-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
        <Link
          to="/login"
          className="inline-flex min-h-10 items-center rounded-[10px] px-2.5 text-sm font-semibold text-foreground hover:text-primary lg:px-0 touch:min-h-11"
        >
          Log In
        </Link>
        {/* Below 360px there's only room for one account action; sign-up is also offered on the
            page itself and from the login screen. */}
        <Link
          to="/signup"
          className="hidden min-h-10 items-center rounded-[10px] bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover min-[360px]:inline-flex lg:px-4 touch:min-h-11"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
