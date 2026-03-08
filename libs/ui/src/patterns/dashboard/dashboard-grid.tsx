import * as React from "react";
import { cn } from "../../lib/utils";

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * CSS Grid-based dashboard layout.
 * Children should use `col-span-*` and `row-span-*` classes.
 *
 * @example
 * <DashboardGrid>
 *   <div className="lg:col-span-8">Chart</div>
 *   <div className="lg:col-span-4">Sidebar</div>
 *   <div className="lg:col-span-6">Left panel</div>
 *   <div className="lg:col-span-6">Right panel</div>
 * </DashboardGrid>
 */
export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6", className)}>
      {children}
    </div>
  );
}
