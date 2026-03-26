import { ServiceCard } from "./ServiceCard";
import type { ServiceHealthInfo } from "@/types/service";
import { getServices } from "@/lib/services-registry";

interface ServiceStatusGridProps {
  healthData: Array<{
    serviceId: string;
    status: string;
    latencyMs: number;
    lastChecked: string;
    details?: Record<string, unknown>;
    components?: Record<string, { status: string; details?: Record<string, unknown> }>;
  }>;
  onServiceClick?: (serviceId: string) => void;
}

export function ServiceStatusGrid({ healthData, onServiceClick }: ServiceStatusGridProps) {
  const services = getServices();

  // Merge health data with service registry
  const items: ServiceHealthInfo[] = services.map((svc) => {
    const health = healthData.find((h) => h.serviceId === svc.id);
    return {
      serviceId: svc.id,
      name: svc.name,
      baseUrl: svc.baseUrl,
      status: (health?.status as ServiceHealthInfo["status"]) || "unknown",
      latencyMs: health?.latencyMs,
      lastChecked: health?.lastChecked,
      components: health?.components,
    };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <ServiceCard
          key={item.serviceId}
          health={item}
          onClick={() => onServiceClick?.(item.serviceId)}
        />
      ))}
    </div>
  );
}
