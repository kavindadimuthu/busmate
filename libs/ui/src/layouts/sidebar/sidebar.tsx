"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/button";
import { ScrollArea } from "../../components/scroll-area";
import { Separator } from "../../components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/tooltip";
import type { NavGroup, NavItem } from "./types";

export type { NavItem, NavGroup, NavigationConfig, SidebarNavItem, SidebarNavGroup } from "./types";

// ── Props ──────────────────────────────────────────────────

export interface SidebarProps {
  brand: {
    logo: React.ReactNode;
  };
  navigation: NavGroup[];
  activeItemId: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  userSection?: React.ReactNode;
  className?: string;
}

// ── Component ──────────────────────────────────────────────

export function Sidebar({
  brand,
  navigation,
  activeItemId,
  collapsed,
  onCollapse,
  userSection,
  className,
}: SidebarProps) {
  const [brandHovered, setBrandHovered] = React.useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-20" : "w-68",
          className
        )}
      >
        {/* Brand Section with Collapse Toggle */}
        <div 
          className="relative flex items-center justify-between px-4 py-4 h-16 border-b border-sidebar-muted/20"
          onMouseEnter={() => setBrandHovered(true)}
          onMouseLeave={() => setBrandHovered(false)}
        >
          {/* Logo - centered when collapsed, hidden on hover when collapsed */}
          <div className={cn(
            "flex-shrink-0",
            collapsed ? "flex-1 flex justify-center" : "",
            collapsed && brandHovered && "opacity-0 pointer-events-none"
          )}>
            {brand.logo}
          </div>

          {/* Collapse Toggle - always shown when expanded */}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/30 ml-1"
              onClick={() => onCollapse(!collapsed)}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Collapse Toggle - shown on hover when collapsed */}
          {collapsed && brandHovered && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/30 inset-0 flex items-center justify-center"
              onClick={() => onCollapse(!collapsed)}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          {navigation.map((group, gi) => (
            <div key={gi}>
              {group.label && !collapsed && (
                <div className="mt-4 px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.label}
                </div>
              )}
              {gi > 0 && <Separator className="my-2 bg-sidebar-muted/20" />}
              <nav className="space-y-0.5 px-2">
                {group.items.map((item) => (
                  <SidebarNavLink
                    key={item.id}
                    item={item}
                    active={activeItemId === item.id}
                    collapsed={collapsed}
                  />
                ))}
              </nav>
            </div>
          ))}
        </ScrollArea>

        {/* User Section - Fixed at Bottom */}
        {userSection && (
          <div>
            <Separator className="bg-sidebar-muted/20" />
            <div className="p-2">
              {userSection}
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

// ── Nav Link ───────────────────────────────────────────────

interface SidebarNavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}

function SidebarNavLink({ item, active, collapsed }: SidebarNavLinkProps) {
  const Icon = item.icon;

  const link = (
    <a
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-muted/30",
        item.disabled && "opacity-50 pointer-events-none",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-sidebar-active px-2 py-0.5 text-xs font-medium text-sidebar-active-foreground">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
    </a>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-1 text-xs opacity-70">({item.badge})</span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
