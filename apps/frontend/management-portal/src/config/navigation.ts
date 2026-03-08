import {
  LayoutDashboard,
  MapPin,
  Route,
  Calendar,
  PlaneTakeoff,
  Users,
  Users2,
  FileText,
  ChartArea,
  Navigation,
  Bell,
  CircleDollarSign,
  Shield,
  Settings,
  SquareActivity,
  Bus,
  DollarSign,
} from "lucide-react";
import type { NavigationConfig } from "@busmate/ui";

// ── MOT Portal ────────────────────────────────────────────

export const motNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/mot/dashboard",
        },
        {
          id: "bus-stops",
          label: "Bus Stops",
          icon: MapPin,
          href: "/mot/bus-stops",
        },
        {
          id: "routes",
          label: "Routes",
          icon: Route,
          href: "/mot/routes",
        },
        {
          id: "schedules",
          label: "Schedules",
          icon: Calendar,
          href: "/mot/schedules",
        },
        {
          id: "trips",
          label: "Trips",
          icon: PlaneTakeoff,
          href: "/mot/trips",
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          id: "operators",
          label: "Operators",
          icon: Users,
          href: "/mot/operators",
        },
        {
          id: "buses",
          label: "Buses",
          icon: Bus,
          href: "/mot/buses",
        },
        {
          id: "staff",
          label: "Staff",
          icon: Users2,
          href: "/mot/staff-management",
        },
        {
          id: "passenger-service-permits",
          label: "Permits",
          icon: FileText,
          href: "/mot/passenger-service-permits",
        },
        {
          id: "fares",
          label: "Fares",
          icon: CircleDollarSign,
          href: "/mot/fares",
        },
      ],
    },
    {
      label: "Insights",
      items: [
        {
          id: "analytics",
          label: "Analytics",
          icon: ChartArea,
          href: "/mot/analytics",
        },
        {
          id: "location-tracking",
          label: "Live Tracking",
          icon: Navigation,
          href: "/mot/location-tracking",
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          href: "/mot/notifications",
        },
        {
          id: "policies",
          label: "Policies",
          icon: Shield,
          href: "/mot/policies",
        },
      ],
    },
  ],
};

// ── Admin Portal ──────────────────────────────────────────

export const adminNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        },
        {
          id: "users",
          label: "Users",
          icon: Users,
          href: "/admin/users",
        },
        {
          id: "logs",
          label: "Logs",
          icon: FileText,
          href: "/admin/logs",
        },
        {
          id: "monitoring",
          label: "Monitoring",
          icon: SquareActivity,
          href: "/admin/monitoring",
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          href: "/admin/notifications",
        },
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          href: "/admin/settings",
        },
      ],
    },
  ],
};

// ── Operator Portal ───────────────────────────────────────

export const operatorNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/operator/dashboard",
        },
        {
          id: "fleetmanagement",
          label: "Fleet",
          icon: Bus,
          href: "/operator/fleet-management",
        },
        {
          id: "trips",
          label: "Trips",
          icon: PlaneTakeoff,
          href: "/operator/trips",
        },
        {
          id: "staff",
          label: "Staff",
          icon: Users2,
          href: "/operator/staff-management",
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          id: "salary-management",
          label: "Salary",
          icon: DollarSign,
          href: "/operator/salary-management",
        },
        {
          id: "revenue-analytics",
          label: "Revenue",
          icon: ChartArea,
          href: "/operator/revenue-analytics",
        },
        {
          id: "passenger-service-permits",
          label: "Permits",
          icon: FileText,
          href: "/operator/passenger-service-permits",
        },
      ],
    },
  ],
};

// ── Timekeeper Portal ─────────────────────────────────────

export const timekeeperNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/timekeeper/dashboard",
        },
        {
          id: "trips",
          label: "Trips",
          icon: PlaneTakeoff,
          href: "/timekeeper/trips",
        },
        {
          id: "attendance",
          label: "Attendance",
          icon: Users,
          href: "/timekeeper/attendance",
        },
      ],
    },
  ],
};
