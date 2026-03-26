export interface ServiceDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  baseUrl: string;
  openApiPath: string;
  actuatorPath: string;
  color: string;
  icon: string;
}

export type ServiceStatus = "up" | "down" | "unknown" | "degraded";

export interface ServiceHealthInfo {
  serviceId: string;
  status: ServiceStatus;
  latencyMs: number;
  lastChecked: string;
  baseUrl?: string;
  details?: Record<string, unknown>;
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
}

export interface AggregatedHealth {
  services: ServiceHealthInfo[];
  timestamp: string;
}
