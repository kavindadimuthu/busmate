import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  TestTube2,
  Activity,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/explorer", icon: BookOpen, label: "API Explorer" },
  { to: "/tester", icon: TestTube2, label: "API Tester" },
  { to: "/health", icon: Activity, label: "Health Monitor" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 ease-in-out",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo section */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80">
            <Terminal className="h-5 w-5 shrink-0 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                Dev Portal
              </span>
              <span className="text-xs text-sidebar-foreground/60">v1.0</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          {navItems.map((item) => (
            <Tooltip key={item.to} delayDuration={500}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                      collapsed && "justify-center px-2"
                    )
                  }
                >
                  {/* Active indicator bar */}
                  {({ isActive }) => (
                    <>
                      {isActive && !collapsed && (
                        <div className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />
                      )}
                      <item.icon className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                      {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="rounded-md px-3 py-1.5 text-xs font-medium">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-2 mb-3 mt-auto border-t border-sidebar-border" />

        {/* Collapse toggle */}
        <div className="px-2 pb-4">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full transition-all duration-150",
                  collapsed ? "justify-center" : "justify-between"
                )}
                onClick={() => setCollapsed(!collapsed)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {!collapsed && (
                  <span className="text-xs font-medium text-sidebar-foreground/70">
                    {collapsed ? "Expand" : "Hide"}
                  </span>
                )}
                <div className="flex items-center justify-center">
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="rounded-md px-2 py-1 text-xs font-medium">
                Expand
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
