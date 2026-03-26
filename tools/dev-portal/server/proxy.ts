import { Router } from "express";

/**
 * Proxy router — forwards API requests to backend services.
 * Only services in the ALLOWED_SERVICES whitelist are reachable (prevents SSRF).
 */
export function proxyRouter(allowedServices: Record<string, string>): Router {
  const router = Router();

  router.post("/request", async (req, res) => {
    const { serviceId, method, path, headers, body, queryParams } = req.body;

    // Validate service against whitelist
    const baseUrl = allowedServices[serviceId];
    if (!baseUrl) {
      res.status(400).json({ error: `Unknown service: ${serviceId}. Allowed: ${Object.keys(allowedServices).join(", ")}` });
      return;
    }

    // Build target URL
    const url = new URL(path || "/", baseUrl);
    if (queryParams && typeof queryParams === "object") {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Forward headers (strip host-related)
    const forwardHeaders: Record<string, string> = {};
    if (headers && typeof headers === "object") {
      for (const [key, value] of Object.entries(headers)) {
        const lower = key.toLowerCase();
        if (lower !== "host" && lower !== "origin" && lower !== "referer") {
          forwardHeaders[key] = String(value);
        }
      }
    }

    const httpMethod = (method || "GET").toUpperCase();
    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: httpMethod,
        headers: forwardHeaders,
      };

      if (body && !["GET", "HEAD"].includes(httpMethod)) {
        fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
        if (!forwardHeaders["Content-Type"] && !forwardHeaders["content-type"]) {
          forwardHeaders["Content-Type"] = "application/json";
          fetchOptions.headers = forwardHeaders;
        }
      }

      const response = await fetch(url.toString(), fetchOptions);
      const elapsed = Date.now() - startTime;

      // Read response body as text
      const responseBody = await response.text();

      // Collect response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Try to parse as JSON for convenience
      let parsedBody: unknown = responseBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        // Keep as string
      }

      res.json({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: parsedBody,
        elapsed,
        url: url.toString(),
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      res.status(502).json({
        error: `Request failed: ${err.message}`,
        elapsed,
        url: url.toString(),
      });
    }
  });

  return router;
}
