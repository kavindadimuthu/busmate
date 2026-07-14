import { LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import busLogo from "@/assets/bus-logo.png";
import busLogoText from "@/assets/bus-logo-text.png";
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

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    toast.success("You've been logged out");
    navigate("/");
  };

  return <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-white/95 backdrop-blur-sm border-b border-border shadow-card'
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-0">
            <div className="py-1 rounded-lg bg-gradient-primary">
              <img src={busLogo} alt="BusMate" className="h-15 w-20 object-cover filter brightness-0 invert" />
            </div>
            <span className="text-2xl font-bold">
              <img src={busLogoText} alt="BusMate" className="h-24 w-auto" />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`transition-colors font-medium ${
              isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-blue-100'
            }`}>Home</Link>
            <Link to="/findmybus" className={`transition-colors font-medium ${
              isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-blue-100'
            }`}>FindMyBus</Link>

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
                <Button
                  asChild
                  variant="ghost"
                  className={isScrolled ? '' : 'text-white hover:bg-white/10 hover:text-white'}
                >
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="bg-gradient-primary">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
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
        <div className="fixed top-0 right-0 h-full w-[280px] bg-white z-[70] md:hidden shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <img src={busLogo} alt="BusMate" className="h-15 w-24 object-cover filter brightness-0 invert" />
                </div>
                <span className="text-xl font-bold text-foreground">BusMate</span>
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
                  className="px-4 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/findmybus"
                  className="px-4 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  FindMyBus
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
                      to="/profile"
                      className="px-4 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors rounded-lg font-medium flex items-center gap-2"
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
