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
      {/* Below md the nav drops to its own full-width row and scrolls sideways, as in the design,
          instead of hiding behind a menu button. */}
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2.5 gap-y-2 px-4 py-2.5 md:flex-nowrap md:gap-6 md:px-6 md:py-3">
        <BrandMark tagline className="mr-auto md:mr-0" />

        <nav
          aria-label="Main"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-[22px] overflow-x-auto whitespace-nowrap px-4 pb-1 pt-2 text-sm font-semibold md:order-none md:mx-auto md:w-auto md:gap-7 md:overflow-visible md:p-0"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex-none rounded-md py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:py-0",
                  isActive ? "text-primary" : "text-foreground hover:text-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
        <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary">
          Log In
        </Link>
        <Link
          to="/signup"
          className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
