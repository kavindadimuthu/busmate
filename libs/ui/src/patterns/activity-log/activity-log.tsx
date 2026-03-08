import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  timestamp: Date;
  actor?: string;
}

interface ActivityLogProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityLog({ items, className }: ActivityLogProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {item.icon ?? (
                <div className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            {i < items.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          {/* Content */}
          <div className="flex-1 pt-1">
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {item.actor && <span>{item.actor}</span>}
              {item.actor && <span>·</span>}
              <time>
                {formatDistanceToNow(item.timestamp, { addSuffix: true })}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { ActivityItem };
