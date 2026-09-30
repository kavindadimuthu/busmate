import { lazy, Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import BrandMark from "./BrandMark";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth/AuthContext";

// The menu pulls in Radix; signed-out visitors never need it.
const AccountMenu = lazy(() => import("./AccountMenu"));
const MenuPlaceholder = () => <span aria-hidden className="h-10 w-10 animate-pulse rounded-full bg-muted touch:h-11 touch:w-11" />;

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/findmybus", label: "Find My Bus" },
  { to: "/routes", label: "Routes" },
  { to: "/contribute", label: "Contribute" },
];

export default function SiteHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const nav = isAuthenticated ? [...NAV, { to: "/tickets", label: "My Tickets" }] : NAV;
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
          {nav.map((item) => (
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
        {isAuthenticated ? (
          <Suspense fallback={<MenuPlaceholder />}>
            <AccountMenu />
          </Suspense>
        ) : isLoading ? (
          // A stored session is being checked: hold the space so Log In / Sign Up don't flash first.
          <MenuPlaceholder />
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center rounded-[10px] px-2.5 text-sm font-semibold text-foreground hover:text-primary lg:px-0 touch:min-h-11"
            >
              Log In
            </Link>
            {/* Below 360px there's only room for one account action; sign-up is one tap away on the
                login screen and on the page itself. */}
            <Link
              to="/signup"
              className="hidden min-h-10 items-center rounded-[10px] bg-primary px-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover min-[360px]:inline-flex lg:px-4 touch:min-h-11"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
