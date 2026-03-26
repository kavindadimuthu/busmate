import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParameterTable } from "./ParameterTable";
import { SchemaViewer } from "./SchemaViewer";
import type { ParsedEndpoint, OpenApiSpec, HttpMethod } from "@/types/openapi";
import { resolveSchema, resolveRefName } from "@/lib/openapi-parser";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const METHOD_COLORS: Record<HttpMethod, string> = {
  get: "bg-method-get/15 text-method-get border-method-get/30",
  post: "bg-method-post/15 text-method-post border-method-post/30",
  put: "bg-method-put/15 text-method-put border-method-put/30",
  patch: "bg-method-patch/15 text-method-patch border-method-patch/30",
  delete: "bg-method-delete/15 text-method-delete border-method-delete/30",
};

interface EndpointDetailProps {
  endpoint: ParsedEndpoint;
  spec: OpenApiSpec;
  serviceId: string;
}

export function EndpointDetail({ endpoint, spec, serviceId }: EndpointDetailProps) {
  const navigate = useNavigate();

  // Resolve request body schema
  const requestBody = endpoint.requestBody;
  const requestContentType = requestBody?.content
    ? Object.keys(requestBody.content)[0]
    : undefined;
  const requestSchema = requestBody?.content?.[requestContentType || ""]?.schema;
  const resolvedRequestSchema = resolveSchema(requestSchema, spec);

  // Group parameters by location
  const pathParams = endpoint.parameters?.filter((p) => p.in === "path") || [];
  const queryParams = endpoint.parameters?.filter((p) => p.in === "query") || [];
  const headerParams = endpoint.parameters?.filter((p) => p.in === "header") || [];

  const handleTryIt = () => {
    navigate(`/tester?service=${serviceId}&method=${endpoint.method}&path=${encodeURIComponent(endpoint.path)}`);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-mono uppercase px-2 py-0.5",
                  METHOD_COLORS[endpoint.method]
                )}
              >
                {endpoint.method}
              </Badge>
              <code className="text-sm font-mono break-all">{endpoint.path}</code>
              {endpoint.deprecated && (
                <Badge variant="destructive" className="text-[10px]">
                  Deprecated
                </Badge>
              )}
            </div>
            {endpoint.summary && (
              <p className="text-sm font-medium">{endpoint.summary}</p>
            )}
            {endpoint.description && (
              <p className="text-xs text-muted-foreground">{endpoint.description}</p>
            )}
            {endpoint.operationId && (
              <p className="text-xs text-muted-foreground font-mono">
                operationId: {endpoint.operationId}
              </p>
            )}
          </div>
          <button
            onClick={handleTryIt}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try it
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <Separator />

        <Tabs defaultValue="parameters" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="parameters" className="text-xs">
              Parameters
              {(endpoint.parameters?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {endpoint.parameters?.length}
                </Badge>
              )}
            </TabsTrigger>
            {requestBody && (
              <TabsTrigger value="body" className="text-xs">
                Request Body
              </TabsTrigger>
            )}
            <TabsTrigger value="responses" className="text-xs">
              Responses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="mt-3 space-y-4">
            {pathParams.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Path Parameters</h4>
                <ParameterTable parameters={pathParams} spec={spec} />
              </div>
            )}
            {queryParams.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Query Parameters</h4>
                <ParameterTable parameters={queryParams} spec={spec} />
              </div>
            )}
            {headerParams.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Header Parameters</h4>
                <ParameterTable parameters={headerParams} spec={spec} />
              </div>
            )}
            {pathParams.length === 0 && queryParams.length === 0 && headerParams.length === 0 && (
              <p className="text-sm text-muted-foreground">No parameters</p>
            )}
          </TabsContent>

          {requestBody && (
            <TabsContent value="body" className="mt-3 space-y-3">
              {requestBody.description && (
                <p className="text-xs text-muted-foreground">{requestBody.description}</p>
              )}
              {requestContentType && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {requestContentType}
                </Badge>
              )}
              {requestBody.required && (
                <Badge variant="destructive" className="text-[10px] ml-1">
                  Required
                </Badge>
              )}
              {resolvedRequestSchema && (
                <SchemaViewer schema={resolvedRequestSchema} spec={spec} />
              )}
            </TabsContent>
          )}

          <TabsContent value="responses" className="mt-3 space-y-3">
            {Object.entries(endpoint.responses).map(([statusCode, response]) => {
              const contentType = response.content
                ? Object.keys(response.content)[0]
                : undefined;
              const resSchema = response.content?.[contentType || ""]?.schema;
              const resolvedResSchema = resolveSchema(resSchema, spec);

              return (
                <Card key={statusCode} className="border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Badge
                        variant={statusCode.startsWith("2") ? "default" : "secondary"}
                        className="text-[10px] font-mono"
                      >
                        {statusCode}
                      </Badge>
                      <span className="text-muted-foreground font-normal">
                        {response.description}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  {resolvedResSchema && (
                    <CardContent className="py-2 px-3 pt-0">
                      <SchemaViewer schema={resolvedResSchema} spec={spec} />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
