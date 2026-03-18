// libs/ui/src/patterns/stats-card/stats-card.tsx

import * as React from "react";
import { Card, CardContent } from "../../components/card";
import { cn } from "../../lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, description, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden py-0", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs">
                {trend.direction === "up" && <ArrowUp className="h-3 w-3 text-emerald-500" />}
                {trend.direction === "down" && <ArrowDown className="h-3 w-3 text-red-500" />}
                {trend.direction === "neutral" && <Minus className="h-3 w-3 text-gray-400" />}
                <span
                  className={cn(
                    trend.direction === "up" && "text-emerald-600",
                    trend.direction === "down" && "text-red-600",
                    trend.direction === "neutral" && "text-gray-500"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
