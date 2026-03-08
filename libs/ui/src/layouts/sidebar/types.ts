import * as React from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  disabled?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface NavigationConfig {
  groups: NavGroup[];
}

// Aliases for backwards compatibility / convenience
export type SidebarNavItem = NavItem;
export type SidebarNavGroup = NavGroup;
