"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { AppShell, Sidebar, Header } from "@busmate/ui";
import { PageProvider, usePageContext, usePageActionsValue } from "@/context/PageContext";
import { motNavigation } from "@/config/navigation";
import { MotSidebarUser } from "./mot-sidebar-user";
import type UserData from "@/types/UserData";

// ── Active item detection ─────────────────────────────────────────

/**
 * Derives the active sidebar item ID from the current pathname.
 * Falls back to "dashboard" if the segment cannot be determined.
 *
 * /mot/bus-stops     → "bus-stops"
 * /mot/routes/[id]   → "routes"
 * /mot              → "dashboard"
 */
function getActiveItemFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // segments[0] = "mot", segments[1] = the feature segment
  return segments[1] ?? "dashboard";
}

// ── Logo component ────────────────────────────────────────────────

function BrandLogo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <Image
        src="/images/logo/busmate-icon.png"
        alt="BusMate LK"
        width={40}
        height={32}
        className="w-10 h-8 object-cover"
      />
    );
  }
  return (
    <div className="flex items-center gap-0">
      <Image
        src="/images/logo/busmate-icon.png"
        alt="BusMate LK"
        width={40}
        height={32}
        className="w-10 h-8 object-cover shrink-0"
      />
      <Image
        src="/images/logo/busmate-text.png"
        alt="BusMate LK"
        width={128}
        height={40}
        className="w-32 h-10 object-cover shrink-0 -ml-2"
      />
    </div>
  );
}

// ── Inner layout (reads from PageContext) ─────────────────────────

interface MotLayoutInnerProps {
  children: React.ReactNode;
  userData: UserData;
}

function MotLayoutInner({ children, userData }: MotLayoutInnerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { metadata } = usePageContext();
  const actions = usePageActionsValue();
  const pathname = usePathname();

  // pageItem set by pages via useSetPageMetadata; pathname fallback
  const activeItemId =
    metadata.activeItem || getActiveItemFromPathname(pathname);

  return (
    <AppShell
      sidebarCollapsed={collapsed}
      sidebar={
        <Sidebar
          brand={{
            logo: <BrandLogo collapsed={collapsed} />,
          }}
          navigation={motNavigation.groups}
          activeItemId={activeItemId}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          userSection={<MotSidebarUser userData={userData} collapsed={collapsed} />}
        />
      }
      header={
        <Header
          title={metadata.title || "Dashboard"}
          description={metadata.description}
          breadcrumbs={metadata.breadcrumbs}
          actions={actions}
        />
      }
    >
      {children}
    </AppShell>
  );
}

// ── Public component ──────────────────────────────────────────────

export interface MotLayoutClientProps {
  children: React.ReactNode;
  userData: UserData;
}

/**
 * MOT Portal Layout Client
 *
 * Replaces the generic `LayoutClient` for the MOT role.
 * Uses AppShell + Sidebar + Header from `@busmate/ui` instead of the
 * legacy `SidebarClient` + role-specific content header.
 *
 * Wrap this component in the MOT root layout server component.
 * Child pages declare their metadata via `useSetPageMetadata` and
 * their action buttons via `useSetPageActions`.
 *
 * @example
 * ```tsx
 * // app/mot/layout.tsx
 * return <MotLayoutClient userData={userData}>{children}</MotLayoutClient>;
 * ```
 */
export function MotLayoutClient({ children, userData }: MotLayoutClientProps) {
  return (
    <PageProvider
      initialMetadata={{
        title: "Dashboard",
        description: "Comprehensive overview of the transport management system",
        activeItem: "dashboard",
        showBreadcrumbs: false,
        padding: 6,
      }}
    >
      <MotLayoutInner userData={userData}>{children}</MotLayoutInner>
    </PageProvider>
  );
}
