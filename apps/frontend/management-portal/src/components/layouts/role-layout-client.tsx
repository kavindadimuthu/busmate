"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AppShell, Header, Sidebar } from "@busmate/ui";
import {
  PageProvider,
  usePageActionsValue,
  usePageContext,
  type PageMetadata,
} from "@/context/PageContext";
import {
  adminNavigation,
  motNavigation,
  operatorNavigation,
  timekeeperNavigation,
} from "@/config/navigation";
import { PortalSidebarUser } from "@/components/layouts/portal-sidebar-user";
import type UserData from "@/types/UserData";
import type { NavigationConfig } from "@busmate/ui";

interface RoleLayoutConfig {
  rolePath: "mot" | "admin" | "operator" | "timekeeper";
  navigation: NavigationConfig;
  defaultMetadata: Partial<PageMetadata>;
}

const ROLE_LAYOUTS: Record<RoleLayoutConfig["rolePath"], RoleLayoutConfig> = {
  mot: {
    rolePath: "mot",
    navigation: motNavigation,
    defaultMetadata: {
      title: "Dashboard",
      description: "Comprehensive overview of the transport management system",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  admin: {
    rolePath: "admin",
    navigation: adminNavigation,
    defaultMetadata: {
      title: "Dashboard",
      description: "Monitor system performance, user activity, and key metrics",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  operator: {
    rolePath: "operator",
    navigation: operatorNavigation,
    defaultMetadata: {
      title: "Dashboard",
      description: "Comprehensive overview of your fleet operations, revenue, and performance metrics",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
  timekeeper: {
    rolePath: "timekeeper",
    navigation: timekeeperNavigation,
    defaultMetadata: {
      title: "Dashboard",
      description: "Track attendance, monitor trips, and keep daily operations on schedule",
      activeItem: "dashboard",
      showBreadcrumbs: false,
      padding: 6,
    },
  },
};

function getActiveItemFromPathname(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments[1] ?? "dashboard";
}

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

interface RoleLayoutInnerProps {
  children: React.ReactNode;
  userData: UserData;
  config: RoleLayoutConfig;
}

function RoleLayoutInner({ children, userData, config }: RoleLayoutInnerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { metadata } = usePageContext();
  const actions = usePageActionsValue();

  const activeItemId = metadata.activeItem || getActiveItemFromPathname(pathname);

  return (
    <AppShell
      sidebarCollapsed={collapsed}
      sidebar={
        <Sidebar
          brand={{ logo: <BrandLogo collapsed={collapsed} /> }}
          navigation={config.navigation.groups}
          activeItemId={activeItemId}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          userSection={
            <PortalSidebarUser
              userData={userData}
              collapsed={collapsed}
              rolePath={config.rolePath}
            />
          }
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

export interface RoleLayoutClientProps {
  children: React.ReactNode;
  userData: UserData;
  role: RoleLayoutConfig["rolePath"];
}

export function RoleLayoutClient({ children, userData, role }: RoleLayoutClientProps) {
  const config = ROLE_LAYOUTS[role];

  return (
    <PageProvider initialMetadata={config.defaultMetadata}>
      <RoleLayoutInner userData={userData} config={config}>
        {children}
      </RoleLayoutInner>
    </PageProvider>
  );
}
