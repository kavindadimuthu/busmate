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
