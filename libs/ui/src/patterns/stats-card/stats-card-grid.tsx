// libs/ui/src/patterns/stats-card/stats-card-grid.tsx

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatsCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsCardGrid({ children, className }: StatsCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {children}
    </div>
  );
}
