import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AggregatedHealth } from "@/types/service";

/**
 * Poll the aggregated health endpoint for all services.
 */
export function useHealthPolling(intervalMs = 10_000) {
  return useQuery<AggregatedHealth>({
    queryKey: ["health-all"],
    queryFn: async () => {
      const { data } = await axios.get("/api/portal/health/all");
      return data;
    },
    refetchInterval: intervalMs,
    staleTime: 5_000,
  });
}
