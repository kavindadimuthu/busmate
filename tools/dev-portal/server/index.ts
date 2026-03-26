import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { proxyRouter } from "./proxy.js";
import { HealthAggregator } from "./health-aggregator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3001", 10);

const app = express();
app.use(express.json({ limit: "2mb" }));

// Service whitelist — only these hosts are allowed as proxy targets
const ALLOWED_SERVICES: Record<string, string> = {
  "api-core": process.env.API_CORE_URL || "http://localhost:8080",
  "user-management": process.env.USER_MGMT_URL || "http://localhost:8081",
  "notification": process.env.NOTIFICATION_URL || "http://localhost:8082",
  "location-tracking": process.env.LOCATION_URL || "http://localhost:4000",
};

// Health aggregator — polls all services in background
const healthAggregator = new HealthAggregator(ALLOWED_SERVICES);
healthAggregator.start();

// Proxy routes
app.use("/proxy", proxyRouter(ALLOWED_SERVICES));

// Aggregated health endpoint
app.get("/api/portal/health/all", (_req, res) => {
  res.json(healthAggregator.getAll());
});

// Cached OpenAPI specs
app.get("/api/portal/specs/:serviceId", async (req, res) => {
  const serviceId = req.params.serviceId;
  const baseUrl = ALLOWED_SERVICES[serviceId];
  if (!baseUrl) {
    res.status(404).json({ error: `Unknown service: ${serviceId}` });
    return;
  }
  // Determine OpenAPI spec path by service
  const specPath = serviceId === "location-tracking" ? "/api-spec" : "/v3/api-docs";
  try {
    const response = await fetch(`${baseUrl}${specPath}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const spec = await response.json();
    res.json(spec);
  } catch (err: any) {
    res.status(502).json({ error: `Failed to fetch spec from ${serviceId}: ${err.message}` });
  }
});

// Serve SPA in production
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[dev-portal] Server running at http://localhost:${PORT}`);
  console.log(`[dev-portal] Services: ${Object.entries(ALLOWED_SERVICES).map(([k, v]) => `${k}=${v}`).join(", ")}`);
});
