import { useNavigate } from "react-router-dom";
import { useHealthPolling } from "@/hooks/useHealthPolling";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getServices } from "@/lib/services-registry";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Zap,
  Activity,
  Server,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: healthData } = useHealthPolling(15_000);
  const services = getServices();

  const upCount = healthData?.services.filter((s) => s.status === "up").length ?? 0;
  const totalCount = services.length;

  const quickLinks = [
    {
      title: "API Explorer",
      desc: "Browse and explore API documentation",
      icon: BookOpen,
      path: "/explorer",
      color: "text-blue-500",
    },
    {
      title: "API Tester",
      desc: "Send requests and test endpoints",
      icon: Zap,
      path: "/tester",
      color: "text-yellow-500",
    },
    {
      title: "Health Monitor",
      desc: "Monitor service health and metrics",
      icon: Activity,
      path: "/health",
      color: "text-green-500",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">BusMate Dev Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal developer tools for managing and monitoring backend APIs
        </p>
      </div>

      {/* Service overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((svc) => {
          const health = healthData?.services.find((h) => h.serviceId === svc.id);
          const isUp = health?.status === "up";
          const StatusIcon = isUp ? Wifi : WifiOff;

          return (
            <Card
              key={svc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/explorer?service=${svc.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{svc.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      health
                        ? isUp
                          ? "text-method-get border-method-get/30"
                          : "text-destructive border-destructive/30"
                        : "text-muted-foreground border-border"
                    )}
                  >
                    <StatusIcon className="h-2.5 w-2.5 mr-1" />
                    {health ? (isUp ? "Up" : "Down") : "..."}
                  </Badge>
                </div>
                {health?.latencyMs !== undefined && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {health.latencyMs}ms
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            upCount === totalCount
              ? "text-method-get border-method-get/30 bg-method-get/10"
              : "text-destructive border-destructive/30 bg-destructive/10"
          )}
        >
          {upCount}/{totalCount} services healthy
        </Badge>
        {healthData?.timestamp && (
          <span className="text-[10px] text-muted-foreground">
            Last checked: {new Date(healthData.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      <Separator />

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.path}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigate(link.path)}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn("p-2 rounded-md bg-muted", link.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium flex items-center gap-1">
                      {link.title}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
