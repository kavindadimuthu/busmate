import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Moon, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import type { NavItem } from "./navItems";

const ROW = "flex min-h-14 w-full items-center gap-3.5 rounded-xl px-3.5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The header's menu below the desktop width: a sheet that comes up from the bottom, where a thumb reaches, with the
 * pages as large rows instead of a strip squeezed under the logo. Closes itself when a page is chosen. */
export default function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const dark = resolvedTheme === "dark";

  useEffect(() => setOpen(false), [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent variant="sheet" className="gap-2 p-3">
        <DialogTitle className="flex min-h-11 items-center px-1.5">Menu</DialogTitle>
        <DialogDescription className="sr-only">Pages on BusMate, your account and the colour theme.</DialogDescription>

        <nav aria-label="Menu">
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => cn(ROW, isActive ? "bg-primary/10 font-bold text-primary" : "text-foreground hover:bg-accent")}
                >
                  <item.icon className="h-5 w-5 flex-none" aria-hidden />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-1 grid gap-2 border-t border-border pt-3">
          {!isAuthenticated && !isLoading && (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border-[1.5px] border-border text-[15px] font-bold hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Log In
              </Link>
              <Link to="/signup" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Sign Up
              </Link>
            </div>
          )}
          <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} className={cn(ROW, "text-foreground hover:bg-accent")}>
            {dark ? <Sun className="h-5 w-5 flex-none" aria-hidden /> : <Moon className="h-5 w-5 flex-none" aria-hidden />}
            {dark ? "Switch to light theme" : "Switch to dark theme"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
