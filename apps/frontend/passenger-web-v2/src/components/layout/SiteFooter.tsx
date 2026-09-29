import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

// Links only to pages that exist (INC-064): the design's newsletter box and "#" links are left out.
const COLUMNS = [
  {
    title: "Explore",
    links: [
      { to: "/", label: "Home" },
      { to: "/findmybus", label: "Find My Bus" },
      { to: "/routes", label: "Routes" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { to: "/contribute", label: "Contribute" },
      { to: "/signup", label: "Create an account" },
      { to: "/login", label: "Log In" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-footer px-6 pb-6 pt-14 text-slate-300">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-9 text-sm">
        <div>
          <div className="mb-2 text-xl font-extrabold text-white">BusMate</div>
          <p className="leading-relaxed">
            Your companion for Sri Lanka's public buses: find a bus between any two stops, book your seat and
            travel with a digital ticket.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-2 font-bold text-white">{col.title}</div>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="mb-2 font-bold text-white">Contact</div>
          <ul className="space-y-2">
            <li>
              <a href="mailto:info@busmate.lk" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
                <Mail className="h-4 w-4" /> info@busmate.lk
              </a>
            </li>
            <li>
              <a href="tel:+94112345678" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
                <Phone className="h-4 w-4" /> +94 11 234 5678
              </a>
            </li>
            <li>Colombo, Sri Lanka</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1200px] border-t border-slate-800 pt-5 text-xs">
        © {new Date().getFullYear()} BusMate. All rights reserved.
      </div>
    </footer>
  );
}
