import { useState, useEffect } from "react";
import { useHealthPolling } from "@/hooks/useHealthPolling";
import { ServiceStatusGrid } from "@/components/health-monitor/ServiceStatusGrid";
import { MetricsChart, useTimeSeriesCollector } from "@/components/health-monitor/MetricsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Activity, RefreshCcw, Loader2 } from "lucide-react";

export function HealthMonitorPage() {
  const { data: healthData, isLoading, refetch, isFetching } = useHealthPolling(10_000);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Collect latency time series for selected service
  const latencySeries = useTimeSeriesCollector(30);

  // Update time series when new health data arrives
  useEffect(() => {
    if (!healthData || !selectedService) return;
    const svc = healthData.services.find((s) => s.serviceId === selectedService);
    if (svc && typeof svc.latencyMs === "number") {
      latencySeries.addPoint(svc.latencyMs);
    }
  }, [healthData, selectedService]);

  const handleServiceClick = (serviceId: string) => {
    if (selectedService !== serviceId) {
      latencySeries.reset();
    }
    setSelectedService(serviceId);
  };

  const upCount = healthData?.services.filter((s) => s.status === "up").length ?? 0;
  const totalCount = healthData?.services.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Health Monitor</h1>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              upCount === totalCount
                ? "text-method-get border-method-get/30"
                : "text-destructive border-destructive/30"
            )}
          >
            {upCount}/{totalCount} services up
          </Badge>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-border hover:bg-accent transition-colors disabled:opacity-50"
        >
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading && !healthData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading health data...</span>
            </div>
          ) : (
            <>
              <ServiceStatusGrid
                healthData={healthData?.services ?? []}
                onServiceClick={handleServiceClick}
              />

              {selectedService && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h2 className="text-sm font-medium">
                      Metrics — <span className="font-mono">{selectedService}</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MetricsChart
                        title="Response Latency"
                        unit="ms"
                        color="hsl(var(--primary))"
                        data={latencySeries.data}
                      />

                      {/* Service details card */}
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm">Service Details</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          {(() => {
                            const svc = healthData?.services.find(
                              (s) => s.serviceId === selectedService
                            );
                            if (!svc) return <p className="text-xs text-muted-foreground">No data</p>;

                            return (
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px]",
                                      svc.status === "up" ? "text-method-get" : "text-destructive"
                                    )}
                                  >
                                    {svc.status.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Latency</span>
                                  <span className="font-mono">{svc.latencyMs}ms</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Last Checked</span>
                                  <span>{new Date(svc.lastChecked).toLocaleTimeString()}</span>
                                </div>

                                {svc.components && Object.keys(svc.components).length > 0 && (
                                  <>
                                    <Separator className="my-2" />
                                    <p className="font-medium">Components</p>
                                    {Object.entries(svc.components).map(([name, comp]) => (
                                      <div key={name} className="flex justify-between">
                                        <span className="text-muted-foreground">{name}</span>
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            "text-[9px]",
                                            comp.status === "UP" ? "text-method-get" : "text-destructive"
                                          )}
                                        >
                                          {comp.status}
                                        </Badge>
                                      </div>
                                    ))}
                                  </>
                                )}

                                {svc.details && Object.keys(svc.details).length > 0 && (
                                  <>
                                    <Separator className="my-2" />
                                    <p className="font-medium">Details</p>
                                    <pre className="text-[10px] font-mono bg-muted/50 p-2 rounded overflow-auto max-h-32">
                                      {JSON.stringify(svc.details, null, 2)}
                                    </pre>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
