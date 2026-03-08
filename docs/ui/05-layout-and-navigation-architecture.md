# 05 — Layout and Navigation Architecture

> **Scope**: Defines the global UI shell, sidebar navigation, top header, content layout, and responsive design strategy for all BusMate portals.
> **Goal**: Create a unified, responsive layout system that works across all 4 role-based portals (MOT, Admin, Operator, Timekeeper).

---

## Table of Contents

1. [Layout Overview](#1-layout-overview)
2. [App Shell Architecture](#2-app-shell-architecture)
3. [Sidebar Navigation](#3-sidebar-navigation)
4. [Top Header / Content Header](#4-top-header--content-header)
5. [Content Area](#5-content-area)
6. [Page Structure Patterns](#6-page-structure-patterns)
7. [Responsive Design Strategy](#7-responsive-design-strategy)
8. [Navigation Data Architecture](#8-navigation-data-architecture)
9. [Implementation Guide](#9-implementation-guide)

---

## 1. Layout Overview

### Visual Layout

```
┌──────────────────────────────────────────────────────────┐
│ Browser Window                                            │
│                                                           │
│ ┌────────┬───────────────────────────────────────────────┐│
│ │        │  TOP HEADER                                   ││
│ │        │  ┌─────────────────────────────────────────┐  ││
│ │        │  │ Breadcrumbs                              │  ││
│ │        │  │ Page Title          [Action] [Action]    │  ││
│ │        │  │ Page Description                         │  ││
│ │        │  └─────────────────────────────────────────┘  ││
│ │  S     │───────────────────────────────────────────────││
│ │  I     │  CONTENT AREA                                 ││
│ │  D     │  ┌─────────────────────────────────────────┐  ││
│ │  E     │  │ Stats Cards (KPI row)                    │  ││
│ │  B     │  └─────────────────────────────────────────┘  ││
│ │  A     │  ┌─────────────────────────────────────────┐  ││
│ │  R     │  │ Filter Bar / Search                      │  ││
│ │        │  └─────────────────────────────────────────┘  ││
│ │ ┌────┐ │  ┌─────────────────────────────────────────┐  ││
│ │ │Logo│ │  │ Main Content                             │  ││
│ │ ├────┤ │  │ (Data Table / Form / Dashboard Grid)     │  ││
│ │ │Nav │ │  │                                          │  ││
│ │ │Item│ │  │                                          │  ││
│ │ │Nav │ │  │                                          │  ││
│ │ │Item│ │  └─────────────────────────────────────────┘  ││
│ │ │Nav │ │  ┌─────────────────────────────────────────┐  ││
│ │ │... │ │  │ Pagination                               │  ││
│ │ ├────┤ │  └─────────────────────────────────────────┘  ││
│ │ │User│ │                                               ││
│ │ └────┘ │                                               ││
│ └────────┴───────────────────────────────────────────────┘│
│                                                           │
│ Sidebar: 272px expanded / 80px collapsed                  │
└──────────────────────────────────────────────────────────┘
```

### Layout Measurements

| Element | Expanded | Collapsed | Mobile |
|---------|----------|-----------|--------|
| Sidebar width | 272px (`w-68`) | 80px (`w-20`) | Off-screen (sheet overlay) |
| Header height | ~120px (varies by content) | Same | Same |
| Content padding | 24px (`p-6`) | Same | 16px (`p-4`) |
| Content max-width | None (fluid) | Same | Same |

---

## 2. App Shell Architecture

The App Shell is the outermost layout component that provides the sidebar + header + content structure.

### Component: AppShell

```tsx
// libs/ui/src/layouts/app-shell.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
  className?: string;
}

export function AppShell({
  sidebar,
  header,
  children,
  sidebarCollapsed = false,
  className,
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Sidebar — fixed position */}
      {sidebar}

      {/* Main area — shifts based on sidebar width */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out",
          sidebarCollapsed ? "ml-20" : "ml-68"
        )}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          {header}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Mobile App Shell

```tsx
// libs/ui/src/layouts/mobile-app-shell.tsx

"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/sheet";
import { Button } from "@/components/button";
import { Menu } from "lucide-react";

interface MobileAppShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MobileAppShell({ sidebar, header, children }: MobileAppShellProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar as sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Header with hamburger */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">{header}</div>
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
```

### Responsive Shell Wrapper

```tsx
// libs/ui/src/layouts/responsive-shell.tsx

"use client";

import * as React from "react";
import { AppShell } from "./app-shell";
import { MobileAppShell } from "./mobile-app-shell";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveShellProps {
  sidebar: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  header: React.ReactNode;
  mobileHeader?: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function ResponsiveShell({
  sidebar,
  mobileSidebar,
  header,
  mobileHeader,
  children,
  defaultCollapsed = false,
}: ResponsiveShellProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  if (!isDesktop) {
    return (
      <MobileAppShell
        sidebar={mobileSidebar ?? sidebar}
        header={mobileHeader ?? header}
      >
        {children}
      </MobileAppShell>
    );
  }

  return (
    <AppShell
      sidebar={sidebar}
      header={header}
      sidebarCollapsed={collapsed}
    >
      {children}
    </AppShell>
  );
}
```

---

## 3. Sidebar Navigation

### 3.1 Sidebar Structure

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │ LOGO / BRAND      │  │  ← Brand header
│  │ BusMate           │  │
│  └───────────────────┘  │
│  ─────────────────────  │  ← Separator
│  ┌───────────────────┐  │
│  │ ● Dashboard       │  │  ← Navigation section
│  │   Bus Stops       │  │
│  │   Routes          │  │
│  │   Schedules       │  │
│  │   Trips           │  │
│  └───────────────────┘  │
│  ─────────────────────  │  ← Separator
│  ┌───────────────────┐  │
│  │ Users & Ops       │  │  ← Section group label
│  │   Operators       │  │
│  │   Staff           │  │
│  │   Permits         │  │
│  └───────────────────┘  │
│  ─────────────────────  │
│  ┌───────────────────┐  │
│  │   Analytics       │  │
│  │   Notifications   │  │
│  │   Policies        │  │
│  └───────────────────┘  │
│                         │
│  ─── spacer ────────── │  ← Push to bottom
│  ┌───────────────────┐  │
│  │ ◀ Collapse        │  │  ← Collapse button
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 👤 User avatar   │  │  ← User section
│  │    Name, Role     │  │
│  │    ⋮ Menu         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 3.2 Sidebar Components

```tsx
// libs/ui/src/layouts/sidebar/sidebar.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { ScrollArea } from "@/components/scroll-area";
import { Separator } from "@/components/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";

// ── Types ─────────────────────────────────────────────────

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  disabled?: boolean;
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  brand: {
    logo: React.ReactNode;
    title: string;
    subtitle?: string;
  };
  navigation: SidebarNavGroup[];
  activeItemId: string;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  userSection?: React.ReactNode;
  className?: string;
}

// ── Component ─────────────────────────────────────────────

export function Sidebar({
  brand,
  navigation,
  activeItemId,
  collapsed,
  onCollapse,
  userSection,
  className,
}: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-300",
          collapsed ? "w-20" : "w-68",
          className
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-muted/20">
          <div className="flex-shrink-0">{brand.logo}</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-semibold text-sm truncate">{brand.title}</div>
              {brand.subtitle && (
                <div className="text-xs text-sidebar-foreground/60 truncate">{brand.subtitle}</div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          {navigation.map((group, gi) => (
            <div key={gi}>
              {group.label && !collapsed && (
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
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

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-muted/20 p-2">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-muted/30"
            onClick={() => onCollapse(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* User section */}
        {userSection && (
          <div className="border-t border-sidebar-muted/20 p-2">
            {userSection}
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

// ── Nav Link ──────────────────────────────────────────────

interface SidebarNavLinkProps {
  item: SidebarNavItem;
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
```

### 3.3 Sidebar Color Tokens

```css
/* Used in the sidebar */
--sidebar:                    222 47% 11%;     /* Dark background */
--sidebar-foreground:         210 40% 96%;     /* Light text */
--sidebar-active:             221 83% 48%;     /* Active item bg (blue) */
--sidebar-active-foreground:  0 0% 100%;       /* Active item text (white) */
--sidebar-muted:              217 33% 17%;     /* Subtle backgrounds */
```

---

## 4. Top Header / Content Header

### 4.1 Header Structure

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumbs: Home > Routes > Route 123                   │
│                                                          │
│ Routes Management                   [Import] [+ Create]  │
│ Manage public bus routes across the network              │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Header Component

```tsx
// libs/ui/src/layouts/header/header.tsx

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/separator";

export interface HeaderBreadcrumb {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface HeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: HeaderBreadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function Header({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: HeaderProps) {
  return (
    <div className={cn("px-6 py-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <a href="#" className="hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </a>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <span className="text-muted-foreground/40">/</span>
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Unified Header for All Roles

Currently, BusMate has 4 separate content headers:
- `AdminContentHeader`
- `MotContentHeader`
- `OperatorContentHeader`
- `TimekeeperContentHeader`

These should be **consolidated into one** `Header` component in `libs/ui/src/layouts/header/`. Role-specific differences (if any) are handled via props or composition, not separate components.

---

## 5. Content Area

### 5.1 PageContainer

```tsx
// libs/ui/src/layouts/content/page-container.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width constraint */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const maxWidthMap = {
  sm:   "max-w-screen-sm",
  md:   "max-w-screen-md",
  lg:   "max-w-screen-lg",
  xl:   "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  maxWidth = "full",
}: PageContainerProps) {
  return (
    <div className={cn("space-y-6", maxWidthMap[maxWidth], className)}>
      {children}
    </div>
  );
}
```

### 5.2 Section

```tsx
// libs/ui/src/layouts/content/section.tsx

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "card" | "flat";
  className?: string;
}

export function Section({
  title,
  description,
  children,
  actions,
  variant = "flat",
  className,
}: SectionProps) {
  if (variant === "card") {
    return (
      <Card className={className}>
        {(title || description || actions) && (
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {actions}
          </CardHeader>
        )}
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
```

---

## 6. Page Structure Patterns

### 6.1 List Page Pattern

Used for: Routes, Bus Stops, Buses, Schedules, Trips, Operators, Staff, Permits, etc.

```
┌──────────────────────────────────────────────────────────┐
│ [StatsCardGrid]                                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │
│ │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │                     │
│ └──────┘ └──────┘ └──────┘ └──────┘                     │
│                                                           │
│ [FilterBar]                                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ 🔍 Search...        [Status ▾] [Type ▾]  [Filters] │  │
│ │ ┌──────┐ ┌──────┐ ┌──────┐                          │  │
│ │ │Chip  │ │Chip  │ │Clear │                          │  │
│ │ └──────┘ └──────┘ └──────┘                          │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ [DataTable]                                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Column A ▲ │ Column B   │ Column C   │ Actions      │  │
│ │────────────┼────────────┼────────────┼──────────────│  │
│ │ Data       │ Data       │ ●Active    │ 👁 ✏ 🗑      │  │
│ │ Data       │ Data       │ ○Inactive  │ 👁 ✏ 🗑      │  │
│ │ Data       │ Data       │ ◑Pending   │ 👁 ✏ 🗑      │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ [Pagination]                                              │
│ ◀ 1 2 3 ... 10 ▶                   10 per page ▾        │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Detail Page Pattern

Used for: Route detail, Bus Stop detail, Schedule detail, Trip detail, etc.

```
┌──────────────────────────────────────────────────────────┐
│ [Summary Section]                                         │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Entity Name                        ● Active          │  │
│ │ ID: xxx-xxx  │ Created: Jan 1      [Edit] [Delete]  │  │
│ │                                                      │  │
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│ │ │ Field 1 │ │ Field 2 │ │ Field 3 │ │ Field 4 │   │  │
│ │ │ Value   │ │ Value   │ │ Value   │ │ Value   │   │  │
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ [Tabs]                                                    │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [ Overview ] [ Stops ] [ Map ] [ Schedules ] [ ... ] │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                       │ │
│ │  Tab content area                                     │ │
│ │                                                       │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Dashboard Page Pattern

```
┌──────────────────────────────────────────────────────────┐
│ [StatsCardGrid]                                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│ │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │           │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                           │
│ ┌──────────────────────────┐ ┌──────────────────────────┐│
│ │ Trends Chart             │ │ Fleet Status             ││
│ │ ┌──────────────────────┐ │ │ ┌──────────────────────┐ ││
│ │ │ 📈 Line/Bar Chart    │ │ │ │ Status Breakdown     │ ││
│ │ └──────────────────────┘ │ │ │ ● Active: 120        │ ││
│ └──────────────────────────┘ │ │ ● Idle: 45           │ ││
│                               │ └──────────────────────┘ ││
│                               └──────────────────────────┘│
│ ┌──────────────────────────┐ ┌──────────────────────────┐│
│ │ Activity Feed            │ │ Alerts                   ││
│ │ ● User X did Y          │ │ ⚠ Alert message         ││
│ │ ● User A did B          │ │ ⚠ Alert message         ││
│ └──────────────────────────┘ └──────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 6.4 Form Page Pattern

Used for: Add/Edit routes, bus stops, operators, staff, permits, etc.

```
┌──────────────────────────────────────────────────────────┐
│ [Form Container — max-width: 768px, centered]             │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Section: Basic Information                           │  │
│ │ ┌───────────────────┐ ┌───────────────────┐         │  │
│ │ │ Label             │ │ Label             │         │  │
│ │ │ [Input field     ]│ │ [Input field     ]│         │  │
│ │ │ Help text         │ │ Error message     │         │  │
│ │ └───────────────────┘ └───────────────────┘         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ Section: Location Details                            │  │
│ │ ┌───────────────────────────────────────────┐       │  │
│ │ │ [Map component                            ]│       │  │
│ │ └───────────────────────────────────────────┘       │  │
│ │ ┌───────────────────┐ ┌───────────────────┐         │  │
│ │ │ Latitude          │ │ Longitude         │         │  │
│ │ │ [Input           ]│ │ [Input           ]│         │  │
│ │ └───────────────────┘ └───────────────────┘         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐  │
│ │                        [Cancel] [Save Draft] [Submit]│  │
│ └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Responsive Design Strategy

### 7.1 Breakpoint System

Using Tailwind's default breakpoints:

| Breakpoint | Width | Layout Behavior |
|-----------|-------|-----------------|
| `sm` | ≥640px | 2-column grids |
| `md` | ≥768px | Tablet layout, sidebar remains collapsed |
| `lg` | ≥1024px | Desktop layout, sidebar visible |
| `xl` | ≥1280px | Full desktop, wider spacing |
| `2xl` | ≥1536px | Wide desktop, optional sidebar expansion |

### 7.2 Responsive Behaviors

| Component | Mobile (<1024px) | Desktop (≥1024px) |
|-----------|------------------|-------------------|
| **Sidebar** | Hidden, opens as Sheet overlay | Fixed, collapsible |
| **Header** | Compact with hamburger menu | Full with breadcrumbs |
| **StatsCards** | 1-2 columns | 4-6 columns |
| **DataTable** | Horizontal scroll, fewer visible columns | Full columns |
| **FilterBar** | Stacked, filter button opens sheet | Inline horizontal |
| **Forms** | Single column | 2-column grid |
| **Dashboard** | Single column stack | 2-3 column grid |

### 7.3 Mobile-First Approach

All components are built mobile-first, then enhanced for desktop:

```tsx
// ✅ Mobile-first responsive classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards stack on mobile, 2-col on tablet, 4-col on desktop */}
</div>

// ✅ Hide non-essential columns on mobile
<TableCell className="hidden md:table-cell">
  {/* Only visible on tablet and above */}
</TableCell>
```

### 7.4 Touch-Friendly Targets

```css
/* Minimum touch target sizes */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Applied to: buttons, nav items, table action icons on mobile */
```

---

## 8. Navigation Data Architecture

### 8.1 Navigation Config Type

```typescript
// libs/ui/src/layouts/sidebar/types.ts

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
```

### 8.2 Role-Based Navigation Configs

```typescript
// apps/frontend/management-portal/src/config/navigation.ts

import {
  LayoutDashboard, MapPin, Route, Calendar, PlaneTakeoff,
  Users, Users2, FileText, ChartArea, Navigation, Bell,
  CircleDollarSign, Shield, Settings, SquareActivity,
  Bus, DollarSign
} from "lucide-react";
import type { NavigationConfig } from "@busmate/ui";

export const motNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        { id: "dashboard",  label: "Dashboard",        icon: LayoutDashboard,    href: "/mot/dashboard" },
        { id: "bus-stops",   label: "Bus Stops",        icon: MapPin,             href: "/mot/bus-stops" },
        { id: "routes",      label: "Routes",           icon: Route,              href: "/mot/routes" },
        { id: "schedules",   label: "Schedules",        icon: Calendar,           href: "/mot/schedules" },
        { id: "trips",       label: "Trips",            icon: PlaneTakeoff,       href: "/mot/trips" },
      ],
    },
    {
      label: "Management",
      items: [
        { id: "operators",   label: "Operators",        icon: Users,              href: "/mot/operators" },
        { id: "staff",       label: "Staff",            icon: Users2,             href: "/mot/staff-management" },
        { id: "permits",     label: "Permits",          icon: FileText,           href: "/mot/passenger-service-permits" },
        { id: "fares",       label: "Fares",            icon: CircleDollarSign,   href: "/mot/fares" },
      ],
    },
    {
      label: "Insights",
      items: [
        { id: "analytics",       label: "Analytics",        icon: ChartArea,      href: "/mot/analytics" },
        { id: "location-tracking", label: "Live Tracking",  icon: Navigation,     href: "/mot/location-tracking" },
        { id: "notifications",   label: "Notifications",    icon: Bell,           href: "/mot/notifications" },
        { id: "policies",        label: "Policies",         icon: Shield,         href: "/mot/policies" },
      ],
    },
  ],
};

export const adminNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, href: "/admin/dashboard" },
        { id: "users",         label: "Users",         icon: Users,           href: "/admin/users" },
        { id: "logs",          label: "Logs",          icon: FileText,        href: "/admin/logs" },
        { id: "monitoring",    label: "Monitoring",    icon: SquareActivity,  href: "/admin/monitoring" },
        { id: "notifications", label: "Notifications", icon: Bell,            href: "/admin/notifications" },
        { id: "settings",      label: "Settings",      icon: Settings,        href: "/admin/settings" },
      ],
    },
  ],
};

export const operatorNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        { id: "dashboard",   label: "Dashboard",     icon: LayoutDashboard, href: "/operator/dashboard" },
        { id: "fleet",       label: "Fleet",         icon: Bus,             href: "/operator/fleet-management" },
        { id: "trips",       label: "Trips",         icon: PlaneTakeoff,    href: "/operator/trips" },
        { id: "staff",       label: "Staff",         icon: Users2,          href: "/operator/staff-management" },
      ],
    },
    {
      label: "Finance",
      items: [
        { id: "salary",     label: "Salary",         icon: DollarSign,      href: "/operator/salary-management" },
        { id: "revenue",    label: "Revenue",        icon: ChartArea,       href: "/operator/revenue-analytics" },
        { id: "permits",    label: "Permits",        icon: FileText,        href: "/operator/passenger-service-permits" },
      ],
    },
  ],
};

export const timekeeperNavigation: NavigationConfig = {
  groups: [
    {
      items: [
        { id: "dashboard",   label: "Dashboard",     icon: LayoutDashboard, href: "/timekeeper/dashboard" },
        { id: "trips",       label: "Trips",         icon: PlaneTakeoff,    href: "/timekeeper/trips" },
        { id: "attendance",  label: "Attendance",    icon: Users,           href: "/timekeeper/attendance" },
      ],
    },
  ],
};
```

---

## 9. Implementation Guide

### 9.1 Integration in Role Layout (Example: MOT)

```tsx
// apps/frontend/management-portal/src/app/mot/layout.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserData } from "@/lib/utils/getUserData";
import { isRoleAllowedForRoute, getRoleRedirectPath } from "@/lib/utils/getRoleRedirectPath";
import { MotLayoutClient } from "@/components/layouts/mot-layout-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BUSMATE LK MOT Portal",
  description: "MOT dashboard for BUSMATE LK transportation system",
};

export default async function MotRootLayout({ children }: { children: React.ReactNode }) {
  const userData = await getUserData();

  if (!userData) redirect("/");
  if (!isRoleAllowedForRoute(userData.user_role, "/mot")) {
    redirect(getRoleRedirectPath(userData.user_role));
  }

  return <MotLayoutClient userData={userData}>{children}</MotLayoutClient>;
}
```

```tsx
// apps/frontend/management-portal/src/components/layouts/mot-layout-client.tsx

"use client";

import { useState } from "react";
import { AppShell, Sidebar, Header } from "@busmate/ui";
import { PageProvider, usePageContext } from "@/context/PageContext";
import { motNavigation } from "@/config/navigation";
import { UserActions } from "@/components/shared/UserActions";
import Image from "next/image";
import type UserData from "@/types/UserData";

function MotLayoutInner({ children, userData }: { children: React.ReactNode; userData: UserData }) {
  const [collapsed, setCollapsed] = useState(false);
  const { metadata } = usePageContext();

  return (
    <AppShell
      sidebarCollapsed={collapsed}
      sidebar={
        <Sidebar
          brand={{
            logo: <Image src="/logo.svg" alt="BusMate" width={32} height={32} />,
            title: "BUSMATE LK",
            subtitle: "MOT Portal",
          }}
          navigation={motNavigation.groups}
          activeItemId={metadata.activeItem || "dashboard"}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          userSection={<UserActions userData={userData} collapsed={collapsed} />}
        />
      }
      header={
        <Header
          title={metadata.title || "Dashboard"}
          description={metadata.description}
          breadcrumbs={metadata.breadcrumbs}
          actions={metadata.actions}
        />
      }
    >
      {children}
    </AppShell>
  );
}

export function MotLayoutClient({ children, userData }: { children: React.ReactNode; userData: UserData }) {
  return (
    <PageProvider initialMetadata={{ title: "Dashboard", activeItem: "dashboard" }}>
      <MotLayoutInner userData={userData}>{children}</MotLayoutInner>
    </PageProvider>
  );
}
```

### 9.2 Key Benefits of This Architecture

| Before | After |
|--------|-------|
| 4 role-specific content headers | 1 shared `Header` component |
| 427-line `SidebarClient.tsx` with inline nav configs | ~200-line generic `Sidebar` + data-driven configs |
| Fixed pixel margins (`ml-20`, `ml-68`) | CSS transition-based layout system |
| No mobile layout | Sheet-based mobile sidebar |
| Hardcoded sidebar colors | Token-based `--sidebar-*` variables |

---

## Summary

The layout architecture provides:

1. **AppShell** — single layout container used by all portals
2. **Data-driven Sidebar** — role navigation defined in config files, not component code
3. **Unified Header** — one component replacing 4 role-specific headers
4. **Responsive design** — mobile sheet sidebar, responsive grids, touch targets
5. **Page structure patterns** — List, Detail, Dashboard, Form — composable layouts

---

## Next Steps

Proceed to **[06 — Feature UI Patterns](./06-feature-ui-patterns.md)** to see the complete catalog of reusable patterns for admin system features.
