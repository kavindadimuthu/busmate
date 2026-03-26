import { useQuery } from "@tanstack/react-query";
import type { OpenApiSpec } from "@/types/openapi";
import { getServiceById } from "@/lib/services-registry";
import axios from "axios";

/**
 * Fetch and cache an OpenAPI spec for a given service.
 * In dev mode, requests go through the Vite proxy → Express server.
 * In production, requests go directly to /api/portal/specs/:id.
 */
export function useOpenApiSpec(serviceId: string) {
  return useQuery<OpenApiSpec>({
    queryKey: ["openapi-spec", serviceId],
    queryFn: async () => {
      const service = getServiceById(serviceId);
      if (!service) throw new Error(`Unknown service: ${serviceId}`);

      // Try proxy server first (works in both dev and prod)
      const { data } = await axios.get(`/api/portal/specs/${serviceId}`);
      return data;
    },
    staleTime: 5 * 60_000, // Cache for 5 minutes
    enabled: !!serviceId,
  });
}
