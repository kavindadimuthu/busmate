export interface HealthResponse {
  status: "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";
  components?: Record<string, HealthComponent>;
  details?: Record<string, unknown>;
}

export interface HealthComponent {
  status: "UP" | "DOWN" | "OUT_OF_SERVICE" | "UNKNOWN";
  details?: Record<string, unknown>;
}

export interface ActuatorMetric {
  name: string;
  description?: string;
  baseUnit?: string;
  measurements: { statistic: string; value: number }[];
  availableTags?: { tag: string; values: string[] }[];
}

export interface MetricsSnapshot {
  serviceId: string;
  timestamp: string;
  httpRequests?: ActuatorMetric;
  jvmMemory?: ActuatorMetric;
  hikariActive?: ActuatorMetric;
  hikariIdle?: ActuatorMetric;
  hikariMax?: ActuatorMetric;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface ServiceMetricsHistory {
  serviceId: string;
  responseTime: TimeSeriesPoint[];
  requestCount: TimeSeriesPoint[];
  jvmMemory: TimeSeriesPoint[];
  dbPoolActive: TimeSeriesPoint[];
}
