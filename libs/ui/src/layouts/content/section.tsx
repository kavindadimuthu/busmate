import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
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
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
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
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
