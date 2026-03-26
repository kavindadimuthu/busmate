import { useState } from "react";
import axios from "axios";

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  elapsed: number;
  url: string;
}

export interface ApiRequestParams {
  serviceId: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
}

export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async (params: ApiRequestParams) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data } = await axios.post<ProxyResponse>("/proxy/request", {
        serviceId: params.serviceId,
        method: params.method,
        path: params.path,
        headers: params.headers,
        queryParams: params.queryParams,
        body: params.body,
      });
      setResponse(data);
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Request failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResponse(null);
    setError(null);
  };

  return { sendRequest, loading, response, error, reset };
}
