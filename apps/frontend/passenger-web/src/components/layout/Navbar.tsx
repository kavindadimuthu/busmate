import { LogOut, Menu, Ticket, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import busLogo from "@/assets/bus-logo.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** A top-level nav link, solid-navbar only - no transparent/scroll-dependent state (that was
 * the actual bug: it assumed every page had a dark hero image directly behind the bar, which
 * was only ever true on Home and briefly on FindMyBus - everywhere else it left white text on
 * a plain white page). Highlights the current page via aria-current, not just color. */
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative px-1 py-2 font-medium transition-colors rounded-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active ? "text-primary" : "text-foreground/80 hover:text-primary",
      )}
    >
      {children}
      {active && <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary rounded-full" />}
    </Link>
  );
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    toast.success("You've been logged out");
    navigate("/");
  };

  return <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          >
            <div className="p-1.5 rounded-lg bg-gradient-primary shrink-0">
              <img src={busLogo} alt="" className="h-6 w-6 object-contain filter brightness-0 invert" />
            </div>
            {/* Real text, not the wordmark image asset: that PNG is a white-on-transparent
                lockup only ever legible over a dark hero - the exact class of bug this navbar
                redesign exists to fix, so it shouldn't reappear here for the same reason. */}
            <span className="text-xl font-bold text-foreground tracking-tight">BusMate</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/findmybus">FindMyBus</NavLink>
              <NavLink to="/routes">Routes</NavLink>
              {isAuthenticated && <NavLink to="/tickets">My Tickets</NavLink>}
            </div>

            <div className="h-6 w-px bg-border" />

            <ThemeToggle />

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label="Open account menu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                        {initialsOf(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/tickets" className="cursor-pointer">
                      <Ticket className="h-4 w-4" /> My Tickets
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <UserIcon className="h-4 w-4" /> View Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="bg-gradient-primary">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile: theme toggle + menu button */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Side Drawer */}
    {isMenuOpen && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Drawer */}
        <div className="fixed top-0 right-0 h-full w-[280px] bg-background z-[70] md:hidden shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-primary">
                  <img src={busLogo} alt="" className="h-5 w-5 object-contain filter brightness-0 invert" />
                </div>
                <span className="text-lg font-bold text-foreground">BusMate</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>

            {/* Drawer Content */}
            <nav className="flex-1 px-4 py-6">
              <div className="flex flex-col space-y-1">
                <Link
                  to="/"
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={cn(
                    "px-4 py-3 transition-colors rounded-lg font-medium",
                    pathname === "/" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/findmybus"
                  aria-current={pathname === "/findmybus" ? "page" : undefined}
                  className={cn(
                    "px-4 py-3 transition-colors rounded-lg font-medium",
                    pathname === "/findmybus" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  FindMyBus
                </Link>
                <Link
                  to="/routes"
                  aria-current={pathname === "/routes" ? "page" : undefined}
                  className={cn(
                    "px-4 py-3 transition-colors rounded-lg font-medium",
                    pathname === "/routes" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Routes
                </Link>

                {isAuthenticated ? (
                  <>
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                          {initialsOf(user?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/tickets"
                      aria-current={pathname === "/tickets" ? "page" : undefined}
                      className={cn(
                        "px-4 py-3 transition-colors rounded-lg font-medium flex items-center gap-2",
                        pathname === "/tickets" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary",
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Ticket className="h-4 w-4" /> My Tickets
                    </Link>
                    <Link
                      to="/profile"
                      aria-current={pathname === "/profile" ? "page" : undefined}
                      className={cn(
                        "px-4 py-3 transition-colors rounded-lg font-medium flex items-center gap-2",
                        pathname === "/profile" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted hover:text-primary",
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" /> View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-3 text-left text-destructive hover:bg-muted transition-colors rounded-lg font-medium flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Log Out
                    </button>
                  </>
                ) : (
                  <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2 px-4">
                    <Button asChild variant="outline" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/login">Log In</Link>
                    </Button>
                    <Button asChild className="bg-gradient-primary" onClick={() => setIsMenuOpen(false)}>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>

            {/* Drawer Footer (Optional) */}
            <div className="p-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                © 2024 BusMate. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </>
    )}
  </>;
};
export default Navbar;
