// Navbar for public site — no auth buttons
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import busLogo from "@/assets/bus-logo.png";
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // No auth checks for the public site — simplified nav

  // No logout / auth functions required

  return <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm border-b border-border shadow-card' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <img src={busLogo} alt="BusMate" className="h-8 w-8 object-contain filter brightness-0 invert" />
            </div>
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled ? 'text-foreground' : 'text-white'
            }`}>BusMate</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`transition-colors font-medium ${
              isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-blue-100'
            }`}>Home</Link>
            <Link to="/findmybus" className={`transition-colors font-medium ${
              isScrolled ? 'text-foreground hover:text-primary' : 'text-white hover:text-blue-100'
            }`}>FindMyBus</Link>
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
                  <img src={busLogo} alt="BusMate" className="h-6 w-6 object-contain filter brightness-0 invert" />
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