import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProxyResponse } from "@/hooks/useApiRequest";
import { cn } from "@/lib/utils";
import { Loader2, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface ResponseViewerProps {
  response: ProxyResponse | null;
  error: string | null;
  loading: boolean;
}

export function ResponseViewer({ response, error, loading }: ResponseViewerProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Sending request...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center space-y-2 max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">Request Failed</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm">Send a request to see the response</p>
          <p className="text-xs">Use Ctrl+Enter to send</p>
        </div>
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;
  const bodyStr =
    typeof response.body === "object"
      ? JSON.stringify(response.body, null, 2)
      : String(response.body);

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30">
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs",
            isSuccess
              ? "bg-method-get/15 text-method-get border-method-get/30"
              : "bg-destructive/15 text-destructive border-destructive/30"
          )}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : (
            <AlertCircle className="h-3 w-3 mr-1" />
          )}
          {response.status} {response.statusText}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {response.elapsed}ms
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-auto truncate max-w-xs">
          {response.url}
        </span>
      </div>

      {/* Tabs for body and headers */}
      <Tabs defaultValue="body" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="body" className="text-xs">
            Body
          </TabsTrigger>
          <TabsTrigger value="headers" className="text-xs">
            Headers
            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
              {Object.keys(response.headers).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="flex-1 overflow-hidden px-4 pb-4">
          <ScrollArea className="h-full">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all p-3 rounded-md bg-muted/50 border border-border">
              {bodyStr}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-hidden px-4 pb-4">
          <ScrollArea className="h-full">
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-2 py-1 font-medium">Header</th>
                    <th className="text-left px-2 py-1 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <tr key={key} className="border-t border-border">
                      <td className="px-2 py-1.5 font-mono font-medium">{key}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground break-all">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
