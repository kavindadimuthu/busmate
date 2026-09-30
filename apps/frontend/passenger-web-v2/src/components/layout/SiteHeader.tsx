import { lazy, Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import BrandMark from "./BrandMark";
import MobileMenu from "./MobileMenu";
import { navItems } from "./navItems";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth/AuthContext";

// The menu pulls in Radix; signed-out visitors never need it.
const AccountMenu = lazy(() => import("./AccountMenu"));
const MenuPlaceholder = () => <span aria-hidden className="h-11 w-11 animate-pulse rounded-full bg-muted lg:h-10 lg:w-10" />;

/** One 64px bar at every width: the brand on the left, then who you are, then (below the desktop width) a menu button
 * that opens the pages as a sheet. From lg the pages sit in the bar itself. */
export default function SiteHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const items = navItems(isAuthenticated);
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-header backdrop-blur-[14px]">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-4 min-[400px]:gap-2.5 md:px-6 lg:gap-6">
        <BrandMark tagline className="mr-auto rounded-xl py-1 lg:mr-0" />

        <nav aria-label="Main" className="hidden lg:mx-auto lg:flex lg:gap-7">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center rounded-md py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "text-primary after:absolute after:inset-x-0 after:-bottom-[15px] after:h-0.5 after:rounded-full after:bg-primary" : "text-foreground hover:text-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
        {isAuthenticated ? (
          <Suspense fallback={<MenuPlaceholder />}>
            <AccountMenu />
          </Suspense>
        ) : isLoading ? (
          // A stored session is being checked: hold the space so Log In / Sign Up don't flash first.
          <MenuPlaceholder />
        ) : (
          <>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:px-0">
              Log In
            </Link>
            {/* Under 400px there is room for one account button; Sign Up is one tap away in the menu. */}
            <Link
              to="/signup"
              className="hidden min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[400px]:inline-flex"
            >
              Sign Up
            </Link>
          </>
        )}
        <MobileMenu items={items} />
      </div>
    </header>
  );
}
