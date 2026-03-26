import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useOpenApiSpec } from "@/hooks/useOpenApiSpec";
import { parseOpenApiSpec } from "@/lib/openapi-parser";
import { EndpointList } from "@/components/api-explorer/EndpointList";
import { EndpointDetail } from "@/components/api-explorer/EndpointDetail";
import { ServiceSelector } from "@/components/layout/ServiceSelector";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedEndpoint } from "@/types/openapi";
import { Loader2, AlertCircle, BookOpen } from "lucide-react";

export function ApiExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = searchParams.get("service") || "api-core";
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);

  const { data: spec, isLoading, error } = useOpenApiSpec(serviceId);

  const handleServiceChange = (id: string) => {
    setSearchParams({ service: id });
    setSelectedEndpoint(null);
  };

  const tags = spec ? parseOpenApiSpec(spec) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">API Explorer</h1>
          {spec?.info && (
            <Badge variant="secondary" className="text-xs">
              v{spec.info.version}
            </Badge>
          )}
        </div>
        <ServiceSelector value={serviceId} onChange={handleServiceChange} />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading API specification...</span>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-md p-6 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-sm font-medium">Failed to load API specification</p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure the {serviceId} service is running and the dev-portal server is started.
              </p>
            </Card>
          </div>
        )}

        {spec && !isLoading && (
          <>
            {/* Left panel — endpoint list */}
            <div className="w-80 border-r border-border shrink-0 overflow-hidden">
              <EndpointList
                tags={tags}
                selectedEndpoint={selectedEndpoint}
                onSelect={setSelectedEndpoint}
              />
            </div>

            {/* Right panel — endpoint detail */}
            <div className="flex-1 overflow-hidden">
              {selectedEndpoint ? (
                <EndpointDetail
                  endpoint={selectedEndpoint}
                  spec={spec}
                  serviceId={serviceId}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <BookOpen className="h-10 w-10 mx-auto opacity-30" />
                    <p className="text-sm">Select an endpoint to view details</p>
                    <p className="text-xs">
                      {tags.reduce((sum, t) => sum + t.endpoints.length, 0)} endpoints available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
