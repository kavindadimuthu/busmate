import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ActuatorMetric } from "@/types/health";

/**
 * Fetch a specific actuator metric for a service via the proxy.
 */
export function useMetrics(serviceId: string, metricName: string, enabled = true) {
  return useQuery<ActuatorMetric>({
    queryKey: ["metrics", serviceId, metricName],
    queryFn: async () => {
      const { data } = await axios.post("/proxy/request", {
        serviceId,
        method: "GET",
        path: `/actuator/metrics/${metricName}`,
      });
      return data.body;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: enabled && !!serviceId,
  });
}
