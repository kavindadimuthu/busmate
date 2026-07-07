"use client";

import * as React from "react";
import { cn } from "../lib/utils";

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
