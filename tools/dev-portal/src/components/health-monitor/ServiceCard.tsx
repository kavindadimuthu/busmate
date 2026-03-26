import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ServiceHealthInfo } from "@/types/service";
import { Activity, Wifi, WifiOff, Clock, Server } from "lucide-react";

const STATUS_CONFIG = {
  up: { color: "text-method-get", bg: "bg-method-get/10", border: "border-method-get/20", label: "Healthy", icon: Wifi },
  down: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Down", icon: WifiOff },
  degraded: { color: "text-method-put", bg: "bg-method-put/10", border: "border-method-put/20", label: "Degraded", icon: Activity },
  unknown: { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", label: "Unknown", icon: Server },
};

interface ServiceCardProps {
  health: ServiceHealthInfo;
  onClick?: () => void;
}

export function ServiceCard({ health, onClick }: ServiceCardProps) {
  const config = STATUS_CONFIG[health.status] || STATUS_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border",
        config.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", config.bg)}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div>
              <p className="text-sm font-medium">{health.serviceId}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{health.baseUrl}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px]", config.color, config.bg, config.border)}
          >
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", health.status === "up" ? "bg-method-get animate-pulse-dot" : health.status === "down" ? "bg-destructive" : "bg-method-put")} />
            {config.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{health.latencyMs !== undefined ? `${health.latencyMs}ms` : "—"}</span>
          </div>
          <div className="text-right text-muted-foreground text-[10px]">
            {health.lastChecked
              ? new Date(health.lastChecked).toLocaleTimeString()
              : "Never"}
          </div>
        </div>

        {/* Component statuses */}
        {health.components && Object.keys(health.components).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(health.components).map(([name, comp]) => (
              <Badge
                key={name}
                variant="secondary"
                className={cn(
                  "text-[9px] px-1 py-0",
                  comp.status === "UP" ? "text-method-get" : "text-destructive"
                )}
              >
                {name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
