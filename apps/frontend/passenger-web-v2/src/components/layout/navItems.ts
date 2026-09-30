import { BusFront, HeartHandshake, House, Route, Ticket, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const BASE: NavItem[] = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/findmybus", label: "Find My Bus", icon: BusFront },
  { to: "/routes", label: "Routes", icon: Route },
  { to: "/contribute", label: "Contribute", icon: HeartHandshake },
];

/** The pages in the header, and in the phone menu. Signed-in visitors also get their tickets. */
export const navItems = (signedIn: boolean): NavItem[] => (signedIn ? [...BASE, { to: "/tickets", label: "My Tickets", icon: Ticket }] : BASE);
