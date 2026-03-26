interface ServiceHealth {
  serviceId: string;
  status: "up" | "down" | "unknown" | "degraded";
  latencyMs: number;
  lastChecked: string;
  details?: Record<string, unknown>;
  components?: Record<string, { status: string; details?: Record<string, unknown> }>;
}

interface AggregatedHealth {
  services: ServiceHealth[];
  timestamp: string;
}

export class HealthAggregator {
  private services: Record<string, string>;
  private cache: Map<string, ServiceHealth> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number;

  constructor(services: Record<string, string>, pollIntervalMs = 15_000) {
    this.services = services;
    this.pollIntervalMs = pollIntervalMs;
  }

  start() {
    // Poll immediately, then on interval
    this.pollAll();
    this.intervalId = setInterval(() => this.pollAll(), this.pollIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getAll(): AggregatedHealth {
    return {
      services: Array.from(this.cache.values()),
      timestamp: new Date().toISOString(),
    };
  }

  private async pollAll() {
    const entries = Object.entries(this.services);
    await Promise.allSettled(entries.map(([id, url]) => this.pollService(id, url)));
  }

  private async pollService(serviceId: string, baseUrl: string) {
    const start = Date.now();
    try {
      const response = await fetch(`${baseUrl}/actuator/health`, {
        signal: AbortSignal.timeout(10_000),
      });
      const latency = Date.now() - start;

      if (!response.ok) {
        this.cache.set(serviceId, {
          serviceId,
          status: "down",
          latencyMs: latency,
          lastChecked: new Date().toISOString(),
          details: { httpStatus: response.status },
        });
        return;
      }

      const data = await response.json();
      const status = data.status === "UP" ? "up" : data.status === "DOWN" ? "down" : "degraded";

      this.cache.set(serviceId, {
        serviceId,
        status,
        latencyMs: latency,
        lastChecked: new Date().toISOString(),
        details: data.details,
        components: data.components,
      });
    } catch {
      this.cache.set(serviceId, {
        serviceId,
        status: "down",
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
        details: { error: "Connection refused or timeout" },
      });
    }
  }
}
