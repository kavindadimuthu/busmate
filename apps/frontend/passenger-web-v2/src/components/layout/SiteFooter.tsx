import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

// Links only to pages that exist (INC-064): the design's newsletter box and "#" links are left out.
const EXPLORE = [
  { to: "/", label: "Home" },
  { to: "/findmybus", label: "Find My Bus" },
  { to: "/routes", label: "Routes" },
];

const GET_INVOLVED_SIGNED_OUT = [
  { to: "/contribute", label: "Contribute" },
  { to: "/signup", label: "Create an account" },
  { to: "/login", label: "Log In" },
];

const GET_INVOLVED_SIGNED_IN = [
  { to: "/contribute", label: "Contribute" },
  { to: "/tickets", label: "My Tickets" },
  { to: "/profile", label: "Account" },
];

// Thumb-sized (40px) on phones and any touchscreen; text height only on mouse-driven desktops.
const LINK = "inline-flex min-h-10 items-center text-slate-300 transition-colors hover:text-white md:min-h-0 touch:min-h-10";

export default function SiteFooter() {
  const { isAuthenticated } = useAuth();
  const COLUMNS = [
    { title: "Explore", links: EXPLORE },
    { title: "Get involved", links: isAuthenticated ? GET_INVOLVED_SIGNED_IN : GET_INVOLVED_SIGNED_OUT },
  ];
  return (
    <footer className="bg-footer px-4 pb-6 pt-10 text-slate-300 min-[400px]:px-5 md:px-6 md:pt-14">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-7 text-sm md:grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] md:gap-9">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-2 text-xl font-extrabold text-white">BusMate</div>
          <p className="max-w-sm leading-relaxed">
            Your companion for Sri Lanka's public buses: find a bus between any two stops, book your seat and
            travel with a digital ticket.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <div className="mb-1 font-bold text-white md:mb-2">{col.title}</div>
            <ul className="md:space-y-2">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 md:col-span-1">
          <div className="mb-1 font-bold text-white md:mb-2">Contact</div>
          <ul className="md:space-y-2">
            <li>
              <a href="mailto:info@busmate.lk" className={`${LINK} gap-2`}>
                <Mail className="h-4 w-4" /> info@busmate.lk
              </a>
            </li>
            <li>
              <a href="tel:+94112345678" className={`${LINK} gap-2`}>
                <Phone className="h-4 w-4" /> +94 11 234 5678
              </a>
            </li>
            <li className="py-2 md:py-0">Colombo, Sri Lanka</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-7 max-w-[1200px] border-t border-slate-800 pt-5 text-xs md:mt-8">
        © {new Date().getFullYear()} BusMate. All rights reserved.
      </div>
    </footer>
  );
}
