import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ApiRequestParams } from "@/hooks/useApiRequest";
import type { HttpMethod } from "@/types/openapi";
import { Plus, X, Send, Loader2 } from "lucide-react";

const METHOD_OPTIONS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-method-get/15 text-method-get border-method-get/30",
  POST: "bg-method-post/15 text-method-post border-method-post/30",
  PUT: "bg-method-put/15 text-method-put border-method-put/30",
  PATCH: "bg-method-patch/15 text-method-patch border-method-patch/30",
  DELETE: "bg-method-delete/15 text-method-delete border-method-delete/30",
};

interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestBuilderProps {
  initialMethod?: string;
  initialPath?: string;
  onSend: (params: Omit<ApiRequestParams, "serviceId">) => void;
  loading?: boolean;
}

export function RequestBuilder({
  initialMethod = "GET",
  initialPath = "",
  onSend,
  loading,
}: RequestBuilderProps) {
  const [method, setMethod] = useState(initialMethod.toUpperCase());
  const [path, setPath] = useState(initialPath);
  const [headers, setHeaders] = useState<KeyValue[]>([
    { key: "Content-Type", value: "application/json", enabled: true },
  ]);
  const [queryParams, setQueryParams] = useState<KeyValue[]>([]);
  const [body, setBody] = useState("");

  // Update from URL params when they change
  useEffect(() => {
    if (initialMethod) setMethod(initialMethod.toUpperCase());
  }, [initialMethod]);

  useEffect(() => {
    if (initialPath) setPath(initialPath);
  }, [initialPath]);

  const handleSend = () => {
    const headerObj: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key).forEach((h) => (headerObj[h.key] = h.value));

    const queryObj: Record<string, string> = {};
    queryParams.filter((q) => q.enabled && q.key).forEach((q) => (queryObj[q.key] = q.value));

    let parsedBody: unknown = undefined;
    if (body && !["GET", "HEAD"].includes(method)) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        parsedBody = body;
      }
    }

    onSend({
      method,
      path: path.startsWith("/") ? path : `/${path}`,
      headers: Object.keys(headerObj).length > 0 ? headerObj : undefined,
      queryParams: Object.keys(queryObj).length > 0 ? queryObj : undefined,
      body: parsedBody,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
      {/* URL bar */}
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={cn(
            "px-2 py-1.5 text-xs font-bold rounded-md border cursor-pointer",
            METHOD_COLORS[method] || "bg-muted"
          )}
        >
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m.toUpperCase()}>
              {m.toUpperCase()}
            </option>
          ))}
        </select>
        <Input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/api/v1/resource"
          className="flex-1 font-mono text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !path}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </button>
      </div>

      {/* Tabs for Headers, Query Params, Body */}
      <Tabs defaultValue="headers" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="headers" className="text-xs">
            Headers
            {headers.filter((h) => h.enabled && h.key).length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                {headers.filter((h) => h.enabled && h.key).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="params" className="text-xs">
            Query Params
          </TabsTrigger>
          {!["GET", "HEAD"].includes(method) && (
            <TabsTrigger value="body" className="text-xs">
              Body
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="headers" className="mt-2">
          <KeyValueEditor rows={headers} onChange={setHeaders} />
        </TabsContent>

        <TabsContent value="params" className="mt-2">
          <KeyValueEditor rows={queryParams} onChange={setQueryParams} />
        </TabsContent>

        {!["GET", "HEAD"].includes(method) && (
          <TabsContent value="body" className="mt-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full h-32 p-3 text-sm font-mono rounded-md border border-border bg-muted/30 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function KeyValueEditor({
  rows,
  onChange,
}: {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
}) {
  const addRow = () => {
    onChange([...rows, { key: "", value: "", enabled: true }]);
  };

  const updateRow = (index: number, field: keyof KeyValue, val: string | boolean) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => updateRow(i, "enabled", e.target.checked)}
            className="h-3.5 w-3.5 rounded"
          />
          <Input
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
            placeholder="Key"
            className="h-7 text-xs flex-1"
          />
          <Input
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            placeholder="Value"
            className="h-7 text-xs flex-1"
          />
          <button onClick={() => removeRow(i)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" /> Add row
      </button>
    </div>
  );
}
