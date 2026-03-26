import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ServiceSelector } from "@/components/layout/ServiceSelector";
import { RequestBuilder } from "@/components/api-tester/RequestBuilder";
import { ResponseViewer } from "@/components/api-tester/ResponseViewer";
import { HistoryPanel } from "@/components/api-tester/HistoryPanel";
import { useApiRequest, type ApiRequestParams, type ProxyResponse } from "@/hooks/useApiRequest";
import { addToHistory, type HistoryEntry } from "@/lib/request-history";
import { Separator } from "@/components/ui/separator";
import { Zap, PanelRightOpen, PanelRightClose } from "lucide-react";

export function ApiTesterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceId = searchParams.get("service") || "api-core";
  const initialMethod = searchParams.get("method")?.toUpperCase() || "GET";
  const initialPath = searchParams.get("path") || "";

  const [showHistory, setShowHistory] = useState(false);
  const { sendRequest, loading, response, error, reset } = useApiRequest();

  const handleServiceChange = (id: string) => {
    setSearchParams((prev) => {
      prev.set("service", id);
      return prev;
    });
  };

  const handleSend = useCallback(
    async (params: Omit<ApiRequestParams, "serviceId">) => {
      const full: ApiRequestParams = { ...params, serviceId };
      const res = await sendRequest(full);

      // Save to history
      addToHistory({
        serviceId,
        method: params.method,
        path: params.path,
        status: res?.status,
        elapsed: res?.elapsed,
        headers: params.headers,
        queryParams: params.queryParams,
        body: params.body,
      });
    },
    [serviceId, sendRequest]
  );

  const handleSelectHistory = (entry: HistoryEntry) => {
    setSearchParams({
      service: entry.serviceId,
      method: entry.method.toLowerCase(),
      path: entry.path,
    });
    setShowHistory(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">API Tester</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-border hover:bg-accent transition-colors"
          >
            {showHistory ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
            History
          </button>
          <ServiceSelector value={serviceId} onChange={handleServiceChange} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Request builder */}
          <div className="border-b border-border">
            <RequestBuilder
              initialMethod={initialMethod}
              initialPath={initialPath}
              onSend={handleSend}
              loading={loading}
            />
          </div>

          {/* Response viewer */}
          <div className="flex-1 overflow-hidden">
            <ResponseViewer response={response} error={error} loading={loading} />
          </div>
        </div>

        {/* History sidebar */}
        {showHistory && (
          <>
            <Separator orientation="vertical" />
            <div className="w-72 shrink-0 overflow-hidden">
              <HistoryPanel onSelect={handleSelectHistory} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
